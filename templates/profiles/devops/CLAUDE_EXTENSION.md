# DevOps / Infrastructure Extension

**Profile:** devops
**Version:** 1.0.0
**Purpose:** Role-specific guidance for infrastructure and deployment tasks

---

## Role Context

You are assisting a **DevOps engineer or infrastructure specialist**. Prioritize:
- Infrastructure as Code (IaC) - everything version controlled
- Security by default - least privilege, secrets management
- Idempotent operations - safe to run multiple times
- Observability - logs, metrics, traces from the start
- Cost awareness - right-sizing, resource cleanup

## Available Tools

### Docker

**Status:** Requires local installation
**Usage:** Container builds, local development, deployment

```bash
# Build image
docker build -t myapp:latest .

# Run container
docker run -d -p 8080:80 --name myapp myapp:latest

# View logs
docker logs -f myapp

# Execute in container
docker exec -it myapp /bin/sh

# Compose up
docker compose up -d

# Clean up
docker system prune -f
```

**Dockerfile Best Practices:**
```dockerfile
# Use specific base image tags
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency files first (cache optimization)
COPY package*.json ./
RUN npm ci --only=production

# Copy source after dependencies
COPY . .
RUN npm run build

# Multi-stage for smaller final image
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Non-root user for security
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Terraform

**Status:** Requires local installation
**Usage:** Infrastructure as Code for cloud resources

```bash
# Initialize
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy (careful!)
terraform destroy

# Format code
terraform fmt -recursive

# Validate
terraform validate
```

**Terraform Best Practices:**
```hcl
# versions.tf - Pin provider versions
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "terraform-state-bucket"
    key    = "project/terraform.tfstate"
    region = "us-east-1"
  }
}

# variables.tf - Typed variables with descriptions
variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# main.tf - Use modules and locals
locals {
  common_tags = {
    Environment = var.environment
    Project     = "myproject"
    ManagedBy   = "terraform"
  }
}

module "vpc" {
  source = "./modules/vpc"
  # ...
}

# outputs.tf - Export useful values
output "vpc_id" {
  description = "ID of the created VPC"
  value       = module.vpc.vpc_id
}
```

### Kubectl (Kubernetes)

**Status:** Requires local installation
**Usage:** Kubernetes cluster management

```bash
# Context management
kubectl config get-contexts
kubectl config use-context production

# Resource operations
kubectl get pods -n myapp
kubectl describe pod myapp-abc123 -n myapp
kubectl logs -f deployment/myapp -n myapp

# Apply manifests
kubectl apply -f k8s/
kubectl apply -k overlays/production/

# Debugging
kubectl exec -it myapp-abc123 -n myapp -- /bin/sh
kubectl port-forward svc/myapp 8080:80 -n myapp

# Rollout management
kubectl rollout status deployment/myapp -n myapp
kubectl rollout undo deployment/myapp -n myapp
```

**Kubernetes Manifest Best Practices:**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000

      containers:
      - name: myapp
        image: myapp:v1.2.3  # Always use specific tags
        ports:
        - containerPort: 8080

        # Resource limits (always set!)
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"

        # Health checks
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10

        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5

        # Environment from secrets
        envFrom:
        - secretRef:
            name: myapp-secrets
```

## Pre-Approved Operations

| Operation | Command Pattern | Notes |
|-----------|-----------------|-------|
| Docker build/run | `docker build`, `docker run` | Local containers |
| Docker compose | `docker compose up/down` | Local development |
| Terraform plan | `terraform plan` | Preview changes |
| Kubectl get/describe | `kubectl get`, `kubectl describe` | Read-only |
| Kubectl logs | `kubectl logs` | Debugging |

## Operations Requiring Confirmation

| Operation | Why | Command |
|-----------|-----|---------|
| Terraform apply | Modifies infrastructure | `terraform apply` |
| Terraform destroy | Deletes resources | `terraform destroy` |
| Kubectl delete | Removes resources | `kubectl delete` |
| Docker system prune | Removes all unused | `docker system prune` |

## CI/CD Patterns

### GitHub Actions Workflow
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Run tests
      run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        push: ${{ github.event_name != 'pull_request' }}
        tags: myapp:${{ github.sha }}

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/myapp \
          myapp=myapp:${{ github.sha }}
```

## Security Checklist

Before any deployment:
- [ ] Secrets in secret manager (not in code/env files)
- [ ] Container runs as non-root
- [ ] Resource limits set
- [ ] Network policies defined
- [ ] RBAC configured (least privilege)
- [ ] Images scanned for vulnerabilities
- [ ] TLS enabled for all endpoints

## Quick Reference

| Task | Command |
|------|---------|
| Build container | `docker build -t name:tag .` |
| Run container | `docker run -d -p 8080:80 name:tag` |
| Terraform plan | `terraform plan -out=tfplan` |
| Terraform apply | `terraform apply tfplan` |
| Get pods | `kubectl get pods -n namespace` |
| View logs | `kubectl logs -f deploy/name -n namespace` |
| Port forward | `kubectl port-forward svc/name 8080:80` |
