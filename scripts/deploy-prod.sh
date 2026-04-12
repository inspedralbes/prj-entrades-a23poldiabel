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

cp deploy/nginx/http.conf deploy/nginx/active.conf

$COMPOSE up -d --build postgres api sockets frontend nginx

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

cp deploy/nginx/https.conf deploy/nginx/active.conf
$COMPOSE up -d nginx
$COMPOSE exec -T nginx nginx -t
$COMPOSE exec -T nginx nginx -s reload

echo "Deploy de produccion completado para https://$DOMAIN"
