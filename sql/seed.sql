-- Dades inicials per a tests i demostració

-- Usuarios de prova
INSERT INTO users (email, password_hash, full_name, phone) VALUES
('admin@entrades.local', '$2b$10$dummyhash', 'Admin User', '932000000'),
('user1@entrades.local', '$2b$10$dummyhash', 'Pere Fernández', '631123456'),
('user2@entrades.local', '$2b$10$dummyhash', 'Maria González', '631234567'),
('user3@entrades.local', '$2b$10$dummyhash', 'Joan Martínez', '631345678'),
('user4@entrades.local', '$2b$10$dummyhash', 'Carme López', '631456789'),
('user5@entrades.local', '$2b$10$dummyhash', 'Jaume Santos', '631567890')
ON CONFLICT (email) DO NOTHING;

-- Els 20 eventos de Ticketmaster
INSERT INTO events (external_id, name, description, venue, date_time, image_url, status) VALUES
('Z698xZ2qZ16vAy7kFA', 'Pitbull - I''m Back!', 'Pitbull en concert', 'Palau Sant Jordi', '2026-11-04 19:30:00', 'https://s1.ticketm.net/dam/a/aeb/81f889da-73cd-4887-8120-e24e0c4d4aeb_SOURCE', 'active'),
('Z698xZ2qZ16vA-Q_8K', 'Niall Horan: Dinner Party Live On Tour', 'Niall Horan en directe', 'Palau Sant Jordi', '2026-10-25 20:15:00', 'https://s1.ticketm.net/dam/a/335/442edcd4-95b1-46a0-ba6d-5fe693acd335_ARTIST_PAGE_3_2.jpg', 'active'),
('Z698xZ2qZ16vo6_AOf', 'The Weeknd: After Hours Til Dawn Tour | VIP Packages', 'The Weeknd en Barcelona', 'Estadi Olímpic Lluis Companys', '2026-09-01 18:00:00', 'https://s1.ticketm.net/dam/a/3d0/f0586391-c689-4859-bc4f-2962c48cd3d0_TABLET_LANDSCAPE_LARGE_16_9.jpg', 'active'),
('Z698xZ2qZ1kjYCKbV', 'The Weeknd: After Hours Til Dawn Tour', 'The Weeknd - Entrada General', 'Estadi Olímpic Lluis Companys', '2026-09-01 18:00:00', 'https://s1.ticketm.net/dam/a/3d0/f0586391-c689-4859-bc4f-2962c48cd3d0_TABLET_LANDSCAPE_LARGE_16_9.jpg', 'active'),
('Z698xZ2qZ1k4y_346', 'Bad Bunny - DeBÍ TiRAR MáS FOToS World Tour | VIP Packages', 'Bad Bunny VIP', 'Estadi Olímpic Lluis Companys', '2026-05-22 18:00:00', 'https://s1.ticketm.net/dam/a/ac0/5a0435d2-95f1-491d-911a-598d513e5ac0_SOURCE', 'active'),
('Z698xZ2qZ1k_K_JAU', 'Bad Bunny - DeBÍ TiRAR MáS FOToS World Tour', 'Bad Bunny - Entrada General', 'Estadi Olímpic Lluis Companys', '2026-05-22 18:00:00', 'https://s1.ticketm.net/dam/a/ac0/5a0435d2-95f1-491d-911a-598d513e5ac0_SOURCE', 'active'),
('Z7r9jZ1A7p8QZ', 'Bad Bunny', 'Bad Bunny a Olímpic', 'Estadi Olimpic Lluis Companys', '2026-05-22 18:00:00', 'https://s1.ticketm.net/dam/a/598/144e8308-c5a1-4f38-b913-e38d9d02f598_SOURCE', 'active'),
('Z698xZ2qZ16v7p18Go', 'Bad Bunny - DeBÍ TiRAR MáS FOToS World Tour', 'Bad Bunny dia 2', 'Estadi Olímpic Lluis Companys', '2026-05-23 18:00:00', 'https://s1.ticketm.net/dam/a/ac0/5a0435d2-95f1-491d-911a-598d513e5ac0_SOURCE', 'active'),
('Z698xZ2qZ1kGz3kFv', 'Bad Bunny - DeBÍ TiRAR MáS FOToS World Tour | VIP Packages', 'Bad Bunny VIP dia 2', 'Estadi Olímpic Lluis Companys', '2026-05-23 18:00:00', 'https://s1.ticketm.net/dam/a/ac0/5a0435d2-95f1-491d-911a-598d513e5ac0_SOURCE', 'active'),
('Z7r9jZ1A7p81Z', 'Bad Bunny', 'Bad Bunny dia 2 Olímpic', 'Estadi Olimpic Lluis Companys', '2026-05-23 18:00:00', 'https://s1.ticketm.net/dam/a/598/144e8308-c5a1-4f38-b913-e38d9d02f598_SOURCE', 'active'),
('Z698xZ2qZ1kj60oJv', 'Joe Bonamassa - 2026 EUROPE TOUR', 'Joe Bonamassa en Barcelona', 'Sant Jordi Club', '2026-11-07 19:00:00', 'https://s1.ticketm.net/dam/a/0f2/5fc2fa27-33d7-47ba-af75-dad7a6d840f2_RECOMENDATION_16_9.jpg', 'active'),
('Z698xZ2qZ1k-f4V7k', 'ERIC CLAPTON - EUROPEAN TOUR 2026', 'Eric Clapton a Barcelona', 'Palau Sant Jordi', '2026-05-10 19:00:00', 'https://s1.ticketm.net/dam/a/bcf/36e60e82-04f8-4997-b57a-58e91017abcf_CUSTOM.jpg', 'active'),
('Z698xZ2qZ1kCoroa9', 'ERIC CLAPTON - EUROPEAN TOUR 2026 | VIP Packages', 'Eric Clapton VIP', 'Palau Sant Jordi', '2026-05-10 19:00:00', 'https://s1.ticketm.net/dam/a/bcf/36e60e82-04f8-4997-b57a-58e91017abcf_CUSTOM.jpg', 'active'),
('Z698xZ2qZ1kQKfE0v', 'Louis Tomlinson - How Did We Get Here? World Tour', 'Louis Tomlinson en concert', 'Palau Sant Jordi', '2026-04-12 19:00:00', 'https://s1.ticketm.net/dam/a/68c/b3dcece4-12b0-4210-8bb1-a0a36478768c_SOURCE', 'active'),
('Z698xZ2qZ1k17k6PS', 'Hombres G - Los Mejores Años de nuestra vida | VIP Packages', 'Hombres G VIP', 'Palau Sant Jordi', '2026-10-03 19:00:00', 'https://s1.ticketm.net/dam/a/e39/cdfc0976-82e1-4b61-bdb6-a30d36e4be39_CUSTOM.jpg', 'active'),
('Z698xZ2qZ1kjMvkop', 'Hombres G - Los Mejores Años de nuestra vida', 'Hombres G - Entrada General', 'Palau Sant Jordi', '2026-10-03 19:00:00', 'https://s1.ticketm.net/dam/a/e39/cdfc0976-82e1-4b61-bdb6-a30d36e4be39_CUSTOM.jpg', 'active'),
('Z698xZ2qZ16vZyFP16', 'LANY: soft world tour | VIP Packages', 'LANY VIP', 'Sala Razzmatazz 1', '2026-05-27 18:30:00', 'https://s1.ticketm.net/dam/a/607/2a949f0e-22e8-4206-b340-3ae40c2a6607_TABLET_LANDSCAPE_LARGE_16_9.jpg', 'active'),
('Z698xZ2qZ16vvkuvv7', 'LANY: soft world tour', 'LANY - Entrada General', 'Sala Razzmatazz 1', '2026-05-27 18:30:00', 'https://s1.ticketm.net/dam/a/607/2a949f0e-22e8-4206-b340-3ae40c2a6607_TABLET_LANDSCAPE_LARGE_16_9.jpg', 'active'),
('Z698xZ2qZ1kpKbPpo', 'RAWAYANA - ¿Dónde Es El After? World Tour', 'RAWAYANA en Barcelona', 'Palau Sant Jordi', '2026-05-17 18:30:00', 'https://s1.ticketm.net/dam/a/4ca/41380759-378a-45f1-9abf-00052710e4ca_ARTIST_PAGE_3_2.jpg', 'active'),
('Z698xZ2qZ16vka0zk3', 'Band of Horses - Celebrating 20 Years of Everything All The Time', 'Band of Horses', 'Sala Razzmatazz 1', '2026-10-21 18:30:00', 'https://s1.ticketm.net/dam/a/2b6/6e890de7-6a35-4985-a3dc-64a382c252b6_TABLET_LANDSCAPE_16_9.jpg', 'active')
ON CONFLICT (external_id) DO NOTHING;

