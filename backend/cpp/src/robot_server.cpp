#include "robot_server.hpp"
#include <Arduino.h>
#include <WiFi.h>
#include "config.h"

// Instâncias estáticas do WiFi (não podem ficar no header — dependem de WiFi.h)
static WiFiServer tcp_server(TCP_PORT);
static WiFiClient tcp_client;

bool RobotServer::start() {
    tcp_server.begin();
    Serial.printf("[Server] TCP ativo na porta %d\n", TCP_PORT);
    Serial.printf("[Server] IP do robô: %s\n", WiFi.localIP().toString().c_str());
    Serial.println("[Server] Configure ROBOT_HOST no Python com esse IP");
    return true;
}

void RobotServer::update() {
    // Aceita novo cliente se o anterior desconectou
    if (!tcp_client || !tcp_client.connected()) {
        WiFiClient novo = tcp_server.available();
        if (novo) {
            tcp_client        = novo;
            client_connected_ = true;
            partial_buf_.clear();
            Serial.println("[Server] Python conectado");
        } else {
            client_connected_ = false;
        }
    }

    // Lê bytes disponíveis (não bloqueante)
    while (tcp_client && tcp_client.available()) {
        char c = static_cast<char>(tcp_client.read());
        if (c == '\n') {
            if (!partial_buf_.empty() && command_callback_)
                command_callback_(partial_buf_);
            partial_buf_.clear();
        } else if (c != '\r') {
            partial_buf_ += c;
        }
    }
}

void RobotServer::sendTelemetry(const std::string& json_data) {
    if (!client_connected_ || !tcp_client.connected()) return;
    tcp_client.println(json_data.c_str());
}

void RobotServer::setCommandCallback(CommandCallback cb) {
    command_callback_ = std::move(cb);
}
