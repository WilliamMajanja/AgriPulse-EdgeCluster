from __future__ import annotations

import asyncio
import logging
import math
import os
import random
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger(__name__)


class Sensor(ABC):
    """Abstract base class for all sensors."""

    name: str

    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    async def read(self) -> dict[str, Any]:
        ...


class DS18B20Sensor(Sensor):
    """Waterproof temperature probe using 1-Wire protocol via /sys/bus/w1/devices/."""

    def __init__(self, name: str, device_id: str) -> None:
        super().__init__(name)
        self.device_id = device_id
        self._device_path = f"/sys/bus/w1/devices/{device_id}/w1_slave"

    async def read(self) -> dict[str, Any]:
        try:
            data = await asyncio.to_thread(self._read_raw)
            if "YES" not in data:
                return {self.name: None, f"{self.name}_error": "CRC check failed"}
            temp_line = data.split("\n")[1]
            temp_str = temp_line.split("t=")[-1]
            temp_c = int(temp_str) / 1000.0
            return {self.name: round(temp_c, 2)}
        except Exception as e:
            logger.warning("DS18B20 %s read failed: %s", self.name, e)
            return {self.name: None, f"{self.name}_error": str(e)}

    def _read_raw(self) -> str:
        with open(self._device_path, "r") as f:
            return f.read()


class SenseHATSensor(Sensor):
    """Raspberry Pi Sense HAT – temperature, humidity, pressure."""

    def __init__(self, name: str = "sense_hat") -> None:
        super().__init__(name)
        self._hat: Any = None
        self._available = False
        self._init_hardware()

    def _init_hardware(self) -> None:
        try:
            from sense_hat import SenseHat

            self._hat = SenseHat()
            self._available = True
            logger.info("Sense HAT initialised")
        except ImportError:
            logger.warning("sense_hat library not available, SenseHATSensor unavailable")
        except Exception as e:
            logger.warning("Sense HAT init failed: %s", e)

    async def read(self) -> dict[str, Any]:
        if not self._available or self._hat is None:
            return self._empty()

        try:
            temp = await asyncio.to_thread(self._hat.get_temperature)
            humidity = await asyncio.to_thread(self._hat.get_humidity)
            pressure = await asyncio.to_thread(self._hat.get_pressure)
            return {
                "temperature_c": round(temp, 1),
                "humidity": round(humidity, 1),
                "pressure": round(pressure, 1),
            }
        except Exception as e:
            logger.warning("Sense HAT read failed: %s", e)
            return self._empty()

    def _empty(self) -> dict[str, Any]:
        return {
            "temperature_c": None,
            "humidity": None,
            "pressure": None,
        }


class ADS1115Sensor(Sensor):
    """ADS1115 16-bit ADC over I2C – reads voltage from analogue channels."""

    def __init__(
        self,
        name: str = "ads1115",
        i2c_address: int = 0x48,
        gain: float = 1.0,
    ) -> None:
        super().__init__(name)
        self.i2c_address = i2c_address
        self.gain = gain
        self._adc: Any = None
        self._available = False
        self._init_hardware()

    def _init_hardware(self) -> None:
        try:
            import board
            import busio
            from adafruit_ads1x15.ads1115 import ADS1115
            from adafruit_ads1x15.analog_in import AnalogIn

            i2c = busio.I2C(board.SCL, board.SDA)
            self._adc = ADS1115(i2c, address=self.i2c_address)
            self._AnalogIn = AnalogIn
            self._available = True
            logger.info("ADS1115 initialised at 0x%02x", self.i2c_address)
        except ImportError:
            logger.warning("adafruit_ads1x15 not available, ADS1115 unavailable")
        except Exception as e:
            logger.warning("ADS1115 init failed: %s", e)

    async def read_channel(self, channel: int) -> Optional[float]:
        if not self._available or self._adc is None:
            return None
        try:
            chan = self._AnalogIn(self._adc, channel)
            voltage = await asyncio.to_thread(lambda: chan.voltage)
            return round(voltage, 4)
        except Exception as e:
            logger.warning("ADS1115 channel %d read failed: %s", channel, e)
            return None

    async def read(self) -> dict[str, Any]:
        return {}


class CapacitiveMoistureSensor(Sensor):
    """Capacitive soil moisture sensor via an ADC channel."""

    def __init__(
        self,
        name: str,
        adc: ADS1115Sensor,
        channel: int,
        dry_voltage: float = 2.6,
        wet_voltage: float = 1.2,
    ) -> None:
        super().__init__(name)
        self.adc = adc
        self.channel = channel
        self.dry_voltage = dry_voltage
        self.wet_voltage = wet_voltage

    async def read(self) -> dict[str, Any]:
        voltage = await self.adc.read_channel(self.channel)
        if voltage is None:
            return {self.name: None}
        moist_pct = (
            (self.dry_voltage - voltage)
            / (self.dry_voltage - self.wet_voltage)
            * 100.0
        )
        moist_pct = max(0.0, min(100.0, moist_pct))
        return {self.name: round(moist_pct, 1)}


