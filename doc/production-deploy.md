# Produccion con Docker + Nginx + HTTPS

Este proyecto mantiene `docker-compose.yml` para desarrollo y usa `docker-compose.prod.yml` para produccion.

## Dominio y red

- IP servidor prod: `204.168.240.236`
- DNS prod: `a23poldiabel.daw.inspedralbes.cat`

Asegurate de que el registro A del dominio apunte a esa IP y de que los puertos 80 y 443 esten abiertos en el firewall.

## Archivos nuevos de prod

- `docker-compose.prod.yml`
- `deploy/nginx/http.conf`
- `deploy/nginx/https.conf`
- `deploy/nginx/active.conf`
- `scripts/deploy-prod.sh`
- `.env.prod.example`
- `.github/workflows/deploy-prod.yml`

## Preparacion en el servidor (una sola vez)

```bash
sudo mkdir -p /opt/a23poldiabel
sudo chown -R "$USER":"$USER" /opt/a23poldiabel
```

Copia `.env.prod.example` como `.env.prod` en `/opt/a23poldiabel` y rellena secretos reales.

## GitHub Actions (deploy automatico en push a main)

Configura estos secretos del repositorio:

- `PROD_SSH_USER`
- `PROD_SSH_PORT`
- `PROD_SSH_KEY`

Cada push a `main` sincroniza archivos con `/opt/a23poldiabel` y ejecuta:

```bash
./scripts/deploy-prod.sh
```

## HTTPS

El script de deploy:

1. Arranca stack en HTTP con Nginx (`http.conf`).
2. Emite certificado Let's Encrypt con Certbot para `a23poldiabel.daw.inspedralbes.cat`.
3. Cambia Nginx a config HTTPS (`https.conf`) y recarga.

Si ya existe certificado, intenta `renew` y mantiene HTTPS activo.

## Comando manual de deploy

```bash
cd /opt/a23poldiabel
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

## Verificacion

- `https://a23poldiabel.daw.inspedralbes.cat`
- `https://a23poldiabel.daw.inspedralbes.cat/api/events`

Si el certificado no se genera, revisa:

- DNS apuntando a `204.168.240.236`
- Puertos 80/443 accesibles
- valor `LETSENCRYPT_EMAIL` en `.env.prod`
