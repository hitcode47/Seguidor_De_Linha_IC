#include "pid_controller.hpp"
#include <algorithm>

PIDController::PIDController(float kp, float ki, float kd,
                               float output_min, float output_max)
    : kp_(kp), ki_(ki), kd_(kd),
      integral_(0.0f), prev_error_(0.0f),
      output_min_(output_min), output_max_(output_max),
      last_output_(0.0f) {}

float PIDController::compute(float error, float dt) {
    if (dt <= 0.0f) return last_output_;

    integral_ += error * dt;

    // Anti-windup
    float max_integral = (output_max_ - output_min_) / (ki_ > 1e-6f ? ki_ : 1.0f);
    integral_ = std::clamp(integral_, -max_integral, max_integral);

    float derivative = (error - prev_error_) / dt;
    prev_error_ = error;

    float output = kp_ * error + ki_ * integral_ + kd_ * derivative;
    last_output_ = std::clamp(output, output_min_, output_max_);
    return last_output_;
}

void PIDController::setGains(float kp, float ki, float kd) {
    kp_ = kp; ki_ = ki; kd_ = kd;
    reset();
}

void PIDController::getGains(float& kp, float& ki, float& kd) const {
    kp = kp_; ki = ki_; kd = kd_;
}

void PIDController::reset() {
    integral_    = 0.0f;
    prev_error_  = 0.0f;
    last_output_ = 0.0f;
}
