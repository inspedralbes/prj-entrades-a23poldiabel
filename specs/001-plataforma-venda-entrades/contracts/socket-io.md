# Socket.io Events Contract

## Events del Client al Servidor

### connect
El client es connecta a un room de l'esdeveniment.

```json
{
  "event": "join-event",
  "data": {
    "esdeveniment_id": "uuid"
  }
}
```

### reserve-seat
El client demana reservar un seient.

```json
{
  "event": "reserve-seat",
  "data": {
    "seient_id": "uuid"
  }
}
```

### release-seat
El client allibera un seient que havia reservat.

```json
{
  "event": "release-seat",
  "data": {
    "seient_id": "uuid"
  }
}
```

### confirm-purchase
El client confirma la compra dels seients reservats.

```json
{
  "event": "confirm-purchase",
  "data": {
    "reserva_token": "abc123token",
    "usuari": {
      "nom": "Joan Pérez",
      "correu": "joan@exemple.cat"
    }
  }
}
```

## Events del Servidor al Client

### event-joined
Confirmació d'unió a l'esdeveniment.

```json
{
  "event": "event-joined",
  "data": {
    "esdeveniment_id": "uuid",
    "seients": [
      {
        "id": "uuid",
        "numero": "1",
        "fila": "A",
        "zona_id": "uuid",
        "estat": "disponible"
      }
    ],
    "reserva_activa": null
  }
}
```

### seat-reserved
Notificació quan un seient és reservat (per qualsevol usuari).

```json
{
  "event": "seat-reserved",
  "data": {
    "seient_id": "uuid",
    "estat": "reservat",
    "per_usuari": "uuid"  // ID de l'usuari (no mostrat al client normal)
  }
}
```

### seat-selected
Notificació quan un seient és seleccionat per l'usuari actual.

```json
{
  "event": "seat-selected",
  "data": {
    "seient_id": "uuid",
    "reserva": {
      "id": "uuid",
      "token": "abc123token",
      "data_expiracio": "2026-03-24T10:05:00Z"
    }
  }
}
```

### seat-released
Notificació quan un seient és alliberat.

```json
{
  "event": "seat-released",
  "data": {
    "seient_id": "uuid",
    "estat": "disponible"
  }
}
```

### seat-sold
Notificació quan un seient és venut.

```json
{
  "event": "seat-sold",
  "data": {
    "seient_id": "uuid",
    "estat": "venut"
  }
}
```

### reservation-expired
Notificació quan la reserva de l'usuari ha expirat.

```json
{
  "event": "reservation-expired",
  "data": {
    "missatge": "La teva reserva ha expirat",
    "seients_afectats": ["uuid1", "uuid2"]
  }
}
```

### reservation-confirmed
Notificació quan la compra ha estat confirmada.

```json
{
  "event": "reservation-confirmed",
  "data": {
    "entrades": [
      {
        "codi_entrada": "ENT-ABC123",
        "seients": [...]
      }
    ]
  }
}
```

### reservation-error
Notificació d'error en una operació.

```json
{
  "event": "reservation-error",
  "data": {
    "error": "SEIENT_NO_DISPONIBLE",
    "missatge": "El seient A-1 ja no està disponible",
    "seient_id": "uuid"
  }
}
```

### admin-stats-update
Notificació periòdica d'estadístiques (per a admins).

```json
{
  "event": "admin-stats-update",
  "data": {
    "usuaris_connectats": 150,
    "reserves_actives": 23,
    "compres_confirmades": 45,
    "seients": {
      "disponibles": 500,
      "reservats": 23,
      "venuts": 77
    }
  }
}
```

## Room Structure

- `event:{esdeveniment_id}` - Tots els usuaris visualitzant un esdeveniment
- `admin` - Només administradors (per a estadístiques globals)
