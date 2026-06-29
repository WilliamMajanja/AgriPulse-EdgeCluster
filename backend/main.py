import asyncio
import json
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.routes import router as api_router
from backend.websocket_manager import ConnectionManager
from backend.sensors import SensorManager, SimulatedSensorManager
from backend.ollama_service import get_architect_response

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
SENSOR_MODE = os.getenv("SENSOR_MODE", "simulated").lower()

sensor_manager: SensorManager | SimulatedSensorManager | None = None
ws_manager: ConnectionManager | None = None

actuator_state = {
    "pump": False,
    "misters": False,
    "lights": False,
    "fans": False,
    "last_fertilization": None,
}


def build_system_data(sensor_readings: dict, logs: list) -> dict:
    uptime = _calc_uptime()
    return {
        "master": {
            "id": "master",
            "name": "PI-NET MASTER NODE",
            "status": "online",
            "uptime": uptime,
            "pinet_clients": 2,
            "actuators": {
                "pump": {"on": actuator_state["pump"]},
                "misters": {"on": actuator_state["misters"]},
                "lights": {"on": actuator_state["lights"]},
                "fans": {"on": actuator_state["fans"]},
                "lastFertilization": actuator_state["last_fertilization"],
            },
        },
        "sentry": {
            "id": "sentry",
            "name": "SENTRY NODE (HAILO AI)",
            "status": "online",
            "detection": sensor_readings.get("camera_status", "Healthy"),
            "latency": sensor_readings.get("inference_latency_ms", 42),
            "detectionsToday": sensor_readings.get("detections_today", 0),
            "isCameraActive": sensor_readings.get("is_camera_active", False),
        },
        "telemetry": {
            "id": "telemetry",
            "name": "TELEMETRY NODE (SENSORS)",
            "status": "online",
            "temperature": sensor_readings.get("temperature_c", 24.0),
            "humidity": sensor_readings.get("humidity", 65.0),
            "pressure": sensor_readings.get("pressure", 1013.0),
            "moisture": sensor_readings.get("moisture_pct", 70.0),
            "ph": sensor_readings.get("ph", 7.0),
            "nitrogen": sensor_readings.get("nitrogen_ppm", 100),
            "phosphorus": sensor_readings.get("phosphorus_ppm", 50),
            "potassium": sensor_readings.get("potassium_ppm", 120),
            "ammonia": sensor_readings.get("ammonia_ppm", 3.0),
            "permacultureMode": sensor_readings.get("permaculture_mode", False),
            "joystick": sensor_readings.get("joystick_event", "idle"),
            "lastFingerprint": sensor_readings.get("last_fingerprint", "..."),
            "lastTxID": sensor_readings.get("last_txid", "..."),
        },
        "logs": logs[-100:] if logs else [],
    }


def _calc_uptime() -> str:
    from datetime import datetime, timezone
    start = getattr(_calc_uptime, "_start", None)
    if start is None:
        _calc_uptime._start = datetime.now(timezone.utc)
        start = _calc_uptime._start
    delta = datetime.now(timezone.utc) - start
    days = delta.days
    hours, rem = divmod(delta.seconds, 3600)
    minutes, seconds = divmod(rem, 60)
    return f"{days}d {hours}h {minutes}m {seconds}s"


logs = []


def add_log(source: str, message: str):
    logs.insert(0, {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "message": message,
    })
    if len(logs) > 100:
        logs[:] = logs[:100]


def exec_tool_callback(name: str, args: dict) -> dict:
    dispatch = {
        "toggle_sentry_camera": _toggle_camera,
        "load_ai_model": _load_model,
        "control_pump": _control_pump,
        "control_misters": _control_misters,
        "control_fertilizer_line": _control_fertilizer,
        "toggle_permaculture_mode": _toggle_permaculture,
        "control_lights": _control_lights,
        "control_fans": _control_fans,
    }
    handler = dispatch.get(name)
    if handler:
        return handler(args)
    add_log("SYSTEM", f"Unknown tool called: {name}")
    return {"status": "error", "detail": f"Unknown tool: {name}"}


def _toggle_camera(args: dict) -> dict:
    state = args.get("state") == "on"
    add_log("SYSTEM", f"Sentry camera {'activated' if state else 'deactivated'}.")
    if sensor_manager:
        sensor_manager.set_camera_active(state)
    return {"status": "ok", "detail": f"Camera turned {'on' if state else 'off'}."}


def _load_model(args: dict) -> dict:
    model = args.get("model_name", "")
    add_log("SENTRY", f"AI command received: Load model '{model}'.")
    return {"status": "ok", "detail": f"Model {model} loaded onto Hailo-10H NPU."}


