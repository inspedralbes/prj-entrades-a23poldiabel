-- Esquema SQL de referencia (PostgreSQL)
-- Nota: en runtime es continua utilitzant migracions Laravel.

CREATE TABLE IF NOT EXISTS users (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password VARCHAR(255) NOT NULL,
	role VARCHAR(30) NOT NULL DEFAULT 'comprador',
	email_verified_at TIMESTAMP NULL,
	remember_token VARCHAR(100) NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	date_time TIMESTAMP NOT NULL,
	venue VARCHAR(255) NOT NULL,
	description TEXT NULL,
	image_url VARCHAR(500) NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'active',
	external_source VARCHAR(80) NULL,
	external_id VARCHAR(120) NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zones (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
	zone_key VARCHAR(120) NOT NULL,
	zone_name VARCHAR(120) NOT NULL,
	price NUMERIC(10,2) NOT NULL,
	color VARCHAR(50) NULL,
	UNIQUE (event_id, zone_key)
);

CREATE TABLE IF NOT EXISTS seats (
	id BIGSERIAL PRIMARY KEY,
	event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
	zone_id BIGINT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
	row VARCHAR(8) NOT NULL,
	seat_number INTEGER NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
	reserved_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
	sold_by BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
	UNIQUE (event_id, zone_id, row, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seats_event_status ON seats(event_id, status);

CREATE TABLE IF NOT EXISTS reservations (
	id BIGSERIAL PRIMARY KEY,
	seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
	status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	reserved_at TIMESTAMP NOT NULL DEFAULT NOW(),
	expires_at TIMESTAMP NOT NULL,
	confirmed_at TIMESTAMP NULL,
	completed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_reservations_event_status_expires ON reservations(event_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_user_status_expires ON reservations(user_id, status, expires_at);

CREATE TABLE IF NOT EXISTS purchases (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
	total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
	status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
	first_name VARCHAR(120) NULL,
	last_name VARCHAR(120) NULL,
	email VARCHAR(180) NULL,
	completed_at TIMESTAMP NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_event_status ON purchases(event_id, status);

CREATE TABLE IF NOT EXISTS purchase_items (
	id BIGSERIAL PRIMARY KEY,
	purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
	seat_id BIGINT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
	zone_name VARCHAR(120) NULL,
	price NUMERIC(10,2) NOT NULL DEFAULT 0,
	created_at TIMESTAMP NOT NULL DEFAULT NOW(),
	UNIQUE (purchase_id, seat_id)
);
