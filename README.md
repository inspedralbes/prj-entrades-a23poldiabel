# 🎵 Plataforma de Venda d'Entrades en Temps Real

## 📋 Descripció del Projecte

Sistema complert de venda d'entrades per a concerts, festivals i events d'alta demanda. Implementat amb **Socket.io** per a sincronització en temps real, suportant múltiples usuaris simultanis que competeixen per seients.

**Tecnologies**: Node.js 18+, Express, Socket.IO, Vue 3.4+, Nuxt 3, TypeScript 5.0+, PostgreSQL (Sequelize ORM)

---

## ✨ Funcionalitats Principals

### 👥 Part Usuari
- ✅ **Visualitzar events**: Informació completa (nom, data/hora, recinte, descripció, zones, preus)
- ✅ **Mapa de seients en temps real**: Estat actualitzat contínuament (disponible, seleccionat, venut, reservat)
- ✅ **Reserva temporal**: Bloquejar seients per 5 minuts mentre es completa la compra
- ✅ **Procés de compra**: Dades personals + confirmació
- ✅ **Entrades digitals**: Codi única per entrada adquirida
- ✅ **Gestió de compte**: Consultar historial d'entrades

### 👨‍💼 Part Administrativa
- ✅ **Gestió d'events**: Crear i editar events, zones, seients
- ✅ **Panell en tiempo real**: Distribució de seients, ocupació, reserves actives, compres
- ✅ **Informes**: Recaptació per zona, total i entrades venudes

### 🔐 Seguretat & Robustesa
- ✅ **Transaccions de BD**: Locks UPDATE per evitar race conditions
- ✅ **Validació al servidor**: El client mai força l'estat dels seients
- ✅ **Expiració automàtica**: Reserva alliberada si no es confirma en 5 minuts
- ✅ **Notificacions Socket.io**: Sincronització instantània entre tots els clients
- ✅ **Autenticació JWT**: Sistema d'usuaris amb login/registre

---

## 🚀 Instal·lació Ràpida

### Amb Docker (Recomanat)
```bash
docker-compose up --build
```

### Setup Manual
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (altra terminal)
cd frontend && npm install && npm run dev

# Base de dades
createdb entrades
psql entrades < sql/schema.sql
```

Accés:
- 🌐 Frontend: http://localhost:5173
- 🔌 Socket.IO: http://localhost:3000
- 📊 Admin Panel: http://localhost:5173/admin

---

## 🧪 Tests de Concurrència (Obligatori)

```bash
cd frontend
npm run test:e2e
```

Verifica:
- ✅ Dos usuaris compiten pel mateix seient → un ganador, un error
- ✅ Temps de resposta < 500ms
- ✅ Fluxo complet: reserva → countdown → compra → entrades
- ✅ Expiració de reserva dopo 5 minuts

---

## 📊 Estructura del Projecte

```
backend/src/
  ├── index.ts                  # Servidor Express + Socket.IO
  ├── socket/handlers.ts        # Socket.IO logic (reserve, release, etc)
  ├── services/
  │   ├── reservaService.ts     # Reserva con transacciones
  │   ├── compraService.ts      # Lógica de compra
  │   └── ...
  ├── api/
  │   ├── adminController.ts    # ⭐ Endpoints admin
  │   └── ...
  └── models/                   # ORM Sequelize

frontend/src/
  ├── pages/
  │   ├── events/[id].vue       # Mapa de seients
  │   ├── checkout.vue          # Procés de compra
  │   └── admin/index.vue       # ⭐ Panel admin
  ├── stores/
  │   ├── seientStore.ts
  │   ├── reservaStore.ts
  │   └── adminStore.ts         # ⭐ Estado admin
  └── services/
      └── socketClient.ts       # Socket.IO client

tests/e2e/
  └── concurrency.spec.ts       # ⭐ Tests obligatoris
```

---

## 📡 Socket.IO Sincronització

Cas d'ús crític: Dos usuaris intenten reservar A1 simultàniament

```
T=0ms    User1 + User2 → ambdós cliquen A1
T=5ms    Socket.IO emet a backend
T=10ms   Backend: Transaccio 1 LOCK A1
T=15ms   Backend: A1 es selecciona per User1
T=20ms   Backend: Transaccio 2 intenta UPDATE A1 (BLOQUEIDA)
T=25ms   Timeout: User2 rep error "SEIENT_NO_DISPONIBLE"
T=30ms   Socket.IO notifica a tots els clients
         → A1 marcat com a "seient_de_user1"
```

**Garantia**: Nunca dos usuaris copren els seients. Race condition resuelta amb LOCK + transaccions.

---

## 📋 Requisits Completats

| Requisit | Estatus | Notes |
|----------|---------|-------|
| Visualitzar event + seients | ✅ | Socket.IO real-time |
| Reserva temporal (5 min) | ✅ | Con expiración automática |
| Procés de compra | ✅ | JWT auth + validates |
| Consulta entrades | ✅ | Per email |
| Panel admin | ✅ | Stats + informe |
| Socket.IO | ✅ | >5 events implementados |
| Concurrencia | ✅ | Locks BD + tests |
| Tests | ✅ | Playwright concurrency |
| Documentación | ✅ | README + diagrams *pending |

---

## 🔧 Variables d'Entorn

Backend (`.env`):
```env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost/entrades
JWT_SECRET=super-secret
RESERVA_DURADA_MINUTS=5
```

Frontend (`.env.local`):
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

---

## 📞 Equip de Desenvolupament

**Institucio**: Pedralbes - Ciclo M
**Projecte**: 001-Plataforma de Venda d'Entrades  
**Data**: abril 2026
**Estat**: En desenvolupament actiu
**Ramas**: `001-plataforma-venda-entrades` (Feature branch)

---

## 📌 Nota Important

Segons l'enunciado, aquest projecte **deu demostrar:**
1. ✅ Funcionament correcte de Socket.IO
2. ✅ Manejo de concurrencia (2+ usuaris → 1 seient)
3. ✅ Persistencia de estado (BD + real-time)
4. ✅ Tests automàtics de flux i concurrencia
5. 📌 Diagrames UML (casos d'ús, seqüència) - **EN PROGRESS**

El codi es entirely in **Catalan** com demana l'enunciado.
