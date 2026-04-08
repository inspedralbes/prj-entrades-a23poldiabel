# Diagrames del Projecte: Plataforma de Venda d'Entrades

## 1. Diagram de Casos d'Ús

```mermaid
graph TB
    subgraph Sistema["🎵 Plataforma de Venda d'Entrades"]
        UC1["👁️ Visualitzar Event"]
        UC2["🪑 Seleccionar Seients"]
        UC3["⏱️ Reserva Temporal"]
        UC4["💳 Compra de Entrades"]
        UC5["📧 Consultar Entrades"]
        UC6["⚙️ Gestionar Events"]
        UC7["📊 Monitoritzar Stats"]
        UC8["📈 Veure Informes"]
    end
    
    subgraph Actors["👥 Actors"]
        User["👤 Usuari Comprador"]
        Admin["👨‍💼 Administrador"]
    end
    
    User -->|usa| UC1
    User -->|usa| UC2
    User -->|usa| UC3
    User -->|usa| UC4
    User -->|usa| UC5
    
    Admin -->|usa| UC6
    Admin -->|usa| UC7
    Admin -->|usa| UC8
    
    UC1 -.->|requereix| UC2
    UC2 -.->|inicia| UC3
    UC3 -.->|pot formar| UC4
    UC4 -.->|genera| UC5
    UC6 -.->|necessari per| UC7
    UC7 -.->|alimenta| UC8
```

---

## 2. Diagram de Flux de Reserva i Compra (Concurrència)

```mermaid
sequenceDiagram
    participant User1 as 👤 User 1<br/>(Browser 1)
    participant Client1 as 🔌 Socket.io Client
    participant Server as 🖥️ Backend Server
    participant DB as 🗄️ PostgreSQL
    participant Broadcast as 📡 Socket.io Broadcast
    participant User2 as 👤 User 2<br/>(Browser 2)
    
    rect rgb(200, 220, 255)
    Note over User1,User2: T=0ms → Ambdós cliquen seient A1 simultàniament
    User1->>Client1: click(seat_id=A1)
    User2->>Client1: click(seat_id=A1)
    end
    
    rect rgb(220, 250, 220)
    Note over Client1,DB: T=5ms → Socket.io emet als servidors
    Client1->>Server: emit('reserve-seat', {seat_id: A1})
    Client1->>Server: emit('reserve-seat', {seat_id: A1})
    end
    
    rect rgb(255, 240, 200)
    Note over Server,DB: T=10-30ms → Backend tanca race condition
    Server->>DB: BEGIN TRANSACTION 1
    Server->>DB: SELECT A1 FOR UPDATE LOCK
    Server->>DB: BEGIN TRANSACTION 2
    Server->>DB: SELECT A1 (BLOCKED, waiting for lock)
    
    DB->>Server: A1 lockeat per TX1
    Server->>DB: UPDATE A1 SET status='selected' (TX1)
    Server->>DB: COMMIT TX1 ✅
    
    DB->>Server: A1 locked unlocked, TX2 can proceed
    Server->>DB: SELECT A1 (TX2, ara és 'selected')
    Server->>Server: raise Error: SEAT_NOT_AVAILABLE
    Server->>DB: ROLLBACK TX2
    end
    
    rect rgb(255, 220, 220)
    Note over Server,User2: T=35ms → Error notificat a User2
    Server->>User2: emit('reservation-error', {error: SEAT_NOT_AVAILABLE})
    User2->>User2: mostrar alert❌
    end
    
    rect rgb(200, 255, 200)
    Note over Server,User1: T=40ms → Exito notificat a User1
    Server->>User1: emit('seat-selected', {reserva_token: ABC123})
    Server->>User1: emit('seat-reserved', {seat_id: A1})
    Broadcast->>Broadcast: io.to('event:X').emit('seat-selected')
    Broadcast->>User2: actualitza A1 color → propietat User1
    end
    
    rect rgb(240, 240, 240)
    Note over User1,Server: T=41-300s → Countdown + compra
    User1->>User1: veu countdown (5 min)
    User1->>User1: omple dades (nom, email)
    User1->>Client1: click('Confirmar compra')
    end
    
    rect rgb(200, 220, 255)
    Note over Server,DB: T=300s → Compra confirmada
    Client1->>Server: emit('confirm-purchase', {token: ABC123})
    Server->>DB: SELECT reserva WHERE token=ABC123
    Server->>DB: UPDATE seient SET status='sold'
    Server->>DB: INSERT entrada
    Server->>DB: COMMIT ✅
    end
    
    rect rgb(200, 255, 200)
    Note over Server,User1: T=302s → Notificació final
    Server->>User1: emit('reservation-confirmed', {entrades: [...]})
    Broadcast->>User2: io.to('event:X').emit('seat-sold', {seat_id: A1})
    User1->>User1: mostrar codi entrada ✅
    User2->>User2: mateixa actualització automàtica
    end
```

