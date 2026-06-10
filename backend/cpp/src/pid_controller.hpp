#pragma once

class PIDController {
public:
    PIDController(float kp, float ki, float kd,
                  float output_min = -255.0f, float output_max = 255.0f);

    float compute(float error, float dt);
    void  setGains(float kp, float ki, float kd);
    void  getGains(float& kp, float& ki, float& kd) const;
    void  reset();
    float getLastOutput() const { return last_output_; }

private:
    float kp_, ki_, kd_;
    float integral_;
    float prev_error_;
    float output_min_, output_max_;
    float last_output_;
};
