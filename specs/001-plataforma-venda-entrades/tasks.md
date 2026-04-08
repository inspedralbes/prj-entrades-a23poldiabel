# Tasks: Plataforma de Venda d'Entrades en Temps Real

**Feature**: 001-plataforma-venda-entrades  
**Plan**: specs/001-plataforma-venda-entrades/plan.md  
**Spec**: specs/001-plataforma-venda-entrades/spec.md

## Phase 1: Setup (Project Initialization)

- [x] T001 Crear estructura de directoris backend/ i frontend/ segons plan.md
- [x] T002 [P] Inicialitzar projecte backend amb Node.js + Express en backend/
- [x] T003 [P] Inicialitzar projecte Nuxt 3 amb TypeScript en frontend/
- [x] T004 Configurar package.json amb dependencies: express, socket.io, cors, dotenv, pg, sequelize/prisma
- [x] T005 Configurar package.json frontend amb dependencies: nuxt, pinia, @pinia/nuxt, socket.io-client, axios
- [x] T006 [P] Crear script SQL per a esquema de base de dades a sql/schema.sql
- [x] T007 [P] Crear script SQL per a dades inicials a sql/seed.sql

## Phase 2: Foundational (Prerequisites - Blocking)

- [x] T008 Implementar models de base de dades: Usuari, Esdeveniment, Zona, Seient a backend/src/models/
- [x] T009 Implementar models de base de dades: Reserva, ReservaSeient, Entrada, EntradaSeient a backend/src/models/
- [x] T010 Crear connexió a PostgreSQL i configuració de base de dades a backend/src/config/database.ts
- [x] T011 Implementar middleware de gestió d'errors a backend/src/middleware/errorHandler.ts
- [x] T012 Implementar middleware de validació de dades a backend/src/middleware/validation.ts
- [x] T013 Crear Pinia store per a esdeveniments a frontend/src/stores/eventStore.ts
- [x] T014 Crear Pinia store per a seients a frontend/src/stores/seientStore.ts
- [x] T015 Crear Pinia store per a reserves a frontend/src/stores/reservaStore.ts
- [x] T016 Implementar servei API client amb Axios a frontend/src/services/apiClient.ts
- [x] T017 Implementar servei Socket.io client a frontend/src/services/socketClient.ts

## Phase 3: User Story 1 - Visualitzar Esdeveniment i Selecció de Seients (P1)

**Independent Test**: L'usuari pot obrir la pàgina de l'esdeveniment, veure la informació i el mapa de seients amb estats correctes.

### Backend
- [x] T018 [P] [US1] Implementar servei EsdevenimentService a backend/src/services/esdevenimentService.ts
- [x] T019 [P] [US1] Implementar servei SeientService a backend/src/services/seientService.ts
- [x] T020 [US1] Crear endpoint GET /api/esdeveniments a backend/src/api/esdevenimentController.ts
- [x] T021 [US1] Crear endpoint GET /api/esdeveniments/:id a backend/src/api/esdevenimentController.ts
- [x] T022 [US1] Implementar handler Socket.io per a join-event a backend/src/socket/handlers.ts

### Frontend
- [x] T023 [P] [US1] Crear component SeatMap.vue per a visualitzar el plànol de seients a frontend/src/components/SeatMap.vue
- [x] T024 [P] [US1] Crear component Seat.vue per a representació individual d'un seient a frontend/src/components/Seat.vue
- [x] T025 [US1] Crear pàgina EsdevenimentPage.vue a frontend/src/pages/esdeveniment/[id].vue
- [x] T026 [US1] Implementar composable useSeients per a gestió d'estat de seients a frontend/src/composables/useSeients.ts
- [x] T027 [US1] Integrar Socket.io al frontend per a rebre actualitzacions d'estat a frontend/src/pages/esdeveniment/[id].vue

## Phase 4: User Story 2 - Reserva Temporal de Seients (P1)

**Independent Test**: L'usuari selecciona seients, rep confirmació del servidor i disposa d'un temporitzador visible.

### Backend
- [x] T028 [US2] Implementar servei ReservaService amb atomic operations a backend/src/services/reservaService.ts
- [x] T029 [US2] Implementar lògica d'expiració de reserves (setTimeout/cron) a backend/src/services/reservaService.ts
- [x] T030 [US2] Crear endpoint POST /api/reserves a backend/src/api/reservaController.ts
- [x] T031 [US2] Crear endpoint DELETE /api/reserves/:id a backend/src/api/reservaController.ts
- [x] T032 [US2] Implementar handler Socket.io reserve-seat a backend/src/socket/handlers.ts
- [x] T033 [US2] Implementar handler Socket.io release-seat a backend/src/socket/handlers.ts
- [x] T034 [US2] Implementar broadcast d'estat a tots els clients quan canvia un seient a backend/src/socket/handlers.ts

