from __future__ import annotations
import asyncio
from typing import Any, Callable

from fastapi import WebSocket, WebSocketDisconnect

from backend.ollama_service import get_architect_response
from backend.onboarding_service import stream_onboard_analysis

TICK_INTERVAL = 2.5


class ConnectionManager:
    def __init__(
        self,
        get_system_data: Callable[[], dict[str, Any]],
        alert_queue: asyncio.Queue,
        exec_tool_callback: Callable[[str, dict], dict] | None = None,
    ) -> None:
        self.active_connections: list[WebSocket] = []
        self._get_system_data = get_system_data
        self._alert_queue = alert_queue
        self._exec_tool_callback = exec_tool_callback

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict) -> None:
        stale: list[WebSocket] = []
        for conn in self.active_connections:
            try:
                await conn.send_json(data)
            except WebSocketDisconnect:
                stale.append(conn)
        for conn in stale:
            await self.disconnect(conn)

    async def handle_message(self, websocket: WebSocket, data: dict) -> None:
        action = data.get("action")
        if action == "subscribe":
            asyncio.create_task(self._stream_data(websocket))
        elif action == "get_nodes":
            system_data = self._get_system_data()
            await websocket.send_json({"type": "data", **system_data})
        elif action == "chat":
            history = data.get("messages", [])
            response = await get_architect_response(history)
            await websocket.send_json({"type": "chat_response", **response})
        elif action == "onboard":
            spec = data.get("spec", "")
            await self._stream_onboard(websocket, spec)
        elif action == "exec_tool":
            if self._exec_tool_callback:
                name = data.get("name", "")
                args = data.get("args", {})
                result = self._exec_tool_callback(name, args)
                await websocket.send_json({"type": "tool_result", **result})
            else:
                await websocket.send_json(
                    {"type": "tool_result", "status": "error", "detail": "No tool executor available."}
                )

    async def _stream_onboard(self, websocket: WebSocket, spec: str) -> None:
        try:
            async for event in stream_onboard_analysis(spec):
                if event["type"] == "thought":
                    await websocket.send_json({"type": "onboard_thought", "text": event["text"]})
                elif event["type"] == "template":
                    await websocket.send_json({"type": "onboard_template", "data": event["data"]})
        except WebSocketDisconnect:
            raise
        except Exception as e:
            await websocket.send_json({
                "type": "onboard_error",
                "detail": f"Onboarding failed: {e}",
            })

    async def _stream_data(self, websocket: WebSocket) -> None:
        try:
            while True:
                await asyncio.sleep(TICK_INTERVAL)
                system_data = self._get_system_data()
                await websocket.send_json({"type": "data", **system_data})
                while not self._alert_queue.empty():
                    try:
                        alert = self._alert_queue.get_nowait()
                        await websocket.send_json({"type": "alert", "alert": alert})
                    except asyncio.QueueEmpty:
                        break
        except WebSocketDisconnect:
            pass
        except Exception:
            pass
