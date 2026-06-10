#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>

#include "config.h"
#include "pid_controller.hpp"
#include "sensor_array.hpp"
#include "motor_driver.hpp"
#include "robot_server.hpp"

// ─── Objetos globais ──────────────────────────────────────────────────────────
SensorArray*  sensors = nullptr;
MotorDriver*  motors  = nullptr;
PIDController* pid    = nullptr;
RobotServer    server;

// ─── Estado do robô ───────────────────────────────────────────────────────────
bool  g_running    = false;
float g_kp         = DEFAULT_KP;
float g_ki         = DEFAULT_KI;
float g_kd         = DEFAULT_KD;
int   g_base_speed = DEFAULT_BASE_SPEED;

unsigned long last_loop_ms      = 0;
unsigned long last_telemetry_ms = 0;

// ─── Conexão WiFi ─────────────────────────────────────────────────────────────
void connectWiFi() {
    Serial.printf("\n[WiFi] Conectando a '%s'", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - start > 15000) {
            Serial.println("\n[WiFi] Timeout! Reiniciando...");
            ESP.restart();
        }
        delay(500);
        Serial.print(".");
    }

    Serial.printf("\n[WiFi] Conectado! IP: %s\n", WiFi.localIP().toString().c_str());

    if (MDNS.begin("robo")) {
        Serial.println("[mDNS] Acessível em: robo.local");
    }
}

// ─── Processamento de comandos vindos do Python ───────────────────────────────
void processCommand(const std::string& msg) {
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (err) {
        Serial.printf("[CMD] Erro JSON: %s\n", err.c_str());
        return;
    }

    const char* type = doc["type"] | "";

    if (strcmp(type, "start") == 0) {
        pid->reset();
        g_running = true;
        Serial.println("[CMD] Iniciado");

    } else if (strcmp(type, "stop") == 0) {
        g_running = false;
        motors->stop();
        Serial.println("[CMD] Parado");

    } else if (strcmp(type, "calibrate") == 0) {
        g_running = false;
        motors->stop();
        sensors->calibrate();

    } else if (strcmp(type, "set_pid") == 0) {
        g_kp = doc["kp"] | g_kp;
        g_ki = doc["ki"] | g_ki;
        g_kd = doc["kd"] | g_kd;
        pid->setGains(g_kp, g_ki, g_kd);
        Serial.printf("[CMD] PID -> Kp=%.3f Ki=%.3f Kd=%.3f\n", g_kp, g_ki, g_kd);

    } else if (strcmp(type, "set_speed") == 0) {
        g_base_speed = doc["base_speed"] | g_base_speed;
        Serial.printf("[CMD] Velocidade base: %d\n", g_base_speed);
    }
}

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("=== Seguidor de Linha — ESP32-S3 ===");

    connectWiFi();

    sensors = new SensorArray(SENSOR_PINS, SENSOR_COUNT);
    motors  = new MotorDriver(MOTOR_L_PWM, MOTOR_R_PWM,
                               MOTOR_L_DIR_A, MOTOR_L_DIR_B,
                               MOTOR_R_DIR_A, MOTOR_R_DIR_B);
    pid = new PIDController(g_kp, g_ki, g_kd, -255.0f, 255.0f);

    server.setCommandCallback(processCommand);
    server.start();

    Serial.println("Sistema pronto. Aguardando conexão do Python...");
}

// ─── Loop principal ───────────────────────────────────────────────────────────
void loop() {
    // Atualiza servidor TCP (aceita conexão / lê comandos)
    server.update();

    unsigned long now = millis();
    float dt = (now - last_loop_ms) / 1000.0f;
    last_loop_ms = now;

    // Descarta dt absurdo no primeiro frame
    if (dt > 0.1f) dt = 0.01f;

    // Lê sensores
    auto  sensor_values = sensors->read();
    float position      = sensors->getPosition();
    bool  line_detected = sensors->isLineDetected();

    int   left_speed = 0, right_speed = 0;
    float pid_output = 0.0f;

    if (g_running) {
        if (line_detected) {
            pid_output  = pid->compute(position, dt);
            left_speed  = constrain((int)(g_base_speed + pid_output), -255, 255);
            right_speed = constrain((int)(g_base_speed - pid_output), -255, 255);
            motors->setSpeed(left_speed, right_speed);
        } else {
            motors->stop();
        }
    }

    // Telemetria a ~50 Hz
    if (now - last_telemetry_ms >= 20 && server.isClientConnected()) {
        JsonDocument doc;
        doc["type"]          = "telemetry";
        doc["position"]      = position;
        doc["left_speed"]    = left_speed;
        doc["right_speed"]   = right_speed;
        doc["pid_output"]    = pid_output;
        doc["line_detected"] = line_detected;
        doc["timestamp"]     = now;

        JsonArray arr = doc["sensors"].to<JsonArray>();
        for (int v : sensor_values) arr.add(v);

        std::string json_str;
        serializeJson(doc, json_str);
        server.sendTelemetry(json_str);
        last_telemetry_ms = now;
    }

    delay(10);  // ~100 Hz
}