### Frontend
- [x] T035 [P] [US2] Crear component ReservationTimer.vue per a mostrar temporitzador a frontend/src/components/ReservationTimer.vue
- [x] T036 [US2] Implementar composable useReserva per a gestió de reserves a frontend/src/composables/useReserva.ts
- [x] T037 [US2] Integrar lògica de selecció de seients amb Socket.io a frontend/src/components/SeatMap.vue

## Phase 5: User Story 3 - Procés de Compra (P1)

**Independent Test**: L'usuari amb seients reservats pot omplir dades, confirmar compra i rebre entrades.

### Backend
- [x] T038 [US3] Implementar servei CompraService a backend/src/services/compraService.ts
- [x] T039 [US3] Implementar validació de propietat de reserva a backend/src/services/compraService.ts
- [x] T040 [US3] Crear endpoint POST /api/compres a backend/src/api/compraController.ts
- [x] T041 [US3] Implementar handler Socket.io confirm-purchase a backend/src/socket/handlers.ts
- [x] T042 [US3] Implementar generació de codis d'entrada únics a backend/src/services/compraService.ts

### Frontend
- [x] T043 [P] [US3] Crear component CheckoutForm.vue per a dades personals a frontend/src/components/CheckoutForm.vue
- [x] T044 [US3] Crear component CheckoutSummary.vue per a resum de compra a frontend/src/components/CheckoutSummary.vue
- [x] T045 [US3] Crear pàgina CheckoutPage.vue a frontend/src/pages/checkout.vue
- [x] T046 [US3] Implementar missatges d'error per a errors de compra a frontend/src/components/CheckoutForm.vue

## Phase 6: User Story 4 - Consulta d'Entrades Comprades (P2)

**Independent Test**: L'usuari pot cercar entrades per correu electrònic i visualitzar detalls.

### Backend
- [ ] T047 [P] [US4] Implementar servei EntradaService a backend/src/services/entradaService.ts
- [ ] T048 [US4] Crear endpoint GET /api/entrades?correu= a backend/src/api/entradaController.ts

### Frontend
- [ ] T049 [P] [US4] Crear component EntradaCard.vue per a mostra d'entrades a frontend/src/components/EntradaCard.vue
- [ ] T050 [US4] Crear pàgina LesMevesEntradesPage.vue a frontend/src/pages/les-meves-entrades.vue
- [ ] T051 [US4] Implementar formulari de cerca per correu a frontend/src/pages/les-meves-entrades.vue

## Phase 7: User Story 5 - Panell d'Administració: Gestió d'Esdeveniments (P2)

**Independent Test**: L'administrador pot crear i editar esdeveniments.

### Backend
- [ ] T052 [P] [US5] Implementar autenticació d'administrador a backend/src/middleware/authAdmin.ts
- [ ] T053 [US5] Crear endpoint POST /api/admin/esdeveniments a backend/src/api/admin/esdevenimentController.ts
- [ ] T054 [US5] Crear endpoint PUT /api/admin/esdeveniments/:id a backend/src/api/admin/esdevenimentController.ts
- [ ] T055 [US5] Implementar servei per a creació de zones i seients automàtics a backend/src/services/adminEsdevenimentService.ts

### Frontend
- [ ] T056 [P] [US5] Crear layout AdminLayout.vue a frontend/src/layouts/admin.vue
- [ ] T057 [US5] Crear pàgina AdminEsdevenimentsPage.vue a frontend/src/pages/admin/esdeveniments.vue
- [ ] T058 [US5] Crear formulari AdminEsdevenimentForm.vue per a crear/editar esdeveniments a frontend/src/components/admin/AdminEsdevenimentForm.vue

## Phase 8: User Story 6 - Panell d'Administració: Monitoratge en Temps Real (P2)

**Independent Test**: L'administrador veu estadístiques actualitzades en temps real.

### Backend
- [ ] T059 [P] [US6] Implementar servei d'estadístiques a backend/src/services/estadistiquesService.ts
- [ ] T060 [US6] Crear endpoint GET /api/admin/estadistiques a backend/src/api/admin/estadistiquesController.ts
- [ ] T061 [US6] Implementar broadcast d'estadístiques als admins via Socket.io a backend/src/socket/handlers.ts

