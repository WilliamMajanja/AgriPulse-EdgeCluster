from __future__ import annotations
import json
import os
import re
from typing import Any, AsyncGenerator

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

ONBOARD_SYSTEM_PROMPT = """You are a farm onboarding specialist. Given a free-text farm specification, you must:

1. Analyze the spec step by step — each reasoning step MUST start with "[THOUGHT]"
2. After all thoughts, output EXACTLY ONE ```json block with the template

The template JSON structure:
{
  "farm": { "name": "...", "latitude": 44.0, "longitude": -123.0 },
  "fields": [
    {
      "name": "...",
      "area_hectares": 10.0,
      "soil_type": "loam",
      "crop_cycle": {
        "crop_type": "Tomato",
        "variety": "...",
        "planting_date": "2026-06-01",
        "expected_harvest_date": "2026-09-15",
        "status": "planned"
      }
    }
  ],
  "tasks": [
    { "title": "...", "description": "...", "priority": "medium", "due_date": "2026-06-15" }
  ]
}

Rules:
- Soil type must be one of: clay, loam, sandy, silt, peat, chalk, clay_loam
- Crop cycle status must be: planned, planted, growing, harvested, failed
- Task priority: low, medium, high, critical
- Latitude -90 to 90, longitude -180 to 180
- Area in hectares (1 acre = 0.4047 hectares)
- If a spec says "acres", convert to hectares
- If no lat/lng given, estimate from location name or omit them
- If no tasks mentioned, output an empty array
- If no fields can be parsed, output an empty fields array
"""


async def stream_onboard_analysis(spec: str) -> AsyncGenerator[dict[str, Any], None]:
    """Stream thought-by-thought analysis of a farm spec, then yield the final template."""

    messages = [{"role": "user", "content": spec}]
    accumulator = ""
    ai_error: str | None = None

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            payload = {
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": ONBOARD_SYSTEM_PROMPT},
                    *messages,
                ],
                "stream": True,
            }
            async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload) as resp:
                if resp.status_code != 200:
                    ai_error = f"AI model returned HTTP {resp.status_code}"
                else:
                    async for line in resp.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            chunk = json.loads(line)
                            content = chunk.get("message", {}).get("content", "")
                            accumulator += content
                            if content.strip():
                                yield {"type": "thought", "text": content}
                        except json.JSONDecodeError:
                            continue
    except httpx.RequestError as e:
        ai_error = f"Could not reach AI model at {OLLAMA_BASE_URL}: {e}"
    except Exception as e:
        ai_error = f"Unexpected error streaming from AI model: {e}"

    template = _extract_template(accumulator)
    if template:
        yield {"type": "template", "data": template}
    else:
        reason = ai_error or "AI model produced no usable template"
        yield {"type": "thought", "text": f"[Using structured fallback — {reason}]"}
        yield {"type": "template", "data": _mock_template(spec)}


def _extract_template(text: str) -> dict | None:
    """Extract the JSON template block from the model output."""
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if not match:
        return None
    try:
        data = json.loads(match.group(1).strip())
    except json.JSONDecodeError:
        return None
    # Accept any object that has a `farm` key; require a name only if farm exists.
    if not isinstance(data, dict):
        return None
    if "farm" not in data or not isinstance(data["farm"], dict):
        return None
    data.setdefault("fields", [])
    data.setdefault("tasks", [])
    farm = data["farm"]
    farm.setdefault("name", "My Farm")
    farm.setdefault("latitude", None)
    farm.setdefault("longitude", None)
    return data


def _mock_template(spec: str) -> dict:
    """Deterministic fallback parser when Ollama is unavailable."""
    lines = [l.strip() for l in spec.strip().split("\n") if l.strip()]
    farm_name = lines[0].split(",")[0].strip() if lines else "My Farm"

    fields = []
    tasks = []
    field_pattern = re.compile(r"(\d+)\s*field", re.IGNORECASE)
    acre_pattern = re.compile(r"(\d+\.?\d*)\s*acre", re.IGNORECASE)

    field_match = field_pattern.search(spec)
    field_count = int(field_match.group(1)) if field_match else 1

    total_acres = 0.0
    acre_match = acre_pattern.search(spec)
    if acre_match:
        total_acres = float(acre_match.group(1))

    area_per_field = round((total_acres * 0.4047) / field_count, 1) if total_acres else 10.0

    for i in range(field_count):
        fields.append({
            "name": f"Field {i + 1}",
            "area_hectares": area_per_field,
            "soil_type": "loam",
            "crop_cycle": None,
        })

    if "organic" in spec.lower() or "certified" in spec.lower():
        tasks.append({"title": "Complete organic certification paperwork", "description": "", "priority": "high", "due_date": ""})

    tasks.append({"title": "Set up irrigation system", "description": "", "priority": "medium", "due_date": ""})
    tasks.append({"title": "Order seeds for upcoming season", "description": "", "priority": "medium", "due_date": ""})

    return {
        "farm": {"name": farm_name, "latitude": None, "longitude": None},
        "fields": fields,
        "tasks": tasks,
    }
