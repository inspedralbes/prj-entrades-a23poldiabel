FROM node:22-alpine AS base
WORKDIR /app

FROM base AS backend
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY backend/ ./
EXPOSE 3000

FROM base AS frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ ./
EXPOSE 5173
