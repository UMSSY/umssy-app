-- Additive repair for develop and databases upgraded by the reverted PR #1717.
-- No existing column/table/catalog is removed. Stop old writers during rollout.
BEGIN;
ALTER TABLE mentor_participation_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE mentor_slot_offers ADD COLUMN IF NOT EXISTS status VARCHAR(20);
DO $$ BEGIN
  IF to_regclass('mentor_request_statuses') IS NOT NULL THEN
    UPDATE mentor_participation_requests r SET status = c.title FROM mentor_request_statuses c
      WHERE r.status_id = c.id AND r.status IS NULL;
    UPDATE mentor_slot_offers o SET status = c.title FROM mentor_offer_statuses c
      WHERE o.status_id = c.id AND o.status IS NULL;
  END IF;
END $$;
ALTER TABLE mentor_participation_requests ALTER COLUMN status SET NOT NULL;
ALTER TABLE mentor_slot_offers ALTER COLUMN status SET NOT NULL;
-- Additive migration: retain legacy counters and preserve active suspensions.
CREATE TABLE IF NOT EXISTS mentor_intake_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('ACTIVATE', 'REQUEST', 'LEGACY')),
  idempotency_key UUID NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  occurred_at TIMESTAMPTZ(6) NOT NULL DEFAULT clock_timestamp(),
  counted BOOLEAN NOT NULL DEFAULT true,
  response_status INTEGER NOT NULL CHECK (response_status BETWEEN 200 AND 499),
  response_data JSONB NOT NULL,
  CONSTRAINT mentor_intake_attempts_identity UNIQUE (user_id, operation, idempotency_key)
);
CREATE INDEX IF NOT EXISTS mentor_intake_attempts_window ON mentor_intake_attempts(user_id, occurred_at) WHERE counted;

CREATE TABLE IF NOT EXISTS mentor_participation_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  trigger_attempt_id UUID UNIQUE REFERENCES mentor_intake_attempts(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ(6) NOT NULL,
  ends_at TIMESTAMPTZ(6) NOT NULL,
  CHECK (ends_at = started_at + INTERVAL '72 hours')
);
CREATE INDEX IF NOT EXISTS mentor_participation_sanctions_active ON mentor_participation_sanctions(user_id, ends_at);

CREATE TABLE IF NOT EXISTS mentor_mail_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key VARCHAR(100) NOT NULL UNIQUE,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('OFFER', 'SANCTION')),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recipient VARCHAR(150) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'UNCERTAIN', 'SUPERSEDED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ(6) NOT NULL DEFAULT clock_timestamp(),
  claimed_at TIMESTAMPTZ(6),
  sent_at TIMESTAMPTZ(6),
  last_error VARCHAR(100),
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT clock_timestamp()
);



ALTER TABLE mentor_intake_attempts ADD COLUMN IF NOT EXISTS operation VARCHAR(20);
ALTER TABLE mentor_mail_outbox ADD COLUMN IF NOT EXISTS kind VARCHAR(20);
ALTER TABLE mentor_mail_outbox ADD COLUMN IF NOT EXISTS status VARCHAR(20);
DO $$ BEGIN
  IF to_regclass('mentor_intake_operations') IS NOT NULL THEN
    UPDATE mentor_intake_attempts a SET operation = c.title FROM mentor_intake_operations c
      WHERE a.operation_id = c.id AND a.operation IS NULL;
    UPDATE mentor_mail_outbox o SET kind = c.title FROM mentor_mail_kinds c
      WHERE o.kind_id = c.id AND o.kind IS NULL;
    UPDATE mentor_mail_outbox o SET status = c.title FROM mentor_mail_statuses c
      WHERE o.status_id = c.id AND o.status IS NULL;
  END IF;
END $$;
ALTER TABLE mentor_intake_attempts ALTER COLUMN operation SET NOT NULL;
ALTER TABLE mentor_mail_outbox ALTER COLUMN kind SET NOT NULL;
ALTER TABLE mentor_mail_outbox ALTER COLUMN status SET NOT NULL;