class SoilPHSensor(Sensor):
    """Industrial pH probe via an ADC channel with calibration."""

    def __init__(
        self,
        name: str,
        adc: ADS1115Sensor,
        channel: int,
        voltage_at_ph7: float = 1.5,
        slope: float = -0.18,
    ) -> None:
        super().__init__(name)
        self.adc = adc
        self.channel = channel
        self.voltage_at_ph7 = voltage_at_ph7
        self.slope = slope

    async def read(self) -> dict[str, Any]:
        voltage = await self.adc.read_channel(self.channel)
        if voltage is None:
            return {self.name: None}
        ph = 7.0 + (voltage - self.voltage_at_ph7) / self.slope
        ph = max(0.0, min(14.0, ph))
        return {self.name: round(ph, 2)}


class CameraSensor(Sensor):
    """Pi camera module using picamera2."""

    def __init__(self, name: str = "camera") -> None:
        super().__init__(name)
        self._camera: Any = None
        self._available = False
        self._init_hardware()

    def _init_hardware(self) -> None:
        try:
            from picamera2 import Picamera2

            self._camera = Picamera2()
            self._camera.configure(self._camera.create_preview_configuration())
            self._camera.start()
            self._available = True
            logger.info("PiCamera2 initialised")
        except ImportError:
            logger.warning("picamera2 not available, CameraSensor unavailable")
        except Exception as e:
            logger.warning("Camera init failed: %s", e)

    async def capture_still(self, filepath: str) -> Optional[str]:
        if not self._available or self._camera is None:
            return None
        try:
            await asyncio.to_thread(self._camera.capture_file, filepath)
            return filepath
        except Exception as e:
            logger.warning("Camera capture failed: %s", e)
            return None

    async def read(self) -> dict[str, Any]:
        if self._available:
            return {"camera_status": "active"}
        return {"camera_status": "unavailable"}


class SensorManager:
    """Discovers available hardware and reads all sensors with simulation fallback."""

    def __init__(self, config: Optional[dict[str, Any]] = None) -> None:
        self.config = config or {}
        self.sensors: list[Sensor] = []
        self._sim: Optional[SimulatedSensorManager] = None
        self._use_simulation = False
        self._latest: dict[str, Any] = {}

    async def initialize(self) -> None:
        self._discover()

    def _discover(self) -> None:
        adc_config = self.config.get("adc", {})
        adc_address = adc_config.get("i2c_address", 0x48)
        adc_gain = adc_config.get("gain", 1.0)

        sense_hat = SenseHATSensor()
        self.sensors.append(sense_hat)

        adc = ADS1115Sensor(i2c_address=adc_address, gain=adc_gain)
        self.sensors.append(adc)

        ds18b20_ids = self.config.get("ds18b20_devices", {})
        for name, device_id in ds18b20_ids.items():
            self.sensors.append(DS18B20Sensor(name, device_id))

        moisture_configs = self.config.get("moisture_channels", [])
        for cfg in moisture_configs:
            self.sensors.append(
                CapacitiveMoistureSensor(
                    name=cfg.get("name", "moisture"),
                    adc=adc,
                    channel=cfg.get("channel", 0),
                    dry_voltage=cfg.get("dry_voltage", 2.6),
                    wet_voltage=cfg.get("wet_voltage", 1.2),
                )
            )

        ph_config = self.config.get("ph_probe", {})
        self.sensors.append(
            SoilPHSensor(
                name="ph",
                adc=adc,
                channel=ph_config.get("channel", 1),
                voltage_at_ph7=ph_config.get("voltage_at_ph7", 1.5),
                slope=ph_config.get("slope", -0.18),
            )
        )

        self.sensors.append(CameraSensor())

        self._sim = SimulatedSensorManager()
        self._check_hardware()

    def _check_hardware(self) -> None:
        hardware_available = any(
            isinstance(s, (SenseHATSensor, ADS1115Sensor, DS18B20Sensor))
            and (
                (isinstance(s, SenseHATSensor) and s._available)
                or (isinstance(s, ADS1115Sensor) and s._available)
                or isinstance(s, DS18B20Sensor)
            )
            for s in self.sensors
        )
        if not hardware_available:
            logger.warning(
                "No real hardware detected – falling back to simulation mode"
            )
            self._use_simulation = True

    def get_latest(self) -> dict[str, Any]:
        return self._latest

    def set_camera_active(self, state: bool) -> None:
        if self._sim:
            self._sim.set_camera_active(state)

    def set_permaculture_mode(self, state: bool) -> None:
        if self._sim:
            self._sim.set_permaculture_mode(state)

    async def read_all(self) -> dict[str, Any]:
        if self._use_simulation:
            result = await self._sim.read_all()
            self._latest = result
            return result

        result: dict[str, Any] = {}
        tasks = [s.read() for s in self.sensors]
        readings = await asyncio.gather(*tasks, return_exceptions=True)

        for sensor, reading in zip(self.sensors, readings):
            if isinstance(reading, dict):
                result.update(reading)
            else:
                logger.warning(
                    "Sensor %s raised: %s", sensor.name, reading
                )

        result.setdefault("temperature_c", None)
        result.setdefault("humidity", None)
        result.setdefault("pressure", None)
        result.setdefault("moisture_pct", None)
        result.setdefault("ph", None)
        result.setdefault("nitrogen_ppm", None)
        result.setdefault("phosphorus_ppm", None)
        result.setdefault("potassium_ppm", None)
        result.setdefault("ammonia_ppm", None)
        result.setdefault("ds18b20_1_c", None)
        result.setdefault("ds18b20_2_c", None)
        result.setdefault("camera_status", "unavailable")
        result.setdefault("joystick_event", None)

        self._latest = result
        return result