-- Zones per a cada evento (tots els eventos tindran les mateixes 3 zones)
-- Assumim que els eventos tendrán ID 1-20 (depèn de l'ordre d'inserció)
-- Per seguretat, ho fem amb SELECT del external_id

-- Zones per al primer evento (qualsevol uno d'ells serveix com a exemple)
DO $$
DECLARE
  v_event_id INT;
BEGIN
  SELECT id INTO v_event_id FROM events WHERE external_id = 'Z698xZ2qZ16vAy7kFA' LIMIT 1;
  IF v_event_id IS NOT NULL THEN
    INSERT INTO zones (event_id, zone_key, zone_name, price, color) VALUES
    (v_event_id, 'vip', 'VIP', 120.00, 'rgba(255, 193, 7, 0.8)'),
    (v_event_id, 'platea', 'Platea', 80.00, 'rgba(76, 175, 80, 0.8)'),
    (v_event_id, 'general', 'General', 40.00, 'rgba(33, 150, 243, 0.8)')
    ON CONFLICT DO NOTHING;
  END IF;
END
$$;

-- Per a demostració, clona les zones a tots els eventos
DO $$
DECLARE
  v_event_id INT;
  v_zone_event_id INT;
BEGIN
  SELECT id INTO v_zone_event_id FROM events WHERE external_id = 'Z698xZ2qZ16vAy7kFA' LIMIT 1;
  FOR v_event_id IN SELECT id FROM events WHERE id != v_zone_event_id LOOP
    INSERT INTO zones (event_id, zone_key, zone_name, price, color)
    SELECT v_event_id, zone_key, zone_name, price, color FROM zones WHERE event_id = v_zone_event_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END
$$;

-- Genera 75 seients per cada event (5 files x 15 seients)
-- Distribució de zones:
--   Files A-B -> VIP
--   Files C-D -> Platea
--   Fila E    -> General
DO $$
DECLARE
  v_event_id INT;
  v_vip_zone_id INT;
  v_platea_zone_id INT;
  v_general_zone_id INT;
BEGIN
  FOR v_event_id IN SELECT id FROM events LOOP
    SELECT id INTO v_vip_zone_id FROM zones WHERE event_id = v_event_id AND zone_key = 'vip' LIMIT 1;
    SELECT id INTO v_platea_zone_id FROM zones WHERE event_id = v_event_id AND zone_key = 'platea' LIMIT 1;
    SELECT id INTO v_general_zone_id FROM zones WHERE event_id = v_event_id AND zone_key = 'general' LIMIT 1;

    INSERT INTO seats (event_id, zone_id, row, seat_number, status)
    SELECT
      v_event_id,
      CASE
        WHEN r.row_label IN ('A', 'B') THEN v_vip_zone_id
        WHEN r.row_label IN ('C', 'D') THEN v_platea_zone_id
        ELSE v_general_zone_id
      END AS zone_id,
      r.row_label,
      s.seat_number,
      'AVAILABLE'
    FROM (VALUES ('A'), ('B'), ('C'), ('D'), ('E')) AS r(row_label)
    CROSS JOIN generate_series(1, 15) AS s(seat_number)
    ON CONFLICT (event_id, row, seat_number) DO NOTHING;
  END LOOP;
END
$$;
