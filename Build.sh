#!/bin/bash
set -e
 
echo "==> Building backend..."
docker build -t contracheque-bot-backend:latest -f backend/Dockerfile .
 
echo "==> Building worker..."
docker build -t contracheque-bot-worker:latest -f worker/Dockerfile .
 
echo "==> Building frontend..."
docker build -t contracheque-bot-frontend:latest -f frontend/Dockerfile ./frontend
 
echo "==> Done. Run 'docker compose up -d' to start the stack."
 