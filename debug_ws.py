import sys, asyncio, json, os
sys.path.insert(0, os.path.dirname(__file__))

# Monkey-patch the route matching to add debugging
import starlette.routing
original_call = starlette.routing.Router.__call__

async def debug_call(self, scope, receive, send):
    route_path = starlette.routing.get_route_path(scope)
    if scope["type"] == "websocket":
        print(f"DEBUG WebSocket to: {route_path}", flush=True)
        for i, route in enumerate(self.routes):
            if hasattr(route, "path"):
                path = route.path
            elif hasattr(route, "prefix"):
                path = route.prefix
            else:
                path = type(route).__name__
            try:
                match, child_scope = route.matches(scope)
            except Exception as e:
                print(f"  route[{i}] {type(route).__name__:20s} ERROR: {e}", flush=True)
                continue
            match_name = str(match).split(".")[-1] if hasattr(match, "value") else str(match)
            print(f"  route[{i}] {type(route).__name__:20s} path={path:35s} match={match_name}", flush=True)
        print(flush=True)
    await original_call(self, scope, receive, send)

starlette.routing.Router.__call__ = debug_call

from backend.main import app

import uvicorn
uvicorn.run(app, host="127.0.0.1", port=8002, log_level="info")
