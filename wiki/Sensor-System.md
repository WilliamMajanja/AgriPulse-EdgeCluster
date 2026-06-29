# Sensor System

## Modes

### Simulated Mode (Default)

`SENSOR_MODE=simulated` uses `SimulatedSensorManager` which generates realistic sensor data:
- Diurnal temperature curve (±8°C over 24h)
- Humidity with random noise (±5%)
- Moisture with gradual drift
- pH with small random variation
- NPK levels with occasional spikes
- Random disease detections for testing AI features

### Real Mode

`SENSOR_MODE=real` uses `SensorManager` which reads from actual hardware:
- **Sense HAT**: Temperature, humidity, pressure (I2C)
- **ADS1115**: 3x moisture sensors, pH probe, ammonia sensor (I2C ADC)
- **DS18B20**: 2x waterproof temperature probes (1-Wire)
- **Camera**: Global shutter camera for crop monitoring (CSI-2)

## Reading Cycle

The sensor manager reads all sensors every **2.5 seconds** and stores the latest values in memory. The WebSocket data stream pushes these readings to all connected clients.

## Sensor Thresholds

| Parameter       | Low     | Optimal        | High    |
|----------------|---------|----------------|---------|
| Moisture       | < 30%   | 30-80%         | > 80%   |
| pH             | < 5.5   | 5.5-7.5        | > 8.0   |
| Temperature    | < 10°C  | 15-30°C        | > 35°C  |
| Nitrogen (N)   | < 40 ppm| 40-200 ppm     | > 300 ppm|
| Phosphorus (P) | < 20 ppm| 20-100 ppm     | > 150 ppm|
| Potassium (K)  | < 60 ppm| 60-250 ppm     | > 350 ppm|

## Permaculture Enforcement Mode

When enabled, the system adjusts automation to follow permaculture principles:
- Slower, more conservative irrigation cycles
- Companion planting-aware scheduling
- Closed-loop nutrient management prioritized
- Reduced water usage during certain growth phases
