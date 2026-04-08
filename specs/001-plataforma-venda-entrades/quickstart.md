# Quickstart: Plataforma de Venda d'Entrades

## Requisits Previs

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## Instal·lació

### 1. Clonar el projecte

```bash
git clone <repo-url>
cd prj-entrades-a23poldiabel
git checkout 001-plataforma-venda-entrades
```

### 2. Configurar Base de Dades

```bash
# Crear base de dades
createdb entrades_db

# Executar script SQL
psql -d entrades_db -f sql/schema.sql
psql -d entrades_db -f sql/seed.sql
```

### 3. Configurar Variables d'Entorn

Crear fitxer `.env` a `backend/`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/entrades_db
NODE_ENV=development
```

Crear fitxer `.env` a `frontend/`:

```env
NUXT_PUBLIC_API_URL=http://localhost:3000
NUXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 4. Instal·lar Dependències

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Executar el Projecte

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Accés

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Socket.io**: ws://localhost:3000

## Usuaris de Prova

| Rol | Correu | Contrasenya |
|-----|--------|-------------|
| Administrador | admin@entrades.cat | admin123 |
| Comprador | joan@exemple.cat | - (no cal) |

## Fluix Bàsic

1. Obre el navegador a http://localhost:5173
2. Visualitza l'esdeveniment i el mapa de seients
3. Selecciona seients (fins al límit establert)
4. Completa el formulari de compra
5. Consulta les teves entrades amb el correu electrònic

## Prova de Concurrència

Per provar la gestió de concurrència:

1. Obre dues finestres del navegador
2. A cada finestra, selecciona el mateix seient
3. Només una finestra rebrà la confirmació
4. L'altra rebrà un missatge d'error immediat

## Comandes de Test

```bash
# Tests de unitat (backend)
cd backend
npm test

# Tests e2e (frontend)
cd frontend
npx playwright test

# Tests de concurrència (Cypress)
cd frontend
npx cypress run --spec "cypress/e2e/concurrency.spec.js"
```
