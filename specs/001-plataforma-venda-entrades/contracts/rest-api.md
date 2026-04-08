# REST API Contracts

## Endpoints d'Esdeveniments

### GET /api/esdeveniments
Retorna la llista d'esdeveniments disponibles.

**Response 200:**
```json
{
  "esdeveniments": [
    {
      "id": "uuid",
      "nom": "Concert de música",
      "data_hora": "2026-05-15T20:00:00Z",
      "recinte": "Palau de la Música",
      "descripcio": "Concert de música clàssica",
      "estat": "actiu",
      "zones": [
        {
          "id": "uuid",
          "nom": "Platea",
          "preu": 50.00,
          "capacitat": 100
        }
      ]
    }
  ]
}
```

### GET /api/esdeveniments/:id
Retorna els detalls d'un esdeveniment.

**Response 200:**
```json
{
  "id": "uuid",
  "nom": "Concert de música",
  "data_hora": "2026-05-15T20:00:00Z",
  "recinte": "Palau de la Música",
  "descripcio": "Concert de música clàssica",
  "estat": "actiu",
  "zones": [...],
  "seients": [
    {
      "id": "uuid",
      "numero": "1",
      "fila": "A",
      "zona_id": "uuid",
      "estat": "disponible"
    }
  ]
}
```

## Endpoints de Reserves

### POST /api/reserves
Crea una nova reserva de seients.

**Request:**
```json
{
  "esdeveniment_id": "uuid",
  "seient_ids": ["uuid1", "uuid2"]
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "token": "abc123token",
  "data_inici": "2026-03-24T10:00:00Z",
  "data_expiracio": "2026-03-24T10:05:00Z",
  "seients": [
    {
      "id": "uuid",
      "numero": "1",
      "fila": "A",
      "estat": "seleccionat"
    }
  ]
}
```

**Response 409 (Conflict):**
```json
{
  "error": "SEIENT_NO_DISPONIBLE",
  "missatge": "El seient A-1 ja no està disponible",
  "seients_no_disponibles": ["uuid1"]
}
```

## Endpoints de Compra

### POST /api/compres
Confirma la compra d'una reserva.

**Request:**
```json
{
  "reserva_token": "abc123token",
  "usuari": {
    "nom": "Joan Pérez",
    "correu": "joan@exemple.cat"
  }
}
```

**Response 201:**
```json
{
  "compres": [
    {
      "codi_entrada": "ENT-ABC123",
      "esdeveniment": {
        "id": "uuid",
        "nom": "Concert de música",
        "data_hora": "2026-05-15T20:00:00Z",
        "recinte": "Palau de la Música"
      },
      "seients": [
        {
          "numero": "1",
          "fila": "A",
          "zona": "Platea"
        }
      ]
    }
  ]
}
```

**Response 400:**
```json
{
  "error": "RESERVA_EXPIRADA",
  "missatge": "La reserva ha expirat"
}
```

## Endpoints d'Entrades

### GET /api/entrades
Cerca entrades pel correu electrònic.

**Query:** `?correu=joan@exemple.cat`

**Response 200:**
```json
{
  "entrades": [
    {
      "codi_entrada": "ENT-ABC123",
      "esdeveniment": {
        "id": "uuid",
        "nom": "Concert de música",
        "data_hora": "2026-05-15T20:00:00Z",
        "recinte": "Palau de la Música"
      },
      "seients": [...],
      "data_compra": "2026-03-24T10:00:00Z"
    }
  ]
}
```

## Endpoints d'Administració

### POST /api/admin/esdeveniments
Crea un nou esdeveniment (requereix autenticació).

### PUT /api/admin/esdeveniments/:id
Actualitza un esdeveniment (requereix autenticació).

### GET /api/admin/estadistiques
Retorna estadístiques en temps real (requereix autenticació).

**Response 200:**
```json
{
  "usuaris_connectats": 150,
  "reserves_actives": 23,
  "compres_confirmades": 45,
  "seients": {
    "disponibles": 500,
    "reservats": 23,
    "venuts": 77
  },
  "recollida": {
    "total": 5000.00,
    "per_tipus": {
      "Platea": 2500.00,
      "Tribuna": 1500.00,
      "General": 1000.00
    }
  }
}
```
