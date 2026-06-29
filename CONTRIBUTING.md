# Contributing to AgriPulse FMIS

## Development Setup

```bash
# Clone the repo
git clone https://github.com/your-org/agripulse-edgecluster.git
cd agripulse-edgecluster

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy environment config
cp .env.example .env

# Start development server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI app, WebSocket, lifespan
│   ├── routes.py               # REST API endpoints
│   ├── models.py               # SQLAlchemy ORM + Pydantic schemas
│   ├── database.py             # DB connection, session
│   ├── sensors.py              # Sensor managers (simulated + real)
│   ├── websocket_manager.py    # WebSocket connection manager
│   ├── ollama_service.py       # LLM integration
│   └── requirements.txt
├── frontend/
│   ├── index.html              # Dashboard
│   ├── fields.html             # Fields & crops
│   ├── soil.html               # Soil health
│   ├── plants.html             # Plant health
│   ├── tasks.html              # Task management
│   ├── irrigation.html         # Irrigation & fertilization
│   ├── chat.html               # AI Architect chat
│   ├── bom.html                # Bill of Materials
│   └── static/
│       ├── css/style.css       # Shared styles
│       └── js/api.js           # API client + WebSocket
├── k8s/                        # Kubernetes manifests
├── docker-compose.yml
└── run.sh
```

## Coding Standards

### Backend (Python)

- Follow PEP 8
- Type hints required for all function signatures
- Use SQLAlchemy 2.0 style (`Mapped` / `mapped_column`)
- Pydantic models use `model_dump()` (not `.dict()`)
- Async for I/O operations, sync for CPU-bound DB queries
- Import order: stdlib → third-party → local

### Frontend (HTML/CSS/JS)

- No framework — vanilla JS
- Shared API client in `api.js` — do not duplicate API calls in inline scripts
- CSS variables for theming (defined in `:root` in `style.css`)
- Mobile-first responsive design
- All API calls through the `api` singleton
- WebSocket through the global `ws` (WsClient) singleton
- Use `showToast()` for user notifications
- Use `showLoading()` for loading states

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes with clear commit messages
3. Test manually against the running server
4. Run `uvicorn backend.main:app` and verify no startup errors
5. Update documentation if adding/changing API endpoints
6. Open a PR with a description of changes

## Adding a New API Endpoint

1. Add the Pydantic schema in `models.py`
2. Add the SQLAlchemy model if needed
3. Add the route handler in `routes.py`
4. Add the client method in `frontend/static/js/api.js`
5. Wire it into the relevant HTML page

## Adding a New Frontend Page

1. Create the HTML file in `frontend/`
2. Include `api.js` for the shared API/WS client
3. Link to `/static/css/style.css` for styles
4. Add navigation link in the bottom nav bar of all pages
5. Register the route in `backend/main.py` if needed
