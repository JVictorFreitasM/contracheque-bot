# NOTE: This Dockerfile is not used by docker-compose; kept for reference only.
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# ----- Dependencies -----
# Copy package.json and lock files for backend
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# ----- Build Frontend -----
# Copy frontend folder
COPY frontend ./frontend

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# ----- Final Setup -----
WORKDIR /app
# Copy backend source files
COPY . .

# Expose application port (adjust if needed)
EXPOSE 3000

# Start the backend (which serves the built frontend)
CMD ["node", "src/app.js"]
