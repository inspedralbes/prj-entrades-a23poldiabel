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

FROM mirror.gcr.io/library/php:8.4-cli-alpine AS laravel
WORKDIR /app/backend-laravel

RUN apk add --no-cache git unzip postgresql-dev libzip-dev \
	&& docker-php-ext-install pdo pdo_pgsql

COPY --from=mirror.gcr.io/library/composer:2 /usr/bin/composer /usr/bin/composer

COPY backend-laravel/composer.json backend-laravel/composer.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY backend-laravel/ ./
EXPOSE 8000