### Frontend
- [ ] T062 [P] [US6] Crear component AdminStats.vue per a mostrar estadístiques a frontend/src/components/admin/AdminStats.vue
- [ ] T063 [US6] Crear pàgina AdminDashboard.vue a frontend/src/pages/admin/dashboard.vue
- [ ] T064 [US6] Integrar Socket.io per a actualització temps real d'estadístiques a frontend/src/pages/admin/dashboard.vue

## Phase 9: User Story 7 - Panell d'Administració: Informes i Estadístiques (P3)

**Independent Test**: L'administrador pot veure mètriques de vendes.

### Backend
- [ ] T065 [P] [US7] Implementar consultes per a informes: recaptació per tipus, total, ocupació a backend/src/services/informesService.ts
- [ ] T066 [US7] Crear endpoint GET /api/admin/informes a backend/src/api/admin/informesController.ts

### Frontend
- [ ] T067 [P] [US7] Crear component InformesChart.vue per a visualitzar gràfics a frontend/src/components/admin/InformesChart.vue
- [ ] T068 [US7] Crear pàgina AdminInformesPage.vue a frontend/src/pages/admin/informes.vue

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T069 Implementar gestió de reconnexió Socket.io al frontend a frontend/src/services/socketClient.ts
- [ ] T070 Implementar protecció contra abús (rate limiting) al backend a backend/src/middleware/rateLimit.ts
- [ ] T071 Implementar missatges d'error en català a backend/src/utils/missatgesError.ts
- [ ] T072 Verificar compliment de principis de constitució (Component-First, Catalan Language)
- [ ] T073 Tests de concurrència: verificar que dos usuaris no poden comprar el mateix seient

## Dependencies

```
Phase 1 (Setup)
  └─> Phase 2 (Foundational)
       ├─> Phase 3 (US1: Visualitzar Esdeveniment)
       │    └─> Phase 4 (US2: Reserva Temporal) [dep: US1]
       │         └─> Phase 5 (US3: Procés de Compra) [dep: US2]
       │              └─> Phase 6 (US4: Consulta Entrades) [dep: US3]
       │
       ├─> Phase 7 (US5: Admin Gestió) [dep: Phase 2]
       │    └─> Phase 8 (US6: Admin Monitoratge) [dep: US5]
       │         └─> Phase 9 (US7: Admin Informes) [dep: US6]
       │
       └─> Phase 10 (Polish) [dep: totes les fases anteriors]
```

## Parallel Opportunities

- **T002 + T003 + T006 + T007**: Inicialització paral·lela de backend, frontend i scripts SQL
- **T008 + T009**: Models de base de dades en paral·lel
- **T013 + T014 + T015**: Pinia stores en paral·lel
- **T018 + T019**: Serveis d'esdeveniments i seients en paral·lel
- **T023 + T024**: Components Seat i SeatMap en paral·lel
- **T035 + T043 + T049**: Components de formulari en paral·lel
- **T056 + T062 + T067**: Components admin en paral·lel

## MVP Scope

El MVP (Minimum Viable Product) consisteix en:
- **User Story 1**: Visualitzar esdeveniment i mapa de seients
- **User Story 2**: Reserva temporal de seients
- **User Story 3**: Procés de compra

Les fases 6-9 (consulta d'entrades i admin) són funcionalitats addicionals que es poden implementar desprès del MVP.

## Implementation Strategy

1. **Iteració 1** (Fases 1-3): Configuració bàsica, models, US1 (visualització)
2. **Iteració 2** (Fases 4-5): Reserves i compres (nucli del negoci)
3. **Iteració 3** (Fase 6): Consulta d'entrades
4. **Iteració 4** (Fases 7-9): Funcionalitats d'administració
5. **Iteració 5** (Fase 10): Poliment i tests

## Total Task Count

**Total: 73 tasques**

| Fase | Tasques |
|------|---------|
| Phase 1: Setup | 7 |
| Phase 2: Foundational | 10 |
| Phase 3: US1 | 10 |
| Phase 4: US2 | 10 |
| Phase 5: US3 | 9 |
| Phase 6: US4 | 5 |
| Phase 7: US5 | 7 |
| Phase 8: US6 | 6 |
| Phase 9: US7 | 4 |
| Phase 10: Polish | 5 |