---

## 3. Diagram Entitat-Relació (ER)

```mermaid
erDiagram
    USUARI ||--o{ RESERVA : "fa"
    USUARI ||--o{ ENTRADA : "compra"
    USUARI ||--o{ SEIENT : "selecciona"
    
    ESDEVENIMENT ||--o{ ZONA : "conté"
    DESCOBRIMENT ||--o{ RESERVA : "té"
    DESCOBRIMENT ||--o{ ENTRADA : "genera"
    
    ZONA ||--o{ SEIENT : "conté"
    SEIENT ||--o{ RESERVA : "és reservat a"
    SEIENT ||--o{ ENTRADA : "és adquirit a"
    
    RESERVA ||--o{ SEIENT : "bloqueja"
    ENTRADA ||--o{ SEIENT : "conté"
    
    USUARI {
        uuid id PK
        string correu_electronic UK "Email única"
        string nom
        enum rol "comprador|administrador"
        string contrasenya
        timestamp created_at
        timestamp updated_at
    }
    
    DESCOBRIMENT {
        uuid id PK
        string nom
        datetime data_hora "Date + Time"
        string recinte "Venue"
        text descripcio
        string imatge "URL img"
        enum estat "actiu|cancelat|finalitzat"
        timestamp created_at
        timestamp updated_at
    }
    
    ZONA {
        uuid id PK
        uuid descobriment_id FK
        string nom "VIP, Platea, General"
        decimal preu "10.50, 120.00"
        integer capacitat "Nom. seients"
        timestamp created_at
    }
    
    SEIENT {
        uuid id PK
        uuid zona_id FK
        string numero "1, 2, 3..."
        string fila "A, B, C..."
        enum estat "disponible|seleccionat|reservat|venut"
        timestamp created_at
        timestamp updated_at
    }
    
    RESERVA {
        uuid id PK
        uuid usuari_id FK "nullable → anonimo"
        uuid descobriment_id FK
        string token "8 chars unique"
        datetime data_inici
        datetime data_expiracio "5 minuts"
        enum estat "activa|expirada|comprada|cancelada"
        timestamp created_at
        timestamp updated_at
    }
    
    ENTRADA {
        uuid id PK
        uuid reserva_id FK
        uuid usuari_id FK
        uuid descobriment_id FK
        string codi_entrada UK "ENT-XXXXXXXX"
        datetime data_compra
        timestamp created_at
    }
```

---

## 4. State Machine: Estat d'un Seient

```mermaid
stateDiagram-v2
    [*] --> disponible
    
    disponible --> seleccionat: Usuari clica + reserva
    
    seleccionat --> disponible: Reserva expira (5 min timeout)
    seleccionat --> disponible: Usuari cancel-la
    seleccionat --> venut: Usuari confirma compra
    
    venut --> [*]
    disponible --> [*]
    
    note right of seleccionat
        ⏱️ Countdown visible
        💾 Lockeat en BD (lock UPDATE)
        🔔 Altres usuaris veuen "reservat"
    end note
    
    note right of disponible
        ✅ Disponible per a reserva
        📊 Apareix blanc/verd al mapa
    end note
    
    note right of venut
        ✅ Solt finalitzat
        🎫 Entrada emesa
        ❌ No pot ser alliberada
    end note
```

---

## 5. Architecture Diagram: Sistema Complet

