# Deployment Guide

This guide covers deploying the Feature Scene application to various environments.

## Prerequisites

- Docker installed locally
- Kubernetes cluster (for K8s deployment)
- kubectl configured
- Container registry access (Docker Hub, ECR, etc.)

## Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Building Docker Images

### Backend
```bash
cd backend
docker build -t feature-scene-backend:latest .
```

### Frontend
```bash
cd frontend
docker build -t feature-scene-frontend:latest .
```

## Kubernetes Deployment

### Setup Namespace

```bash
# Create namespace
kubectl create namespace feature-scene-production

# Set as default namespace
kubectl config set-context --current --namespace=feature-scene-production
```

### Create Secrets

```bash
# Create secrets for sensitive data
kubectl create secret generic feature-scene-secrets \
  --from-literal=neo4j-uri=bolt://neo4j:7687 \
  --from-literal=neo4j-username=neo4j \
  --from-literal=neo4j-password=your-secure-password \
  --from-literal=neo4j-auth=neo4j/your-secure-password \
  --from-literal=posthog-api-key=your-posthog-key \
  --from-literal=posthog-project-id=your-project-id \
  --from-literal=openai-api-key=your-openai-key \
  --from-literal=jira-api-token=your-jira-token
```

### Deploy to Staging

```bash
# Apply staging configuration
kubectl apply -k k8s/staging/

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services
```

### Deploy to Production

```bash
# Apply production configuration
kubectl apply -k k8s/production/

# Monitor rollout
kubectl rollout status deployment/feature-scene-backend
kubectl rollout status deployment/feature-scene-frontend
```

### Update Deployments

```bash
# Update backend image
kubectl set image deployment/feature-scene-backend backend=feature-scene-backend:v1.0.1

# Update frontend image
kubectl set image deployment/feature-scene-frontend frontend=feature-scene-frontend:v1.0.1

# Rollback if needed
kubectl rollout undo deployment/feature-scene-backend
```

## GitHub Actions CI/CD

The repository includes GitHub Actions workflows for:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and PR
   - Executes tests, linting, and type checking
   - Builds Docker images

2. **Deploy Pipeline** (`.github/workflows/deploy.yml`)
   - Deploys to staging on manual trigger
   - Deploys to production on push to main
   - Runs smoke tests after deployment

### Setting up GitHub Secrets

Add these secrets to your GitHub repository:

- `SLACK_WEBHOOK` - For deployment notifications
- `DOCKER_REGISTRY_USERNAME` - Container registry credentials
- `DOCKER_REGISTRY_PASSWORD` - Container registry password
- `KUBECONFIG` - Base64 encoded kubeconfig for cluster access

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development/production) | development |
| PORT | Server port | 5000 |
| NEO4J_URI | Neo4j connection URI | bolt://localhost:7687 |
| NEO4J_USERNAME | Neo4j username | neo4j |
| NEO4J_PASSWORD | Neo4j password | - |
| POSTHOG_API_KEY | PostHog API key | - |
| POSTHOG_PROJECT_ID | PostHog project ID | - |
| OPENAI_API_KEY | OpenAI API key | - |
| BATCH_SCHEDULE_CRON | Cron schedule for batch jobs | 0 2 * * * |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:5000/api |

## SSL/TLS Configuration

For production deployments:

1. Install cert-manager in your cluster
2. Configure Let's Encrypt issuer
3. Update ingress annotations in `k8s/base/ingress.yaml`

```yaml
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
```

## Monitoring and Logging

### Health Checks

- Backend: `GET /api/health`
- Frontend: `GET /`

### Logs

```bash
# View backend logs
kubectl logs -l app=feature-scene,component=backend

# View frontend logs
kubectl logs -l app=feature-scene,component=frontend

# View Neo4j logs
kubectl logs -l app=feature-scene,component=neo4j
```

### Metrics

Consider adding:
- Prometheus for metrics collection
- Grafana for visualization
- ELK stack for log aggregation

## Database Migrations

Neo4j schema is created automatically on first use. For updates:

```bash
# Connect to Neo4j
kubectl port-forward service/neo4j 7687:7687

# Run migrations
cd database/migrations
./run-migrations.sh
```

## Backup and Recovery

### Neo4j Backup

```bash
# Create backup
kubectl exec -it deployment/neo4j -- neo4j-admin backup --to=/backup/$(date +%Y%m%d)

# Copy backup locally
kubectl cp neo4j-pod:/backup ./backups/
```

### Restore from Backup

```bash
# Copy backup to pod
kubectl cp ./backups/20240101 neo4j-pod:/restore/

# Restore
kubectl exec -it deployment/neo4j -- neo4j-admin restore --from=/restore/20240101
```

## Troubleshooting

### Common Issues

1. **Pod not starting**
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name> --previous
   ```

2. **Connection issues**
   ```bash
   kubectl get services
   kubectl get endpoints
   ```

3. **Resource constraints**
   ```bash
   kubectl top nodes
   kubectl top pods
   ```

### Debug Mode

Enable debug logging:
```bash
kubectl set env deployment/feature-scene-backend LOG_LEVEL=debug
```

## Security Considerations

1. **Network Policies**: Implement Kubernetes network policies to restrict traffic
2. **RBAC**: Use proper role-based access control
3. **Secrets Management**: Consider using HashiCorp Vault or Kubernetes Sealed Secrets
4. **Image Scanning**: Scan Docker images for vulnerabilities
5. **Pod Security**: Use security contexts and pod security policies

## Performance Tuning

1. **Horizontal Pod Autoscaling**
   ```yaml
   kubectl autoscale deployment feature-scene-backend --min=2 --max=10 --cpu-percent=80
   ```

2. **Database Connection Pooling**: Configure Neo4j connection pool in backend

3. **CDN for Frontend**: Serve static assets through a CDN

4. **Caching**: Implement Redis for caching frequently accessed data