def _control_pump(args: dict) -> dict:
    state = args.get("state") == "on"
    actuator_state["pump"] = state
    duration = args.get("duration_minutes", 0)
    msg = f"Water pump turned {'ON' if state else 'OFF'}"
    if state and duration > 0:
        msg += f" for {duration} minutes"
        async def auto_off():
            await asyncio.sleep(duration * 60)
            actuator_state["pump"] = False
            add_log("SYSTEM", "Water pump cycle finished.")
        asyncio.create_task(auto_off())
    add_log("SYSTEM", msg + ".")
    return {"status": "ok", "detail": "Pump command executed."}


def _control_misters(args: dict) -> dict:
    state = args.get("state") == "on"
    actuator_state["misters"] = state
    duration = args.get("duration_minutes", 0)
    msg = f"Mister system turned {'ON' if state else 'OFF'}"
    if state and duration > 0:
        msg += f" for {duration} minutes"
        async def auto_off():
            await asyncio.sleep(duration * 60)
            actuator_state["misters"] = False
            add_log("SYSTEM", "Mister cycle finished.")
        asyncio.create_task(auto_off())
    add_log("SYSTEM", msg + ".")
    return {"status": "ok", "detail": "Mister command executed."}


def _control_fertilizer(args: dict) -> dict:
    nutrient = args.get("nutrient", "N")
    amount = args.get("amount_ml", 0)
    actuator_state["last_fertilization"] = {
        "nutrient": nutrient,
        "amount": amount,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    add_log("SYSTEM", f"Fertilizer line activated. Dispensing {amount}ml of {nutrient}.")
    return {"status": "ok", "detail": "Fertilizer command executed."}


def _toggle_permaculture(args: dict) -> dict:
    state = bool(args.get("state", False))
    if sensor_manager:
        sensor_manager.set_permaculture_mode(state)
    add_log("TELEMETRY", f"Permaculture Enforcement mode {'ACTIVATED' if state else 'DEACTIVATED'}.")
    return {"status": "ok", "detail": f"Permaculture mode set to {state}."}


def _control_lights(args: dict) -> dict:
    state = args.get("state") == "on"
    actuator_state["lights"] = state
    add_log("SYSTEM", f"LED Grow Lights turned {'ON' if state else 'OFF'}.")
    return {"status": "ok", "detail": "Lights command executed."}


def _control_fans(args: dict) -> dict:
    state = args.get("state") == "on"
    actuator_state["fans"] = state
    add_log("SYSTEM", f"Ventilation Fans turned {'ON' if state else 'OFF'}.")
    return {"status": "ok", "detail": "Fans command executed."}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sensor_manager, ws_manager

    init_db()

    if SENSOR_MODE == "real":
        try:
            sensor_manager = SensorManager()
            await sensor_manager.initialize()
            add_log("SYSTEM", "Hardware sensor manager initialized.")
        except Exception as e:
            add_log("SYSTEM", f"Failed to init hardware sensors, falling back to simulation: {e}")
            sensor_manager = SimulatedSensorManager()
    else:
        sensor_manager = SimulatedSensorManager()
        add_log("SYSTEM", "Simulated sensor manager initialized.")

    add_log("MASTER", "PiNet server online. 2 clients connected.")
    add_log("SENTRY", "Hailo-10H NPU initialized. Global Shutter Camera active.")
    add_log("TELEMETRY", "Sense Hat, ADS1115 ADC, and Soil Probes online. Minima node synced.")

    ws_manager = ConnectionManager(
        get_system_data=lambda: build_system_data(
            sensor_manager.get_latest() if sensor_manager else {},
            logs,
        ),
        alert_queue=asyncio.Queue(),
        exec_tool_callback=exec_tool_callback,
    )

    sensor_task = asyncio.create_task(_sensor_loop())

    yield

    sensor_task.cancel()
    try:
        await sensor_task
    except asyncio.CancelledError:
        pass


async def _sensor_loop():
    while True:
        await asyncio.sleep(2.5)
        if sensor_manager:
            await sensor_manager.read_all()


app = FastAPI(
    title="AgriPulse FMIS",
    description="Farm Management Information System with sovereign edge computing control",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.websocket("/ws")
async def websocket_endpoint(websocket):
    if not ws_manager:
        await websocket.close(code=1011, reason="Server not ready")
        return
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            await ws_manager.handle_message(websocket, msg)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await ws_manager.disconnect(websocket)


if os.path.isdir(FRONTEND_DIR):
    static_dir = os.path.join(FRONTEND_DIR, "static")
    if os.path.isdir(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")


    @app.get("/{full_path:path}")
    async def serve_frontend_html(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("static/"):
            raise HTTPException(status_code=404)

        if not full_path or full_path == "" or os.path.isdir(os.path.join(FRONTEND_DIR, full_path)):
            full_path = "index.html"

        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(index_path):
            return FileResponse(index_path)

        raise HTTPException(status_code=404)
