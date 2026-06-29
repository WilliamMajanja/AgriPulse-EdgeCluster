import json
from fastapi import FastAPI, WebSocket, HTTPException

app = FastAPI()

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text(json.dumps({"status": "ok"}))
    await websocket.close()

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9997, log_level="info")
