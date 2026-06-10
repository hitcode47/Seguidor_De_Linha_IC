#include "motor_driver.hpp"
#include <Arduino.h>
#include <algorithm>
#include <cstdlib>

// LEDC (PWM interno do ESP32)
#define PWM_FREQ_HZ  1000
#define PWM_BITS     8       // resolução: 0–255

MotorDriver::MotorDriver(uint8_t left_pwm,   uint8_t right_pwm,
                          uint8_t left_dir_a, uint8_t left_dir_b,
                          uint8_t right_dir_a, uint8_t right_dir_b)
    : left_pwm_(left_pwm),    right_pwm_(right_pwm),
      left_dir_a_(left_dir_a),   left_dir_b_(left_dir_b),
      right_dir_a_(right_dir_a), right_dir_b_(right_dir_b),
      left_speed_(0), right_speed_(0) {

    pinMode(left_dir_a_,  OUTPUT);
    pinMode(left_dir_b_,  OUTPUT);
    pinMode(right_dir_a_, OUTPUT);
    pinMode(right_dir_b_, OUTPUT);

    // API nova do ESP32 Arduino Core 3.x
    ledcAttach(left_pwm_,  PWM_FREQ_HZ, PWM_BITS);
    ledcAttach(right_pwm_, PWM_FREQ_HZ, PWM_BITS);

    stop();
}

void MotorDriver::setMotor(uint8_t pwm_pin, uint8_t dir_a, uint8_t dir_b, int speed) {
    if (speed >= 0) {
        digitalWrite(dir_a, HIGH);
        digitalWrite(dir_b, LOW);
    } else {
        digitalWrite(dir_a, LOW);
        digitalWrite(dir_b, HIGH);
    }
    ledcWrite(pwm_pin, static_cast<uint32_t>(std::abs(speed)));
}

void MotorDriver::setSpeed(int left, int right) {
    left_speed_  = std::clamp(left,  -255, 255);
    right_speed_ = std::clamp(right, -255, 255);
    setMotor(left_pwm_,  left_dir_a_,  left_dir_b_,  left_speed_);
    setMotor(right_pwm_, right_dir_a_, right_dir_b_, right_speed_);
}

void MotorDriver::stop() {
    setSpeed(0, 0);
}

void MotorDriver::brake() {
    // Freio ativo: ambas direções em HIGH
    digitalWrite(left_dir_a_,  HIGH);
    digitalWrite(left_dir_b_,  HIGH);
    digitalWrite(right_dir_a_, HIGH);
    digitalWrite(right_dir_b_, HIGH);
    ledcWrite(left_pwm_,  0);
    ledcWrite(right_pwm_, 0);
    left_speed_ = right_speed_ = 0;
}
