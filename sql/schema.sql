-- Esquema de base de dades per a Plataforma de Venda d'Entrades

-- Extensió per a UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Taula: Usuari
CREATE TABLE IF NOT EXISTS usuari (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correu_electronic VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('comprador', 'administrador')),
    contrasenya VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Taula: Esdeveniment
CREATE TABLE IF NOT EXISTS esdeveniment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(200) NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    recinte VARCHAR(200) NOT NULL,
    descripcio TEXT,
    imatge VARCHAR(500),
    estat VARCHAR(20) DEFAULT 'actiu' CHECK (estat IN ('actiu', 'cancelat', 'finalitzat')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Taula: Zona
CREATE TABLE IF NOT EXISTS zona (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    esdeveniment_id UUID NOT NULL REFERENCES esdeveniment(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    preu DECIMAL(10, 2) NOT NULL CHECK (preu >= 0),
    capacitat INTEGER NOT NULL CHECK (capacitat >= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_zona_esdeveniment FOREIGN KEY (esdeveniment_id) REFERENCES esdeveniment(id)
);

-- Taula: Seient
CREATE TABLE IF NOT EXISTS seient (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zona_id UUID NOT NULL REFERENCES zona(id) ON DELETE CASCADE,
    numero VARCHAR(10) NOT NULL,
    fila VARCHAR(10) NOT NULL,
    estat VARCHAR(20) DEFAULT 'disponible' CHECK (estat IN ('disponible', 'reservat', 'seleccionat', 'venut')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seient_zona FOREIGN KEY (zona_id) REFERENCES zona(id),
    CONSTRAINT uk_seient_zona_numero_fila UNIQUE (zona_id, numero, fila)
);

-- Taula: Reserva
CREATE TABLE IF NOT EXISTS reserva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuari_id UUID REFERENCES usuari(id) ON DELETE SET NULL,
    esdeveniment_id UUID NOT NULL REFERENCES esdeveniment(id) ON DELETE CASCADE,
    token VARCHAR(50) UNIQUE NOT NULL,
    data_inici TIMESTAMP NOT NULL,
    data_expiracio TIMESTAMP NOT NULL,
    estat VARCHAR(20) DEFAULT 'activa' CHECK (estat IN ('activa', 'expirada', 'comprada', 'cancelada')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_usuari FOREIGN KEY (usuari_id) REFERENCES usuari(id),
    CONSTRAINT fk_reserva_esdeveniment FOREIGN KEY (esdeveniment_id) REFERENCES esdeveniment(id)
);

-- Taula: ReservaSeient (relació many-to-many)
CREATE TABLE IF NOT EXISTS reserva_seient (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL REFERENCES reserva(id) ON DELETE CASCADE,
    seient_id UUID NOT NULL REFERENCES seient(id) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_seient_reserva FOREIGN KEY (reserva_id) REFERENCES reserva(id),
    CONSTRAINT fk_reserva_seient_seient FOREIGN KEY (seient_id) REFERENCES seient(id),
    CONSTRAINT uk_reserva_seient UNIQUE (reserva_id, seient_id)
);

-- Taula: Entrada
CREATE TABLE IF NOT EXISTS entrada (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID REFERENCES reserva(id) ON DELETE SET NULL,
    usuari_id UUID REFERENCES usuari(id) ON DELETE SET NULL,
    esdeveniment_id UUID NOT NULL REFERENCES esdeveniment(id) ON DELETE CASCADE,
    codi_entrada VARCHAR(50) UNIQUE NOT NULL,
    data_compra TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_entrada_reserva FOREIGN KEY (reserva_id) REFERENCES reserva(id),
    CONSTRAINT fk_entrada_usuari FOREIGN KEY (usuari_id) REFERENCES usuari(id),
    CONSTRAINT fk_entrada_esdeveniment FOREIGN KEY (esdeveniment_id) REFERENCES esdeveniment(id)
);

-- Taula: EntradaSeient (relació many-to-many)
CREATE TABLE IF NOT EXISTS entrada_seient (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrada_id UUID NOT NULL REFERENCES entrada(id) ON DELETE CASCADE,
    seient_id UUID NOT NULL REFERENCES seient(id) ON DELETE CASCADE,
    CONSTRAINT fk_entrada_seient_entrada FOREIGN KEY (entrada_id) REFERENCES entrada(id),
    CONSTRAINT fk_entrada_seient_seient FOREIGN KEY (seient_id) REFERENCES seient(id),
    CONSTRAINT uk_entrada_seient UNIQUE (entrada_id, seient_id)
);

-- Índexs per a millorar rendiment
CREATE INDEX IF NOT EXISTS idx_seient_zona ON seient(zona_id);
CREATE INDEX IF NOT EXISTS idx_seient_estat ON seient(estat);
CREATE INDEX IF NOT EXISTS idx_zona_esdeveniment ON zona(esdeveniment_id);
CREATE INDEX IF NOT EXISTS idx_reserva_esdeveniment ON reserva(esdeveniment_id);
CREATE INDEX IF NOT EXISTS idx_reserva_usuari ON reserva(usuari_id);
CREATE INDEX IF NOT EXISTS idx_reserva_token ON reserva(token);
CREATE INDEX IF NOT EXISTS idx_entrada_usuari ON entrada(usuari_id);
CREATE INDEX IF NOT EXISTS idx_entrada_codi ON entrada(codi_entrada);
CREATE INDEX IF NOT EXISTS idx_entrada_esdeveniment ON entrada(esdeveniment_id);