-- A bridge keeps catalog writers and develop's text contract consistent. On a
-- catalog database INSERT derives either representation from the one supplied.
CREATE FUNCTION mentor_sync_legacy_catalog() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE doc JSONB; olddoc JSONB; label TEXT; catalog_id UUID;
BEGIN
  doc := to_jsonb(NEW);
  IF TG_OP = 'UPDATE' THEN olddoc := to_jsonb(OLD); END IF;
  IF (TG_OP = 'INSERT' AND doc->>TG_ARGV[0] IS NOT NULL)
    OR (TG_OP = 'UPDATE' AND doc->TG_ARGV[0] IS DISTINCT FROM olddoc->TG_ARGV[0]) THEN
    label := doc->>TG_ARGV[0];
    EXECUTE format('SELECT id FROM %I WHERE title = $1', TG_ARGV[2]) INTO catalog_id USING label;
    IF catalog_id IS NULL THEN RAISE EXCEPTION 'Unknown mentor catalog value: %', label USING ERRCODE = '23514'; END IF;
    doc := jsonb_set(doc, ARRAY[TG_ARGV[1]], to_jsonb(catalog_id));
  ELSE
    catalog_id := (doc->>TG_ARGV[1])::uuid;
    EXECUTE format('SELECT title::text FROM %I WHERE id = $1', TG_ARGV[2]) INTO label USING catalog_id;
    IF label IS NULL THEN RAISE EXCEPTION 'Unknown mentor catalog id: %', catalog_id USING ERRCODE = '23514'; END IF;
    doc := jsonb_set(doc, ARRAY[TG_ARGV[0]], to_jsonb(label));
  END IF;
  NEW := jsonb_populate_record(NEW, doc);
  RETURN NEW;
END $$;
DO $$
DECLARE pair TEXT[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY ARRAY[
    ['mentor_participation_requests','status','status_id','mentor_request_statuses','PENDING'],
    ['mentor_slot_offers','status','status_id','mentor_offer_statuses','OFFERED'],
    ['mentor_intake_attempts','operation','operation_id','mentor_intake_operations',''],
    ['mentor_mail_outbox','status','status_id','mentor_mail_statuses','PENDING'],
    ['mentor_mail_outbox','kind','kind_id','mentor_mail_kinds','']
  ] LOOP
    IF to_regclass(pair[4]) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', pair[1], pair[2]);
      EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION mentor_sync_legacy_catalog(%L,%L,%L)',
        pair[1] || '_' || pair[2] || '_compat', pair[1], pair[2], pair[3], pair[4]);
    ELSIF pair[5] <> '' THEN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET DEFAULT %L', pair[1], pair[2], pair[5]);
    END IF;
  END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS mentor_intake_attempts_legacy_identity
  ON mentor_intake_attempts(user_id, operation, idempotency_key);
CREATE INDEX IF NOT EXISTS mentor_mail_outbox_legacy_dispatch ON mentor_mail_outbox(status, available_at);
CREATE INDEX IF NOT EXISTS mentor_requests_legacy_fifo ON mentor_participation_requests(status, queued_at, id);
CREATE UNIQUE INDEX IF NOT EXISTS mentor_requests_legacy_open ON mentor_participation_requests(user_id) WHERE status IN ('PENDING', 'OFFERED');
CREATE UNIQUE INDEX IF NOT EXISTS mentor_offers_legacy_open ON mentor_slot_offers(user_id) WHERE status = 'OFFERED';

INSERT INTO mentor_participation_sanctions(id, user_id, started_at, ends_at)
SELECT gen_random_uuid(), l.user_id, l.blocked_until - INTERVAL '72 hours', l.blocked_until
FROM mentor_participation_attempt_limits l WHERE l.blocked_until IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM mentor_participation_sanctions s WHERE s.user_id = l.user_id AND s.ends_at = l.blocked_until);

INSERT INTO mentor_intake_attempts(id, user_id, operation, idempotency_key, payload_hash, occurred_at, response_status, response_data)
SELECT gen_random_uuid(), l.user_id, 'LEGACY', gen_random_uuid(), 'legacy', l.window_started_at, 409, '{"legacy":true}'::jsonb
FROM mentor_participation_attempt_limits l CROSS JOIN LATERAL generate_series(1, LEAST(l.attempt_count, 5)) n
WHERE l.window_started_at > clock_timestamp() - INTERVAL '24 hours'
AND NOT EXISTS (SELECT 1 FROM mentor_intake_attempts a WHERE a.user_id = l.user_id);

-- Persist notifications as domain events only. No HU7 SMTP dispatcher is enabled.
INSERT INTO mentor_mail_outbox(id, event_key, kind, user_id, recipient, payload)
SELECT gen_random_uuid(), 'offer:' || o.id::text, 'OFFER', o.user_id, u.email,
  jsonb_build_object('offerId', o.id, 'expiresAt', o.expires_at)
FROM mentor_slot_offers o JOIN users u ON u.id = o.user_id
WHERE o.status = 'OFFERED' AND o.expires_at > clock_timestamp() AND o.request_id IS NOT NULL
ON CONFLICT(event_key) DO NOTHING;
INSERT INTO mentor_mail_outbox(id, event_key, kind, user_id, recipient, payload)
SELECT gen_random_uuid(), 'sanction:' || s.id::text, 'SANCTION', s.user_id, u.email,
  jsonb_build_object('sanctionEndsAt', s.ends_at)
FROM mentor_participation_sanctions s JOIN users u ON u.id = s.user_id
WHERE s.ends_at > clock_timestamp() ON CONFLICT(event_key) DO NOTHING;
COMMIT;
