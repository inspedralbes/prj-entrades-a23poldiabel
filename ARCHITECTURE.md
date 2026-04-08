# Arquitectura de Venta de Entradas - Actualización Completada

## Estructura Simplificada: Solo Ticketmaster

### Backend (Node.js + Express)

#### Endpoints Principales

1. **GET /api/desenvolupaments**
   - Obtiene TODOS los eventos de Ticketmaster
   - Response: `{ data: TMEvent[], eventos: TMEvent[], acontecimientos: TMEvent[] }`
   - Alias múltiples para compatibilidad

2. **GET /api/desenvolupaments/:id**
   - Obtiene evento específico de Ticketmaster
   - Response: `{ data: TMEvent, event: TMEvent }`

3. **GET /api/entrada-types**
   - Lista de tipos de entrada disponibles
   - Response: `{ tipos: [{ id, nom, preu, icona, avantatges }] }`

4. **GET /api/entrada-types/:id**
   - Detalles de tipo específico
   - Response: `{ id, nom, preu, icona, descripcio, avantatges }`

5. **POST /api/compres**
   - Crear reserva/compra
   - Body: `{ eventId, ticketTypeId, cantidad, email, nombre, precioTotal }`
   - Response: `{ id, ... createdReserva }`

#### Servicios

**desenvolupamentService.ts**
- `obtenirTotsEsdeveniments()` → Fetch TM + map a formato
- `obtenirEsdevenimentPerId(id)` → Single TM event

**ticketmasterService.ts** (Existente)
- `fetchTMEvents(city)` → API TM
- `fetchTMEventById(id)` → Single from TM

#### Controladores

- `desenvolupamentController.ts` (NUEVO) → GET endpoints
- `entradaTypeController.ts` (NUEVO) → Static ticket types
- `compraController.ts` (Existente) → POST compres

### Frontend (Vue 3 + Nuxt 3)

#### Pages

1. **pages/events.vue** (REESCRITA)
   - Lista de eventos de Ticketmaster
   - Get: `/api/desenvolupaments`
   - Click → `/events/[id]`

2. **pages/events/[id]/index.vue** (NUEVA - Ticket Selection)
   - Get event: `/api/desenvolupaments/:id`
   - Get ticket types: `/api/entrada-types`
   - Seleccionar tipo → Store en `reservaStore`
   - Click continuar → `/checkout`

3. **pages/checkout.vue** (NUEVA)
   - Muestra resumen de evento + entrada seleccionada
   - Form de pago (simulado)
   - Post: `/api/compres`
   - Success → `/exito/:compraId`

4. **pages/exito.vue** (NUEVA)
   - Confirmación final

#### Stores (Pinia)

**eventStore.ts**
- `eventos` - lista de eventos
- `desenvolupamentActual` - evento seleccionado
- `carregant`, `error`
- methods: `obtenirEsdeveniments()`, `obtenirEsdevenimentPerId(id)`

**reservaStore.ts** (NUEVO)
- `event` - evento seleccionado
- `ticketType` - tipo de entrada seleccionado
- `reserva` - detalles de reserva
- methods: `setEvent()`, `setTicketType()`, `setReserva()`, `clearReserva()`

### Flujo de Usuario

```
1. Usuario entra → /events
   ↓ GET /api/desenvolupaments
   ↓ Ver grid de eventos TM
   
2. Clica evento → /events/[id]
   ↓ GET /api/desenvolupaments/:id
   ↓ GET /api/entrada-types
   ↓ Ver detalles del evento + 3 opciones de entrada

3. Selecciona tipo de entrada → Clica "Continuar"
   ↓ Store: reservaStore.setEvent() + setTicketType()
   ↓ Navigate → /checkout

4. En checkout:
   ↓ Ver resumen de evento + entrada
   ↓ Cantidad + formulario de pago
   ↓ Clica "Pagar"
   
5. POST /api/compres
   ↓ Backend crea reserva
   ↓ Response con compraId

6. Éxito → /exito/[compraId]
   ↓ Mostrar número de reserva
   ↓ "Tornar a casa" → /events (cycle repeat)
```

### Tipos de Entrada (Static)

```json
[
  {
    "id": "vip",
    "nom": "VIP",
    "preu": 150,
    "icona": "✨",
    "avantatges": ["Millors vistes", "Parking prioritari", "Accés sala VIP"]
  },
  {
    "id": "platea",
    "nom": "Platea",
    "preu": 80,
    "icona": "🎭",
    "avantatges": ["Bona visibilitat", "Zona còmoda"]
  },
  {
    "id": "general",
    "nom": "General",
    "preu": 40,
    "icona": "🎫",
    "avantatges": ["Accés a tot l'event"]
  }
]
```

### Cambios Principales

**Eliminado:**
- Eventos locales (Sequelize)
- Gestión de zonas/asientos complejos
- Lógica de validación local de eventos
- Admin panel de creación de eventos

**Reducido a:**
- Pure wrapper alrededor de Ticketmaster API
- Static ticket type definitions
- Simple reservation tracking

**Adicionado:**
- Página de selección de tipos
- Flujo de checkout
- Page de éxito

## Testing Quick

```bash
# Backend
curl http://localhost:3000/api/desenvolupaments
curl http://localhost:3000/api/entrada-types

# Frontend (Nuxt dev server)
npm run dev  # http://localhost:5173
```

## Notas de Implementación

1. **Seeding**: `crearEsdevenimentsDemo()` en index.ts aún crea eventos locales - podrías eliminar esto si no los necesitas

2. **Imágenes**: TM API proporciona URLs de imágenes, se usan directamente en el frontend

3. **Precios**: Hardcoded en el frontend en `checkout.vue` - podrían venir de `entrada-types` API

4. **Validación de forma**: Frontend valida email y datos de tarjeta (básico)

5. **Seguridad de pago**: El formulario de pago es una SIMULACIÓN - nunca guardar datos de tarjeta reales en el servidor

6. **Socket.io**: Configurado pero no usado en el nuevo flujo - podría usarse para notificaciones en tiempo real

## Próximos Pasos (Opcionales)

- [ ] Conectar forma de pago real (Stripe, PayPal)
- [ ] Persister compras en BD
- [ ] Email confirmación
- [ ] QR o PDF de entrada
- [ ] Admin panel para ver compras
- [ ] Búsqueda de eventos
- [ ] Filtros por categoría/ciudad
