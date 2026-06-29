# Deployment Guide

## Local Development

```bash
# Requirements
pip install -r backend/requirements.txt

# Start
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables hot-reload on file changes.

## Docker

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

The Docker Compose setup also starts an Ollama container for the AI Architect. Pull the model after starting:

```bash
docker exec agripulse-ollama ollama pull llama3.1:8b
```

## Kubernetes

```bash
# Apply all manifests
kubectl apply -k k8s/

# Check status
kubectl get all -n agripulse

# Access
# Configure your ingress controller and DNS for agripulse.local
# Or port-forward:
kubectl port-forward -n agripulse svc/agripulse-service 8000:80
```

### K8s Manifests

Manifests are in `k8s/`:
- `namespace.yaml` — `agripulse` namespace
- `configmap.yaml` — Environment configuration
- `storage.yaml` — PVCs for database and Ollama models
- `deployment.yaml` — Backend + Ollama deployments
- `service.yaml` — Internal ClusterIP services
- `ingress.yaml` — Traefik ingress for agripulse.local

Apply with Kustomize:
```bash
kubectl apply -k k8s/
```

## Configuration

Copy `.env.example` to `.env` and adjust:

```bash
cp .env.example .env
```

Key settings:
- `SENSOR_MODE`: `simulated` (no hardware needed) or `real`
- `DATABASE_URL`: SQLite (default) or PostgreSQL
- `OLLAMA_BASE_URL`: Ollama endpoint (localhost or container)

## Database

SQLite is used by default. The database file `agripulse.db` is created automatically on first run. Tables are created via `init_db()` during application startup.

For production, switch to PostgreSQL by setting `DATABASE_URL`:
```
DATABASE_URL=postgresql://user:password@host:5432/agripulse
```