```mermaid
graph TB
    subgraph Client["🌐 Client Layer (Navegador)"]
        UI["Vue 3 Components<br/>- SeatMap.vue<br/>- Checkout.vue<br/>- AdminPanel.vue"]
        Store["Pinia Stores<br/>- seientStore<br/>- reservaStore<br/>- adminStore"]
        Socket["Socket.io Client<br/>WebSocket Connection"]
    end
    
    subgraph Transport["🔌 Transport Layer"]
        SocketServer["Socket.io Server<br/>handlers.ts"]
        REST["Express REST API<br/>Controllers"]
    end
    
    subgraph Logic["⚙️ Business Logic Layer"]
        ReservaService["reservaService<br/>crearReserva<br/>afegirSeient<br/>alliberar<br/>expirarReserva"]
        CompraService["compraService<br/>confirmarCompra<br/>validateOwner"]
        SeientService["seientService<br/>obtenirSeients<br/>updateEstats"]
    end
    
    subgraph Data["🗄️ Data Layer"]
        Models["Sequelize Models<br/>- Usuari<br/>- Descobriment<br/>- Seient<br/>- Reserva<br/>- Entrada"]
        Database["PostgreSQL<br/>Transaccions<br/>Locks (UPDATE)<br/>Constraints"]
    end
    
    subgraph External["🌍 External Services"]
        Auth["JWT Auth<br/>Tokens"]
        Email["Email Service<br/>(Opcional)"]
    end
    
    Client -->|Socket Events| SocketServer
    Client -->|REST Calls| REST
    Client -->|Real-time Updates| Socket
    
    SocketServer -->|Lógica de negoci| ReservaService
    REST -->|Lógica de negoci| ReservaService
    REST -->|Lógica de negoci| CompraService
    
    ReservaService -->|READ/WRITE| Models
    CompraService -->|READ/WRITE| Models
    SeientService -->|READ| Models
    
    Models -->|ORM| Database
    Database -->|Transacciones<br/>Locks| Database
    
    REST -->|Validar| Auth
    SocketServer -->|Opcional: JWT| Auth
    CompraService -->|Opcional: notify| Email
```

---

## 6. Timeline de Concurrència: Cas Llindar

```mermaid
graph LR
    T0["T=0ms<br/>👤 User1: Click A1<br/>👤 User2: Click A1"]
    T5["T=5ms<br/>🔌 Socket.io<br/>emet events"]
    T10["T=10ms<br/>🖥️ TX1 LOCK A1<br/>🖥️ TX2 ESPERA"]
    T15["T=15ms<br/>🖥️ TX1 UPDATE<br/>A1→'selected'"]
    T20["T=20ms<br/>🖥️ TX1 COMMIT<br/>🔓 Lock liberalitzat"]
    T25["T=25ms<br/>🖥️ TX2 VEU A1<br/>ja es selected"]
    T30["T=30ms<br/>🖥️ TX2 ERROR<br/>SEAT_NOT_AVAILABLE"]
    T35["T=35ms<br/>📡 Socket notifica<br/>tots els clients"]
    T40["T=40ms<br/>✅ User1: Reserva OK<br/>❌ User2: Error"]
    
    T0 --> T5 --> T10 --> T15 --> T20 --> T25 --> T30 --> T35 --> T40
    
    style T0 fill:#ff9999
    style T10 fill:#ffcc99
    style T20 fill:#99ff99
    style T30 fill:#ff9999
    style T40 fill:#99ff99,#ff9999
```

---

## 7. Database Schema (SQL)

