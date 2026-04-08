-- Dades inicials per a Plataforma de Venda d'Entrades

-- Inserir usuari administrador
INSERT INTO usuari (id, correu_electronic, nom, rol, contrasenya) 
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@entrades.cat', 'Administrador', 'administrador', '$2a$10$X5wFuQsXfQ8h7H8Y9Q0Z0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

-- Inserir esdeveniments
INSERT INTO esdeveniment (id, nom, data_hora, recinte, descripcio, estat) VALUES 
    ('e1111111-1111-1111-1111-111111111112', 'Concert de Música Clàssica', '2026-06-15 20:00:00', 'Palau de la Música Catalana', 'Una nit inoblidable de música clàssica.', 'actiu'),
    ('e2222222-2222-2222-2222-222222222223', 'Coldplay - Music of the Spheres', '2026-07-10 20:00:00', 'Estadi Olímpic', 'Gira mundial 2026.', 'actiu'),
    ('e3333333-3333-3333-3333-333333333334', 'Taylor Swift - Eras Tour', '2026-07-25 21:00:00', 'Camp Nou', 'El concert definitiu.', 'actiu'),
    ('e4444444-4444-4444-4444-444444444445', 'Festival de Cap d''Any', '2026-12-31 22:00:00', 'Fira Barcelona', 'Els millors artists.', 'actiu'),
    ('e5555555-5555-5555-5555-555555555556', 'Rock Fest Barcelona', '2026-08-15 18:00:00', 'Castelldefels', 'Rock fins morts.', 'actiu');

-- Inserir zones per a tots els esdeveniments
INSERT INTO zona (id, esdeveniment_id, nom, preu, capacitat) VALUES 
    ('00000001-0000-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111112', 'VIP', 150.00, 30),
    ('00000001-0000-0000-0000-000000000002', 'e1111111-1111-1111-1111-111111111112', 'Platea', 75.00, 50),
    ('00000001-0000-0000-0000-000000000003', 'e1111111-1111-1111-1111-111111111112', 'General', 35.00, 100),
    ('00000002-0000-0000-0000-000000000001', 'e2222222-2222-2222-2222-222222222223', 'VIP', 250.00, 50),
    ('00000002-0000-0000-0000-000000000002', 'e2222222-2222-2222-2222-222222222223', 'Platea', 120.00, 150),
    ('00000002-0000-0000-0000-000000000003', 'e2222222-2222-2222-2222-222222222223', 'General', 60.00, 400),
    ('00000003-0000-0000-0000-000000000001', 'e3333333-3333-3333-3333-333333333334', 'VIP', 300.00, 80),
    ('00000003-0000-0000-0000-000000000002', 'e3333333-3333-3333-3333-333333333334', 'Platea', 150.00, 200),
    ('00000003-0000-0000-0000-000000000003', 'e3333333-3333-3333-3333-333333333334', 'General', 80.00, 500),
    ('00000004-0000-0000-0000-000000000001', 'e4444444-4444-4444-4444-444444444445', 'VIP', 200.00, 60),
    ('00000004-0000-0000-0000-000000000002', 'e4444444-4444-4444-4444-444444444445', 'General', 100.00, 400),
    ('00000005-0000-0000-0000-000000000001', 'e5555555-5555-5555-5555-555555555556', 'VIP', 180.00, 40),
    ('00000005-0000-0000-0000-000000000002', 'e5555555-5555-5555-5555-555555555556', 'Platea', 90.00, 150),
    ('00000005-0000-0000-0000-000000000003', 'e5555555-5555-5555-5555-555555555556', 'General', 45.00, 350);

-- Inserir seients per a cada zona
INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000001-0000-0000-0000-000000000001' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 6) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000001-0000-0000-0000-000000000002' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 10) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000001-0000-0000-0000-000000000003' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 20) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000002-0000-0000-0000-000000000001' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 6) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000002-0000-0000-0000-000000000002' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 15) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000002-0000-0000-0000-000000000003' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 40) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000003-0000-0000-0000-000000000001' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 8) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000003-0000-0000-0000-000000000002' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 20) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000003-0000-0000-0000-000000000003' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 50) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000004-0000-0000-0000-000000000001' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 6) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000004-0000-0000-0000-000000000002' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 40) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000005-0000-0000-0000-000000000001' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 4) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000005-0000-0000-0000-000000000002' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 15) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);

INSERT INTO seient (zona_id, numero, fila, estat) 
SELECT '00000005-0000-0000-0000-000000000003' as zona_id, s.numero::text, f.fila, 'disponible' as estat
FROM generate_series(1, 35) s(numero) CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J')) f(fila);
