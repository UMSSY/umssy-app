-- Catálogos y auditoría HU7. Conserva IDs, fechas, historial y eventos existentes.
BEGIN;

CREATE TABLE mentor_request_statuses (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_request_statuses (id, title) VALUES ('07070000-0000-4000-8001-000000000001', 'PENDING'),
('07070000-0000-4000-8001-000000000002', 'OFFERED'),
('07070000-0000-4000-8001-000000000003', 'ACTIVE'),
('07070000-0000-4000-8001-000000000004', 'CANCELLED'),
('07070000-0000-4000-8001-000000000005', 'EXPIRED'),
('07070000-0000-4000-8001-000000000006', 'ENDED');

CREATE FUNCTION mentor_request_status(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_request_statuses WHERE title = value $$;
CREATE FUNCTION mentor_request_status_title(value UUID) RETURNS TEXT LANGUAGE SQL STABLE STRICT AS
  $$ SELECT title::text FROM mentor_request_statuses WHERE id = value $$;

ALTER TABLE mentor_participation_requests ADD COLUMN status_id UUID;
UPDATE mentor_participation_requests t SET status_id = c.id FROM mentor_request_statuses c WHERE t.status = c.title;
ALTER TABLE mentor_participation_requests ALTER COLUMN status_id SET NOT NULL;
ALTER TABLE mentor_participation_requests ADD CONSTRAINT mentor_participation_requests_status_id_fkey FOREIGN KEY (status_id) REFERENCES mentor_request_statuses(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE mentor_participation_requests DROP COLUMN status;
CREATE INDEX mentor_participation_requests_status_id_idx ON mentor_participation_requests(status_id);

ALTER TABLE mentor_participation_requests ALTER COLUMN status_id SET DEFAULT '07070000-0000-4000-8001-000000000001'::uuid;

CREATE TABLE mentor_offer_statuses (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_offer_statuses (id, title) VALUES ('07070000-0000-4000-8002-000000000001', 'OFFERED'),
('07070000-0000-4000-8002-000000000002', 'CONFIRMED'),
('07070000-0000-4000-8002-000000000003', 'EXPIRED');

CREATE FUNCTION mentor_offer_status(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_offer_statuses WHERE title = value $$;
CREATE FUNCTION mentor_offer_status_title(value UUID) RETURNS TEXT LANGUAGE SQL STABLE STRICT AS
  $$ SELECT title::text FROM mentor_offer_statuses WHERE id = value $$;

ALTER TABLE mentor_slot_offers ADD COLUMN status_id UUID;
UPDATE mentor_slot_offers t SET status_id = c.id FROM mentor_offer_statuses c WHERE t.status = c.title;
ALTER TABLE mentor_slot_offers ALTER COLUMN status_id SET NOT NULL;
ALTER TABLE mentor_slot_offers ADD CONSTRAINT mentor_slot_offers_status_id_fkey FOREIGN KEY (status_id) REFERENCES mentor_offer_statuses(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE mentor_slot_offers DROP COLUMN status;
CREATE INDEX mentor_slot_offers_status_id_idx ON mentor_slot_offers(status_id);

ALTER TABLE mentor_slot_offers ALTER COLUMN status_id SET DEFAULT '07070000-0000-4000-8002-000000000001'::uuid;

CREATE TABLE mentor_mail_statuses (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_mail_statuses (id, title) VALUES ('07070000-0000-4000-8003-000000000001', 'PENDING'),
('07070000-0000-4000-8003-000000000002', 'SENDING'),
('07070000-0000-4000-8003-000000000003', 'SENT'),
('07070000-0000-4000-8003-000000000004', 'UNCERTAIN'),
('07070000-0000-4000-8003-000000000005', 'SUPERSEDED');

CREATE FUNCTION mentor_mail_status(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_mail_statuses WHERE title = value $$;
CREATE FUNCTION mentor_mail_status_title(value UUID) RETURNS TEXT LANGUAGE SQL STABLE STRICT AS
  $$ SELECT title::text FROM mentor_mail_statuses WHERE id = value $$;

ALTER TABLE mentor_mail_outbox ADD COLUMN status_id UUID;
UPDATE mentor_mail_outbox t SET status_id = c.id FROM mentor_mail_statuses c WHERE t.status = c.title;
ALTER TABLE mentor_mail_outbox ALTER COLUMN status_id SET NOT NULL;
ALTER TABLE mentor_mail_outbox ADD CONSTRAINT mentor_mail_outbox_status_id_fkey FOREIGN KEY (status_id) REFERENCES mentor_mail_statuses(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE mentor_mail_outbox DROP COLUMN status;
CREATE INDEX mentor_mail_outbox_status_id_idx ON mentor_mail_outbox(status_id);

ALTER TABLE mentor_mail_outbox ALTER COLUMN status_id SET DEFAULT '07070000-0000-4000-8003-000000000001'::uuid;

CREATE TABLE mentor_intake_operations (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_intake_operations (id, title) VALUES ('07070000-0000-4000-8004-000000000001', 'ACTIVATE'),
('07070000-0000-4000-8004-000000000002', 'REQUEST'),
('07070000-0000-4000-8004-000000000003', 'LEGACY');

CREATE FUNCTION mentor_intake_operation(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_intake_operations WHERE title = value $$;
CREATE FUNCTION mentor_intake_operation_title(value UUID) RETURNS TEXT LANGUAGE SQL STABLE STRICT AS
  $$ SELECT title::text FROM mentor_intake_operations WHERE id = value $$;

ALTER TABLE mentor_intake_attempts ADD COLUMN operation_id UUID;
UPDATE mentor_intake_attempts t SET operation_id = c.id FROM mentor_intake_operations c WHERE t.operation = c.title;
ALTER TABLE mentor_intake_attempts ALTER COLUMN operation_id SET NOT NULL;
ALTER TABLE mentor_intake_attempts ADD CONSTRAINT mentor_intake_attempts_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES mentor_intake_operations(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE mentor_intake_attempts DROP COLUMN operation;
CREATE INDEX mentor_intake_attempts_operation_id_idx ON mentor_intake_attempts(operation_id);

CREATE TABLE mentor_mail_kinds (
  id UUID PRIMARY KEY,
  title VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO mentor_mail_kinds (id, title) VALUES ('07070000-0000-4000-8005-000000000001', 'OFFER'),
('07070000-0000-4000-8005-000000000002', 'SANCTION');

CREATE FUNCTION mentor_mail_kind(value TEXT) RETURNS UUID LANGUAGE SQL STABLE STRICT AS
  $$ SELECT id FROM mentor_mail_kinds WHERE title = value $$;
CREATE FUNCTION mentor_mail_kind_title(value UUID) RETURNS TEXT LANGUAGE SQL STABLE STRICT AS
  $$ SELECT title::text FROM mentor_mail_kinds WHERE id = value $$;

ALTER TABLE mentor_mail_outbox ADD COLUMN kind_id UUID;
UPDATE mentor_mail_outbox t SET kind_id = c.id FROM mentor_mail_kinds c WHERE t.kind = c.title;
ALTER TABLE mentor_mail_outbox ALTER COLUMN kind_id SET NOT NULL;
ALTER TABLE mentor_mail_outbox ADD CONSTRAINT mentor_mail_outbox_kind_id_fkey FOREIGN KEY (kind_id) REFERENCES mentor_mail_kinds(id) ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE mentor_mail_outbox DROP COLUMN kind;
CREATE INDEX mentor_mail_outbox_kind_id_idx ON mentor_mail_outbox(kind_id);

CREATE INDEX mentor_participation_requests_status_queued_at_id_idx ON mentor_participation_requests(status_id, queued_at, id);

CREATE UNIQUE INDEX mentor_participation_requests_one_open_per_user ON mentor_participation_requests(user_id) WHERE status_id IN ('07070000-0000-4000-8001-000000000001'::uuid, '07070000-0000-4000-8001-000000000002'::uuid);

CREATE INDEX mentor_slot_offers_status_expires_at_idx ON mentor_slot_offers(status_id, expires_at);

CREATE UNIQUE INDEX mentor_slot_offers_one_offer_per_user ON mentor_slot_offers(user_id) WHERE status_id = '07070000-0000-4000-8002-000000000001'::uuid;

CREATE INDEX mentor_mail_outbox_dispatch ON mentor_mail_outbox(status_id, available_at);

ALTER TABLE mentor_intake_attempts ADD CONSTRAINT mentor_intake_attempts_identity UNIQUE(user_id, operation_id, idempotency_key);

ALTER TABLE mentor_participation_requests ADD COLUMN updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE mentor_participation_requests SET updated_at = queued_at;

CREATE INDEX mentor_participation_requests_user_id_idx ON mentor_participation_requests(user_id);

ALTER TABLE mentor_slot_offers ADD COLUMN created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE mentor_slot_offers SET created_at = offered_at;

ALTER TABLE mentor_slot_offers ADD COLUMN updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE mentor_slot_offers SET updated_at = offered_at;

CREATE INDEX mentor_slot_offers_user_id_idx ON mentor_slot_offers(user_id);

ALTER TABLE mentor_mail_outbox ADD COLUMN updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE mentor_mail_outbox ALTER COLUMN id DROP DEFAULT;

CREATE INDEX mentor_mail_outbox_user_id_idx ON mentor_mail_outbox(user_id);

ALTER TABLE mentor_intake_attempts ADD COLUMN created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE mentor_intake_attempts SET created_at = occurred_at;

ALTER TABLE mentor_intake_attempts ADD COLUMN updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE mentor_intake_attempts SET updated_at = occurred_at;

ALTER TABLE mentor_intake_attempts ALTER COLUMN id DROP DEFAULT;

CREATE INDEX mentor_intake_attempts_user_id_idx ON mentor_intake_attempts(user_id);

ALTER TABLE mentor_participation_sanctions ADD COLUMN created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE mentor_participation_sanctions SET created_at = started_at;

ALTER TABLE mentor_participation_sanctions ADD COLUMN updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE mentor_participation_sanctions SET updated_at = started_at;

ALTER TABLE mentor_participation_sanctions ALTER COLUMN id DROP DEFAULT;

CREATE INDEX mentor_participation_sanctions_user_id_idx ON mentor_participation_sanctions(user_id);

ALTER TABLE mentor_participation_attempt_limits ADD COLUMN created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE mentor_participation_attempt_limits ADD COLUMN updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX mentor_participation_attempt_limits_user_id_idx ON mentor_participation_attempt_limits(user_id);

CREATE FUNCTION touch_mentor_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = clock_timestamp(); RETURN NEW; END $$;

CREATE TRIGGER mentor_participation_requests_touch_updated_at BEFORE UPDATE ON mentor_participation_requests FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_slot_offers_touch_updated_at BEFORE UPDATE ON mentor_slot_offers FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_mail_outbox_touch_updated_at BEFORE UPDATE ON mentor_mail_outbox FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_intake_attempts_touch_updated_at BEFORE UPDATE ON mentor_intake_attempts FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_participation_sanctions_touch_updated_at BEFORE UPDATE ON mentor_participation_sanctions FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_participation_attempt_limits_touch_updated_at BEFORE UPDATE ON mentor_participation_attempt_limits FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_request_statuses_touch_updated_at BEFORE UPDATE ON mentor_request_statuses FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_offer_statuses_touch_updated_at BEFORE UPDATE ON mentor_offer_statuses FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_mail_statuses_touch_updated_at BEFORE UPDATE ON mentor_mail_statuses FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_intake_operations_touch_updated_at BEFORE UPDATE ON mentor_intake_operations FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

CREATE TRIGGER mentor_mail_kinds_touch_updated_at BEFORE UPDATE ON mentor_mail_kinds FOR EACH ROW EXECUTE FUNCTION touch_mentor_updated_at();

ALTER TABLE mentor_mail_outbox ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE mentor_participation_sanctions DROP CONSTRAINT mentor_participation_sanctions_trigger_attempt_id_fkey;
ALTER TABLE mentor_participation_sanctions ADD CONSTRAINT mentor_participation_sanctions_trigger_attempt_id_fkey
  FOREIGN KEY (trigger_attempt_id) REFERENCES mentor_intake_attempts(id) ON DELETE SET NULL ON UPDATE NO ACTION;
COMMIT;
