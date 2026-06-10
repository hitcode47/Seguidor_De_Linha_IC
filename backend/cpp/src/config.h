#pragma once
#include <cstdint>

// ─── WiFi ────────────────────────────────────────────────────────────────────
#define WIFI_SSID     "SuaRedeWiFi"   // <-- altere aqui
#define WIFI_PASSWORD "SuaSenha"      // <-- altere aqui
#define TCP_PORT      9001

// ─── Sensores IR — GPIO ESP32-S3 ─────────────────────────────────────────────
#define SENSOR_COUNT 8
inline constexpr uint8_t SENSOR_PINS[SENSOR_COUNT] = { 1, 2, 3, 4, 5, 6, 7, 8 };

// ─── Motor Esquerdo ──────────────────────────────────────────────────────────
//   L298N:  ENA → PWM   |  IN1 → DIR_A  |  IN2 → DIR_B
#define MOTOR_L_PWM    38
#define MOTOR_L_DIR_A  39
#define MOTOR_L_DIR_B  40

// ─── Motor Direito ───────────────────────────────────────────────────────────
//   L298N:  ENB → PWM   |  IN3 → DIR_A  |  IN4 → DIR_B
#define MOTOR_R_PWM    41
#define MOTOR_R_DIR_A  42
#define MOTOR_R_DIR_B  43

// ─── PID padrão ──────────────────────────────────────────────────────────────
#define DEFAULT_KP         1.5f
#define DEFAULT_KI         0.0f
#define DEFAULT_KD         0.8f
#define DEFAULT_BASE_SPEED 150
