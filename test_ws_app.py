import json
from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text(json.dumps({"hello": "world"}))
    await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9998)
