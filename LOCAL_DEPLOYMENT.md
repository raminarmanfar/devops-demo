# Local DevOps Deployment Guide

This guide runs the project locally with Jenkins, Docker, Kubernetes (kind), GitHub, and Argo CD.

## 1) Prerequisites

- Docker installed and running
- kind installed
- kubectl installed
- Jenkins running locally (already done)
- A GitHub repo for this project
- Docker Hub account
- Jenkins credential id dockerhub (Username with password for Docker Hub login)
- Jenkins credential id dockerhub-username (Secret text containing only your Docker Hub username)

## 2) Push this project to GitHub

From project root:

```bash
git init
git branch -M main
git remote add origin https://github.com/<your-username>/devops-demo.git
git add .
git commit -m "Initial DevOps demo"
git push -u origin main
```

## 3) Create local Kubernetes cluster

```bash
kind create cluster --config kind-config.yaml
kubectl cluster-info
kubectl get nodes
```

## 4) Install ingress-nginx in kind

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=180s
```

## 5) Install Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --namespace argocd \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/part-of=argocd \
  --timeout=300s
```

Expose Argo CD UI locally:

```bash
kubectl port-forward svc/argocd-server -n argocd 8081:443
```

Get initial Argo CD admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

## 6) Configure Argo CD app for your GitHub repo

1. Edit `k8s/argocd/devops-demo-application.yaml`
2. Replace `repoURL` with your GitHub repo URL
3. Apply app:

```bash
kubectl apply -f k8s/argocd/devops-demo-application.yaml
kubectl get applications -n argocd
```

## 7) Configure Jenkins job

Create a Pipeline job and point it to your GitHub repo using `Jenkinsfile`.

Required Jenkins setup:
- Docker Hub credential id must be dockerhub
- Docker Hub username secret text credential id must be dockerhub-username
- Jenkins runtime must have Docker socket access and kubeconfig access

Run the pipeline.

For first run, keep DEPLOY_TO_K8S unchecked so Jenkins only builds and pushes images to Docker Hub.
After verifying image push, run again with DEPLOY_TO_K8S checked to deploy to Kubernetes.

Pipeline behavior now:
- Builds backend image and pushes:
  - `raminarmanfar/demo-backend:<BUILD_NUMBER>`
  - `raminarmanfar/demo-backend:latest`
- Builds frontend image and pushes:
  - `raminarmanfar/demo-frontend:<BUILD_NUMBER>`
  - `raminarmanfar/demo-frontend:latest`
- Applies Kubernetes manifests and updates deployments to `<BUILD_NUMBER>` image tags

## 8) Verify deployment

```bash
kubectl get pods
kubectl get svc
kubectl get ingress
```

Open app:
- http://localhost:8088/
- Backend test endpoint via ingress: http://localhost:8088/api/hello

## 9) Optional: GitOps-only flow (recommended next)

To make Argo CD the only deploy actor:
- Remove the `Deploy to Kubernetes` stage from Jenkins
- Let Jenkins only build/push images and update manifest image tags in GitHub
- Let Argo CD auto-sync those Git commits

This is the cleaner production-style GitOps model.