```sql
-- USUARI: Compradors i administradors
CREATE TABLE usuari (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correu_electronic VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('comprador', 'administrador')) DEFAULT 'comprador',
    contrasenya VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DESCOBRIMENT: Concerts, festivals, etc.
CREATE TABLE descobriment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(200) NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    recinte VARCHAR(200) NOT NULL,
    descripcio TEXT,
    imatge VARCHAR(500),
    estat VARCHAR(20) CHECK (estat IN ('actiu', 'cancelat', 'finalitzat')) DEFAULT 'actiu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ZONA: Sections amb preus
CREATE TABLE zona (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descobriment_id UUID NOT NULL REFERENCES descobriment(id),
    nom VARCHAR(100) NOT NULL,
    preu DECIMAL(10,2) NOT NULL CHECK (preu >= 0),
    capacitat INTEGER NOT NULL CHECK (capacitat > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEIENT: Individual seat
CREATE TABLE seient (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zona_id UUID NOT NULL REFERENCES zona(id),
    numero VARCHAR(10) NOT NULL,
    fila VARCHAR(10) NOT NULL,
    estat VARCHAR(20) DEFAULT 'disponible' 
        CHECK (estat IN ('disponible', 'seleccionat', 'reservat', 'venut')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(zona_id, fila, numero)
);

-- INDEX para velocidad
CREATE INDEX idx_seient_zona ON seient(zona_id);
CREATE INDEX idx_seient_estat ON seient(estat);

-- RESERVA: Temporary holds (5 min)
CREATE TABLE reserva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuari_id UUID REFERENCES usuari(id),
    descobriment_id UUID NOT NULL REFERENCES descobriment(id),
    token VARCHAR(50) UNIQUE NOT NULL,
    data_inici TIMESTAMP NOT NULL,
    data_expiracio TIMESTAMP NOT NULL,
    estat VARCHAR(20) DEFAULT 'activa'
        CHECK (estat IN ('activa', 'expirada', 'comprada', 'cancelada')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- M2M: Reserva ↔ Seients
CREATE TABLE reserva_seient (
    reserva_id UUID PRIMARY KEY REFERENCES reserva(id),
    seient_id UUID PRIMARY KEY REFERENCES seient(id)
);

-- ENTRADA: Issued ticket
CREATE TABLE entrada (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID REFERENCES reserva(id),
    usuari_id UUID REFERENCES usuari(id),
    descobriment_id UUID NOT NULL REFERENCES descobriment(id),
    codi_entrada VARCHAR(50) UNIQUE NOT NULL,
    data_compra TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- M2M: Entrada ↔ Seients
CREATE TABLE entrada_seient (
    entrada_id UUID PRIMARY KEY REFERENCES entrada(id),
    seient_id UUID PRIMARY KEY REFERENCES seient(id)
);
```

---

## Resum Visual: Fluxo Complet

```
┌─────────────────────────────────────────────────────────────────┐
│  USUARI ANÓNIM → LOGIN → EVENT DETAIL → SEIENT SELECTION         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. VISUALITZAR EVENT                                             │
│     └─ GET /api/events/:id                                        │
│     └─ Socket.io: join-event → obté tots els seients             │
│                                                                   │
│  2. SELECCIONAR SEIENT (Crear Reserva)                           │
│     └─ Socket.io: reserve-seat                                    │
│     └─ Backend: BEGIN TRANSACTION → LOCK SEIENT → UPDATE STATUS  │
│     └─ Socket.io: BROADCAST seat-selected a tots els clients     │
│     └─ Frontend: Mostrar COUNTDOWN 5 minuts                       │
│                                                                   │
│  3. EXPIRACIÓ (Opcional)                                         │
│     └─ Después de 5 min: socket-io emet reservation-expired      │
│     └─ Seient torna a 'disponible'                               │
│                                                                   │
│  4. COMPRAR (Opcional)                                           │
│     └─ Usuario omple dades (nom, email)                          │
│     └─ Socket.io: confirm-purchase                                │
│     └─ Backend: UPDATE seient='sold' + INSERT entrada             │
│     └─ Socket.io: BROADCAST seat-sold a tots                     │
│     └─ Frontend: Mostrar CODI ENTRADA                             │
│                                                                   │
│  5. CONSULTAR ENTRADES (Posterior)                               │
│     └─ GET /api/entrades?email=user@example.com                  │
│     └─ Mostrar totes les entrades de l'usuari                    │
│                                                                   │
│  [ADMIN PANEL - Opcional]                                        │
│     └─ GET /api/admin/events/:id/stats                            │
│     └─ GET /api/admin/events/:id/report                           │
│     └─ Mostrar: seients per estat, ocupació %, reserves actives   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

**Diagrams generats amb Mermaid.js - Renderble en GitHub/Markdown**
