#pragma once
#include <cstdint>

class MotorDriver {
public:
    MotorDriver(uint8_t left_pwm,   uint8_t right_pwm,
                uint8_t left_dir_a, uint8_t left_dir_b,
                uint8_t right_dir_a, uint8_t right_dir_b);

    void setSpeed(int left, int right);  // -255 a 255
    void stop();
    void brake();

    int getLeftSpeed()  const { return left_speed_;  }
    int getRightSpeed() const { return right_speed_; }

private:
    uint8_t left_pwm_,   right_pwm_;
    uint8_t left_dir_a_,  left_dir_b_;
    uint8_t right_dir_a_, right_dir_b_;
    int     left_speed_,  right_speed_;

    void setMotor(uint8_t pwm_pin, uint8_t dir_a, uint8_t dir_b, int speed);
};
