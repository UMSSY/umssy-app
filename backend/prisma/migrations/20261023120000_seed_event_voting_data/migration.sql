
INSERT INTO event_statuses (id, title, created_at, updated_at)
VALUES
  ('22222222-2222-2222-2222-222222222224', 'Publicado', now(), now()),
  ('22222222-2222-2222-2222-222222222226', 'Votacion', now(), now()),
  ('22222222-2222-2222-2222-222222222227', 'Vencido', now(), now())
ON CONFLICT (title) DO NOTHING;

INSERT INTO event_origins (id, title, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222228', 'Comunidad', now(), now())
ON CONFLICT (title) DO NOTHING;

INSERT INTO registration_statuses (id, title, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222225', 'Confirmada', now(), now())
ON CONFLICT (title) DO NOTHING;