class SimulatedSensorManager:
    """Produces realistic fluctuating agricultural sensor values."""

    def __init__(self) -> None:
        self._tick_count = 0
        self._latest: dict[str, Any] = {}
        self._base_temp = 26.0
        self._base_humidity = 65.0
        self._base_moisture = 55.0
        self._base_ph = 6.8
        self._base_nitrogen = 120.0
        self._base_phosphorus = 60.0
        self._base_potassium = 150.0
        self._base_ammonia = 2.5
        self._joystick_cooldown = 0
        self._is_camera_active = False
        self._permaculture_mode = False
        self._detections_today = 0

    def get_latest(self) -> dict[str, Any]:
        return self._latest

    def set_camera_active(self, state: bool) -> None:
        self._is_camera_active = state
        if not state:
            self._latest["camera_status"] = "Healthy"

    def set_permaculture_mode(self, state: bool) -> None:
        self._permaculture_mode = state

    def tick(self) -> None:
        self._tick_count += 1

    async def read_all(self) -> dict[str, Any]:
        self.tick()
        t = self._tick_count
        noise = lambda scale: (random.random() - 0.5) * scale

        diurnal = 5.0 * math.sin(2 * math.pi * (t % 1440) / 1440 - math.pi / 2)
        temperature_c = round(
            self._base_temp + diurnal + noise(0.4), 1
        )
        temperature_c = max(18.0, min(35.0, temperature_c))

        humidity = round(
            self._base_humidity + noise(2.0), 1
        )
        humidity = max(40.0, min(90.0, humidity))

        pressure = round(1013.0 + noise(5.0), 1)

        moisture_pct = round(
            self._base_moisture + noise(1.5), 1
        )
        moisture_pct = max(20.0, min(100.0, moisture_pct))

        ph = round(
            self._base_ph + noise(0.1), 2
        )
        ph = max(5.5, min(8.0, ph))

        nitrogen_ppm = round(
            self._base_nitrogen + noise(5.0), 1
        )
        nitrogen_ppm = max(0.0, nitrogen_ppm)

        phosphorus_ppm = round(
            self._base_phosphorus + noise(3.0), 1
        )
        phosphorus_ppm = max(0.0, phosphorus_ppm)

        potassium_ppm = round(
            self._base_potassium + noise(4.0), 1
        )
        potassium_ppm = max(0.0, potassium_ppm)

        ammonia_ppm = round(
            self._base_ammonia + noise(0.5), 2
        )
        ammonia_ppm = max(0.0, ammonia_ppm)

        ds18b20_1_c = round(
            self._base_temp + diurnal + noise(0.3) - 0.5, 1
        )
        ds18b20_2_c = round(
            self._base_temp + diurnal + noise(0.3) + 0.3, 1
        )

        camera_status = "Leaf Rust" if (self._is_camera_active and t % 20 == 0) else "Healthy"
        inference_latency_ms = 38 + random.randint(0, 9)

        if self._is_camera_active and camera_status == "Leaf Rust":
            self._detections_today += 1
        elif not self._is_camera_active:
            self._detections_today = max(0, self._detections_today - 1)

        if self._joystick_cooldown > 0:
            self._joystick_cooldown -= 1

        joystick_event: Optional[str] = None
        if self._joystick_cooldown == 0 and random.random() < 0.03:
            joystick_event = random.choice(
                ["UP", "DOWN", "LEFT", "RIGHT", "CLICK"]
            )
            self._joystick_cooldown = 10

        result = {
            "temperature_c": temperature_c,
            "humidity": humidity,
            "pressure": pressure,
            "moisture_pct": moisture_pct,
            "ph": ph,
            "nitrogen_ppm": nitrogen_ppm,
            "phosphorus_ppm": phosphorus_ppm,
            "potassium_ppm": potassium_ppm,
            "ammonia_ppm": ammonia_ppm,
            "ds18b20_1_c": ds18b20_1_c,
            "ds18b20_2_c": ds18b20_2_c,
            "camera_status": camera_status,
            "inference_latency_ms": inference_latency_ms,
            "detections_today": self._detections_today,
            "is_camera_active": self._is_camera_active,
            "joystick_event": joystick_event,
            "permaculture_mode": self._permaculture_mode,
            "last_fingerprint": "0x" + "".join(random.choices("0123456789abcdef", k=16)),
            "last_txid": "0x" + "".join(random.choices("0123456789abcdef", k=64)),
        }
        self._latest = result
        return result
