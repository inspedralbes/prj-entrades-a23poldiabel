# Research: Plataforma de Venda d'Entrades en Temps Real

## Decisions de Disseny

### 1. Gestió de Concurrència al Servidor

**Decision**: Utilitzar atomic operations o optimistic locking des del servidor per gestionar reserves.

**Rationale**: La constitució estableix que el client mai pot forçar l'estat d'un seient. El servidor ha de ser l'única font de veritat. Utilitzant atomic operations (com ara transaccions de base de dades amb SELECT FOR UPDATE), podem assegurar que només un usuari aconsegueixi una reserva quan múltiples peticions arrivin simultàniament.

**Alternatives considered**:
- Optimistic locking: Utilitza versions als registres i comprovació abans d'escriure
- Pessimistic locking: Bloqueja el registre abans de processar
- Redis distributed locks: Per a escalabilitat horitzontal

### 2. Arquitectura de Temps Real

**Decision**: Socket.io integrat al servidor Express, no com a servei separat.

**Rationale**: Simplifica la infraestructura mantenint tot el temps real al mateix servidor. Socket.io proporciona fallback automàtic, rooms per a diferents esdeveniments, i reconnexió automàtica.

**Alternatives considered**:
- Servidor Socket.io separat: Més complex, però millor per a escalabilitat
- WebSockets pur: Més lleuger, menys funcionalitats
- Server-Sent Events: Unidireccional, no suitable per a reserva de seients

### 3. Estructura de Base de Dades

**Decision**: PostgreSQL amb taules per a esdeveniments, zones, seients, reserves, entrades, usuaris.

**Rationale**: Base de dades relacional adequada per a transaccions financeres (entrades) i integritat de dades. Permet consultes complexes per a informes.

**Alternatives considered**:
- MongoDB: Més flexible però menys integritat transaccional
- Redis: Bé per a cache però no per a dades persistents

### 4. Expiració de Reserves

**Decision**: El servidor gestiona el temporitzador i allibera automàticament les reserves quan expira.

**Rationale**: Assegura consistència. Si el client controlés el temporitzador, podria manipulate'l. El servidor manté un registre del temps d'expiració i processos en background periòdicament les reserves expirades.

## Best Practices Identificades

1. **Gestió de connexions Socket.io**: Utilitzar rooms per a cada esdeveniment
2. **Protecció contra abús**: Rate limiting tant a API REST com a Socket.io
3. **Sincronització d'estat**: En Connectar-se, el client rep l'estat complet dels seients
4. **Validació**: Tant client com servidor validen les dades (defense in depth)
5. **Reconnexió**: El client reconectat rep l'estat actualitzat

## Implementació Segons Constitució

| Principi Constitució | Implementació |
|---------------------|---------------|
| Component-First | Components Vue independents per a seient, mapa, formulari |
| Responsive Design | CSS amb unitats flexibels, media queries |
| State Management | Pinia stores: eventStore, seatStore, reservationStore, userStore |
| API-First | Contractes definits a contracts/ |
| TDD | Tests escrits abans (Vitest + Playwright) |
| Server-Side Concurrency | Atomic operations a la base de dades |
| Catalan Language | Tot en català des de l'inici |
