# Troubleshooting

## Server Won't Start

### Address already in use
```bash
# Find and kill process on port 8000
lsof -ti :8000 | xargs kill -9
```

### Module not found
```bash
# Reinstall dependencies
pip install -r backend/requirements.txt
```

### Database errors
Delete `agripulse.db` to reset the database:
```bash
rm agripulse.db
```

## WebSocket Connection Failed (403)

The old root-level `StaticFiles` mount intercepted WebSocket upgrade requests. If you see `WebSocket /ws 403`, ensure `main.py` uses the catch-all GET route (not `app.mount("/", StaticFiles(...))`) — fixed in recent versions.

## AI Architect Not Responding

### Ollama not running
```bash
# Check if Ollama is accessible
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Pull the model
ollama pull llama3.1:8b
```

### Connection refused
Ensure `OLLAMA_BASE_URL` is set correctly in `.env` or environment.

## Frontend 404 Errors

### Page not found
Ensure the frontend files exist in `frontend/` directory and the backend is serving them. Check that `FRONTEND_DIR` in `main.py` points to the correct path.

### API 404
Verify the API path in `api.js` matches a backend route. All API endpoints are prefixed with `/api/v1`.

## Database

### Tables not created
Tables are created automatically via `init_db()` on startup. Check server logs for errors.

### Integrity errors
Ensure foreign keys reference existing records:
- Field requires an existing farm
- Crop cycle requires an existing field
- Soil/plant readings require an existing field

## Hardware Sensors

If using `SENSOR_MODE=real` and sensors fail to initialize, the system falls back to simulated mode automatically. Check logs for:
```
Failed to init hardware sensors, falling back to simulation: [error details]
```

## Still Having Issues?

Open an issue at https://github.com/anomalyco/opencode/issues
