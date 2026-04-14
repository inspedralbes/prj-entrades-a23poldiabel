-- Dades inicials de demostracio (PostgreSQL)
-- Les contrasenyes son hash bcrypt de prova: "Secret123!"

INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES
	('Administrador', 'admin@gmail.com', '$2y$12$H36k1N8VI5xIlnJrpedQYuovVY8M8vHqQ5rQF6UtY5X79Xa8f0nLa', 'administrador', NOW(), NOW()),
	('Usuari Demo', 'user@gmail.com', '$2y$12$H36k1N8VI5xIlnJrpedQYuovVY8M8vHqQ5rQF6UtY5X79Xa8f0nLa', 'comprador', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO events (name, date_time, venue, description, status, created_at, updated_at)
VALUES (
	'Concert d''Alta Demanda',
	NOW() + INTERVAL '14 days',
	'Palau de la Musica',
	'Esdeveniment de prova per validar concurrencia i reserves en temps real.',
	'active',
	NOW(),
	NOW()
)
ON CONFLICT DO NOTHING;

WITH evt AS (
	SELECT id FROM events ORDER BY id DESC LIMIT 1
),
zone_ins AS (
	INSERT INTO zones (event_id, zone_key, zone_name, price, color)
	SELECT id, 'general', 'General', 35.00, 'rgba(33,150,243,0.8)' FROM evt
	ON CONFLICT (event_id, zone_key) DO NOTHING
	RETURNING id, event_id
),
zone_pick AS (
	SELECT id, event_id FROM zone_ins
	UNION ALL
	SELECT z.id, z.event_id
	FROM zones z
	JOIN evt e ON e.id = z.event_id
	WHERE z.zone_key = 'general'
	LIMIT 1
)
INSERT INTO seats (event_id, zone_id, row, seat_number, status, created_at, updated_at)
SELECT zp.event_id,
			 zp.id,
			 chr(64 + r.row_num),
			 s.seat_num,
			 'AVAILABLE',
			 NOW(),
			 NOW()
FROM zone_pick zp
CROSS JOIN generate_series(1, 6) AS r(row_num)
CROSS JOIN generate_series(1, 12) AS s(seat_num)
ON CONFLICT (event_id, zone_id, row, seat_number) DO NOTHING;
