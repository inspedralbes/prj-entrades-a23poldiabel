#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f .env.prod ]; then
  echo "ERROR: falta el archivo .env.prod en la raiz del proyecto."
  echo "Copia .env.prod.example a .env.prod y rellena los secretos."
  exit 1
fi

# Carga variables para usarlas tambien en este script (no solo en docker compose)
set -a
. ./.env.prod
set +a

COMPOSE="docker compose --env-file .env.prod -f docker-compose.prod.yml"
DOMAIN="${DOMAIN:-a23poldiabel.daw.inspedralbes.cat}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"

write_http_active() {
  cat > deploy/nginx/active.conf <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name $DOMAIN;

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location /socket.io/ {
    proxy_pass http://sockets:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location /api/ {
    proxy_pass http://api:8000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location / {
    proxy_pass http://frontend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF
}

write_https_active() {
  cat > deploy/nginx/active.conf <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name $DOMAIN;

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  http2 on;
  server_name $DOMAIN;

  ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
  ssl_session_timeout 1d;
  ssl_session_cache shared:SSL:10m;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers off;

  location /socket.io/ {
    proxy_pass http://sockets:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location /api/ {
    proxy_pass http://api:8000;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }

  location / {
    proxy_pass http://frontend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF
}

write_http_active

$COMPOSE up -d --build postgres api sockets frontend nginx

# Run DB migrations as an explicit deploy step so failures are visible here
# and do not leave the API container in a restart/crash loop.
$COMPOSE run --rm api php artisan migrate --force

HAS_CERT=0
if $COMPOSE run --rm --entrypoint sh certbot -c "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
  HAS_CERT=1
fi

if [ "$HAS_CERT" -eq 0 ]; then
  if [ -z "$LETSENCRYPT_EMAIL" ]; then
    echo "ERROR: LETSENCRYPT_EMAIL no esta definido en .env.prod"
    exit 1
  fi

  $COMPOSE run --rm certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --non-interactive \
    --agree-tos \
    --no-eff-email \
    --email "$LETSENCRYPT_EMAIL" \
    -d "$DOMAIN"
else
  $COMPOSE run --rm certbot renew --webroot --webroot-path /var/www/certbot || true
fi

write_https_active
$COMPOSE up -d --force-recreate nginx

echo "--- active.conf (host) ---"
sed -n '1,140p' deploy/nginx/active.conf

# Docker DNS can be briefly unavailable just after recreating services.
# Retry nginx config test/reload to avoid flaky deploy failures.
attempt=1
max_attempts=15
while [ "$attempt" -le "$max_attempts" ]; do
  if $COMPOSE exec -T nginx nginx -t >/dev/null 2>&1; then
    $COMPOSE exec -T nginx nginx -s reload
    break
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    echo "ERROR: nginx -t sigue fallando tras $max_attempts intentos"
    echo "--- default.conf (container) ---"
    $COMPOSE exec -T nginx sh -lc 'sed -n "1,180p" /etc/nginx/conf.d/default.conf' || true
    $COMPOSE exec -T nginx nginx -t || true
    exit 1
  fi

  echo "nginx no listo todavia (intento $attempt/$max_attempts). Reintentando en 2s..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "Comprobando reachability de upstreams frontend/API desde Nginx..."
attempt=1
max_attempts=30
while [ "$attempt" -le "$max_attempts" ]; do
  if $COMPOSE exec -T nginx sh -lc 'wget -q -O - --timeout=5 http://frontend:3001/ >/dev/null 2>&1' \
    && $COMPOSE exec -T nginx sh -lc 'wget -q -O - --timeout=5 http://api:8000/api/events >/dev/null 2>&1'; then
    break
  fi

  if [ "$attempt" -eq "$max_attempts" ]; then
    echo "ERROR: nginx no alcanza frontend/API tras deploy"
    echo "--- diagnostico DNS/red desde nginx ---"
    $COMPOSE exec -T nginx sh -lc 'getent hosts frontend api sockets || true' || true
    echo "--- logs frontend (tail 120) ---"
    $COMPOSE logs --tail=120 frontend || true
    echo "--- logs api (tail 120) ---"
    $COMPOSE logs --tail=120 api || true
    echo "--- logs nginx (tail 120) ---"
    $COMPOSE logs --tail=120 nginx || true
    exit 1
  fi

  echo "Esperando readiness frontend/API (intento $attempt/$max_attempts)..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "Deploy de produccion completado para https://$DOMAIN"
