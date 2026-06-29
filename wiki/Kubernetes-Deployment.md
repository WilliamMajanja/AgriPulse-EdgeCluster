# Kubernetes Deployment

## Prerequisites

- Kubernetes cluster (tested with k3s, microk8s, GKE)
- `kubectl` configured
- Ingress controller (Traefik recommended, configurable)

## Quick Start

```bash
# Deploy everything
kubectl apply -k k8s/

# Verify
kubectl get all -n agripulse
kubectl get ingress -n agripulse
```

## Manifests

### Namespace (`namespace.yaml`)
All resources are isolated in the `agripulse` namespace.

### ConfigMap (`configmap.yaml`)
Environment variables injected into the backend pod:
- `SENSOR_MODE`: `simulated`
- `OLLAMA_MODEL`: `llama3.1:8b`
- `DATABASE_URL`: `sqlite:///data/agripulse.db`
- `OLLAMA_BASE_URL`: `http://ollama-service:11434`

### Storage (`storage.yaml`)
Two persistent volume claims:
- `agripulse-data` (1Gi) — Database and application data
- `ollama-data` (10Gi) — LLM model storage

### Deployments (`deployment.yaml`)
- **agripulse-backend**: 1 replica, FastAPI app, port 8000
  - Liveness probe: `GET /api/v1/dashboard/summary`
  - Readiness probe: TCP socket on port 8000
  - Resource limits: 500m CPU, 512Mi memory
- **ollama**: 1 replica, Ollama LLM server, port 11434

### Services (`service.yaml`)
- `agripulse-service`: ClusterIP on port 80 → target 8000
- `ollama-service`: ClusterIP on port 11434 → target 11434

### Ingress (`ingress.yaml`)
- Host: `agripulse.local`
- Path: `/` → `agripulse-service:80`
- Ingress class: `traefik` (change as needed)

## Customization

Edit `configmap.yaml` to change environment variables or `deployment.yaml` to adjust resource limits, replicas, or probe settings.

## Access

After deployment, access the dashboard at `http://agripulse.local` (requires DNS or `/etc/hosts` entry pointing to your ingress controller).
