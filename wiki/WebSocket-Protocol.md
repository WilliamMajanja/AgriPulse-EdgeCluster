# WebSocket Protocol

## Connection

Connect to `ws://host:8000/ws` using the global `WsClient` singleton (instantiated in `api.js`).

## Client → Server Messages

### Subscribe to Data Stream
```json
{ "action": "subscribe" }
```
Starts a continuous stream of system data every 2.5 seconds.

### AI Chat
```json
{ "action": "chat", "messages": [{"role": "user", "content": "How is my soil?"}] }
```
Sends conversation history to the AI Architect (Ollama).

### Execute Tool
```json
{ "action": "exec_tool", "name": "control_pump", "args": { "state": "on", "duration_minutes": 15 } }
```
Available tools:
- `toggle_sentry_camera` (state: "on"/"off")
- `load_ai_model` (model_name: string)
- `control_pump` (state: "on"/"off", duration_minutes?: number)
- `control_misters` (state: "on"/"off", duration_minutes?: number)
- `control_fertilizer_line` (nutrient: "N"/"P"/"K", amount_ml: number)
- `toggle_permaculture_mode` (state: boolean)
- `control_lights` (state: "on"/"off")
- `control_fans` (state: "on"/"off")

### Get Nodes (Snapshot)
```json
{ "action": "get_nodes" }
```
Requests an immediate snapshot of node status data.

## Server → Client Messages

### System Data (every 2.5s after subscribe)
```json
{
  "type": "data",
  "master": { "id": "master", "name": "PI-NET MASTER NODE", "status": "online", "uptime": "1d 2h 30m 15s", "pinet_clients": 2, "actuators": { "pump": {"on": false}, "misters": {"on": false}, "lights": {"on": false}, "fans": {"on": false}, "lastFertilization": null } },
  "sentry": { "id": "sentry", "name": "SENTRY NODE (HAILO AI)", "status": "online", "detection": "Healthy", "latency": 42, "detectionsToday": 0, "isCameraActive": false },
  "telemetry": { "id": "telemetry", "name": "TELEMETRY NODE (SENSORS)", "status": "online", "temperature": 24.0, "humidity": 65.0, "pressure": 1013.0, "moisture": 70.0, "ph": 7.0, "nitrogen": 100, "phosphorus": 50, "potassium": 120, "ammonia": 3.0, "permacultureMode": false, "joystick": "idle", "lastFingerprint": "...", "lastTxID": "..." },
  "logs": [{"timestamp": "...", "source": "SYSTEM", "message": "..."}]
}
```

### Chat Response
```json
{
  "type": "chat_response",
  "text": "Based on your soil readings..."
}
```
Or with function calls:
```json
{
  "type": "chat_response",
  "functionCalls": [{"name": "control_pump", "args": {"state": "on"}}]
}
```

### Tool Result
```json
{
  "type": "tool_result",
  "status": "ok",
  "detail": "Pump command executed."
}
```

### Alert
```json
{
  "type": "alert",
  "alert": { "message": "Soil moisture critical in North Field", "type": "warning" }
}
```
