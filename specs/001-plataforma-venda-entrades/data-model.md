# Data Model: Plataforma de Venda d'Entrades

## Entities

### Usuari
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| correu_electronic | String | Unique, Email | Correu electrònic de l'usuari |
| nom | String | Required, Max 100 | Nom de l'usuari |
| rol | Enum | ['comprador', 'administrador'] | Rol de l'usuari |
| contrasenya | String | Hashed | Contrasenya (només per administradors) |
| created_at | Timestamp | Auto | Data de creació |
| updated_at | Timestamp | Auto | Data d'actualització |

### Esdeveniment
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| nom | String | Required, Max 200 | Nom de l'esdeveniment |
| data_hora | Timestamp | Required | Data i hora de l'esdeveniment |
| recinte | String | Required, Max 200 | Nom del recinte |
| descripcio | Text | Optional | Descripció de l'esdeveniment |
| estat | Enum | ['actiu', 'cancelat', 'finalitzat'] | Estat de l'esdeveniment |
| created_at | Timestamp | Auto | Data de creació |
| updated_at | Timestamp | Auto | Data d'actualització |

### Zona
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| esdeveniment_id | UUID | Foreign Key | Referència a l'esdeveniment |
| nom | String | Required, Max 100 | Nom de la zona (e.g., "Platea", "Tribuna") |
| preu | Decimal | Required, Min 0 | Preu base de la zona |
| capacitat | Integer | Required, Min 1 | Nombre de seients a la zona |
| created_at | Timestamp | Auto | Data de creació |

### Seient
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| zona_id | UUID | Foreign Key | Referència a la zona |
| numero | String | Required | Número del seient |
| fila | String | Required | Fila del seient |
| estat | Enum | ['disponible', 'reservat', 'seleccionat', 'venut'] | Estat del seient |
| created_at | Timestamp | Auto | Data de creació |
| updated_at | Timestamp | Auto | Data d'actualització |

**Unique constraint**: (zona_id, numero, fila)

### Reserva
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| usuari_id | UUID | Foreign Key | Referència a l'usuari |
| esdeveniment_id | UUID | Foreign Key | Referència a l'esdeveniment |
| token | String | Unique | Token temporal d'identificació |
| data_inici | Timestamp | Required | Data d'inici de la reserva |
| data_expiracio | Timestamp | Required | Data d'expiració de la reserva |
| estat | Enum | ['activa', 'expirada', 'comprada', 'cancelada'] | Estat de la reserva |
| created_at | Timestamp | Auto | Data de creació |
| updated_at | Timestamp | Auto | Data d'actualització |

### ReservaSeient
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| reserva_id | UUID | Foreign Key | Referència a la reserva |
| seient_id | UUID | Foreign Key | Referència al seient |

### Entrada
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| reserva_id | UUID | Foreign Key | Referència a la reserva (pot ser null) |
| usuari_id | UUID | Foreign Key | Referència a l'usuari comprador |
| esdeveniment_id | UUID | Foreign Key | Referència a l'esdeveniment |
| codi_entrada | String | Unique | Codi únic de l'entrada |
| data_compra | Timestamp | Required | Data de la compra |
| created_at | Timestamp | Auto | Data de creació |

### EntradaSeient
| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | UUID | Primary Key | Identificador únic |
| entrada_id | UUID | Foreign Key | Referència a l'entrada |
| seient_id | UUID | Foreign Key | Referència al seient |

## Relationships

```
Esdeveniment 1 --> N Zona
Zona 1 --> N Seient
Esdeveniment 1 --> N Reserva
Esdeveniment 1 --> N Entrada
Usuari 1 --> N Reserva
Usuari 1 --> N Entrada
Reserva 1 --> N ReservaSeient --> Seient
Entrada 1 --> N EntradaSeient --> Seient
```

## State Transitions

### Seient
```
disponible --> reservat (quan usuari el selecciona)
reservat --> seleccionat (quan el servidor accepta la reserva)
reservat --> disponible (quan expira la reserva)
seleccionat --> venut (quan es confirma la compra)
seleccionat --> disponible (quan expira la selecció)
venut --> (estat final, no transicions)
```

### Reserva
```
activa --> comprada (quan es confirma pagament)
activa --> expirada (quan passa data_expiracio)
activa --> cancelada (quan l'usuari cancel·la)
expirada --> (estat final)
comprada --> (estat final)
cancelada --> (estat final)
```

## Validation Rules

1. Un seient només pot tenir UNA reserva activa a la vegada
2. Un usuari no pot tenir més de N reserves actives simultànies (límit configurable)
3. Una reserva només pot incloure seients de l'ESQUERPA mateix esdeveniment
4. El preu total de l'entrada = suma de preus de les zones dels seients seleccionats
5. Només es poden comprar seients que l'usuari tingui reserves actives
