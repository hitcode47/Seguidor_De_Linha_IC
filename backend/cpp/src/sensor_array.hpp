#pragma once
#include <vector>
#include <cstdint>

class SensorArray {
public:
    SensorArray(const uint8_t* pins, int count);

    std::vector<int> read();         // 0 ou 1 por sensor
    float            getPosition();  // -1.0 (esquerda) a +1.0 (direita)
    void             calibrate();
    bool             isLineDetected() const;
    int              getSensorCount() const { return sensor_count_; }

private:
    std::vector<uint8_t> pins_;
    std::vector<int>     last_values_;
    std::vector<int>     calibration_min_;
    std::vector<int>     calibration_max_;
    int                  sensor_count_;
};
