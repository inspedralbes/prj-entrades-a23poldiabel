# Produccio amb Docker + Nginx + HTTPS

Aquest projecte manté `docker-compose.yml` per a desenvolupament i fa servir `docker-compose.prod.yml` per a produccio.

## Domini i xarxa

- IP del servidor de produccio: `204.168.240.236`
- DNS de produccio: `a23poldiabel.daw.inspedralbes.cat`

Comprova que el registre A del domini apunta a aquesta IP i que els ports 80 i 443 estan oberts.

## Fitxers de produccio

- `docker-compose.prod.yml`
- `deploy/nginx/http.conf`
- `deploy/nginx/https.conf`
- `deploy/nginx/active.conf`
- `scripts/deploy-prod.sh`
- `.env.prod.example`
- `.github/workflows/deploy-prod.yml`

## Preparacio inicial del servidor

```bash
sudo mkdir -p /opt/a23poldiabel
sudo chown -R "$USER":"$USER" /opt/a23poldiabel
```

Copia `.env.prod.example` a `.env.prod` dins `/opt/a23poldiabel` i omple les variables secretes.

## GitHub Actions (desplegament automatic en push a main)

Configura aquests secrets al repositori:

- `PROD_SSH_USER`
- `PROD_SSH_PORT`
- `PROD_SSH_KEY`

Cada push a `main` sincronitza el projecte a `/opt/a23poldiabel` i executa:

```bash
./scripts/deploy-prod.sh
```

## HTTPS

El script de desplegament:

1. Arrenca el stack en HTTP amb Nginx (`http.conf`).
2. Obte certificat de Let's Encrypt amb Certbot per a `a23poldiabel.daw.inspedralbes.cat`.
3. Canvia Nginx a configuracio HTTPS (`https.conf`) i recarrega.

Si el certificat ja existeix, executa renovacio i manté HTTPS actiu.

## Desplegament manual

```bash
cd /opt/a23poldiabel
chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

## Verificacio

- `https://a23poldiabel.daw.inspedralbes.cat`
- `https://a23poldiabel.daw.inspedralbes.cat/api/events`

Si el certificat no es genera correctament, revisa:

- DNS apuntant a `204.168.240.236`
- Ports 80/443 accessibles
- Valor `LETSENCRYPT_EMAIL` a `.env.prod`
