#pragma once
#include <string>
#include <functional>

// Servidor TCP não-bloqueante sobre WiFi (ESP32).
// Chame update() a cada iteração do loop().
class RobotServer {
public:
    using CommandCallback = std::function<void(const std::string&)>;

    bool start();
    void update();
    void sendTelemetry(const std::string& json_data);
    void setCommandCallback(CommandCallback cb);
    bool isClientConnected() const { return client_connected_; }

private:
    bool            client_connected_ = false;
    std::string     partial_buf_;
    CommandCallback command_callback_;
};
