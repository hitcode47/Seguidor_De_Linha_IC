#include "sensor_array.hpp"
#include <Arduino.h>
#include <numeric>
#include <algorithm>
#include <cmath>

SensorArray::SensorArray(const uint8_t* pins, int count)
    : sensor_count_(count),
      last_values_(count, 0),
      calibration_min_(count, 0),
      calibration_max_(count, 1) {

    for (int i = 0; i < count; i++) {
        pins_.push_back(pins[i]);
        pinMode(pins[i], INPUT);
    }
}

std::vector<int> SensorArray::read() {
    for (int i = 0; i < sensor_count_; i++)
        last_values_[i] = digitalRead(pins_[i]);
    return last_values_;
}

float SensorArray::getPosition() {
    int total = std::accumulate(last_values_.begin(), last_values_.end(), 0);
    if (total == 0) return 0.0f;

    float weighted = 0.0f;
    for (int i = 0; i < sensor_count_; i++)
        weighted += last_values_[i] * i;

    float center = static_cast<float>(sensor_count_ - 1) / 2.0f;
    return (weighted / total - center) / center;  // -1.0 a +1.0
}

bool SensorArray::isLineDetected() const {
    for (int v : last_values_)
        if (v) return true;
    return false;
}

void SensorArray::calibrate() {
    Serial.println("[Sensor] Calibrando... mova o robô sobre a linha");

    for (int iter = 0; iter < 300; iter++) {
        auto vals = read();
        for (int i = 0; i < sensor_count_; i++) {
            calibration_min_[i] = std::min(calibration_min_[i], vals[i]);
            calibration_max_[i] = std::max(calibration_max_[i], vals[i]);
        }
        delay(10);
    }

    Serial.println("[Sensor] Calibração concluída");
}
