-- Additive migration: retain legacy counters and preserve active suspensions.
CREATE TABLE mentor_intake_attempts (
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
CREATE INDEX mentor_intake_attempts_window ON mentor_intake_attempts(user_id, occurred_at) WHERE counted;

CREATE TABLE mentor_participation_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  trigger_attempt_id UUID UNIQUE REFERENCES mentor_intake_attempts(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ(6) NOT NULL,
  ends_at TIMESTAMPTZ(6) NOT NULL,
  CHECK (ends_at = started_at + INTERVAL '72 hours')
);
CREATE INDEX mentor_participation_sanctions_active ON mentor_participation_sanctions(user_id, ends_at);

CREATE TABLE mentor_mail_outbox (
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
CREATE INDEX mentor_mail_outbox_dispatch ON mentor_mail_outbox(status, available_at);

INSERT INTO mentor_mail_outbox(event_key, kind, user_id, recipient, payload)
SELECT 'offer:' || o.id::text, 'OFFER', o.user_id, u.email,
  jsonb_build_object('offerId', o.id, 'expiresAt', o.expires_at)
FROM mentor_slot_offers o JOIN users u ON u.id = o.user_id
WHERE o.status = 'OFFERED' AND o.expires_at > clock_timestamp() AND o.request_id IS NOT NULL
ON CONFLICT(event_key) DO NOTHING;

INSERT INTO mentor_participation_sanctions(user_id, started_at, ends_at)
SELECT user_id, blocked_until - INTERVAL '72 hours', blocked_until
FROM mentor_participation_attempt_limits WHERE blocked_until IS NOT NULL;

INSERT INTO mentor_mail_outbox(event_key, kind, user_id, recipient, payload)
SELECT 'sanction:' || s.id::text, 'SANCTION', s.user_id, u.email,
  jsonb_build_object('sanctionEndsAt', s.ends_at)
FROM mentor_participation_sanctions s JOIN users u ON u.id = s.user_id
WHERE s.ends_at > clock_timestamp()
ON CONFLICT(event_key) DO NOTHING;

-- Legacy storage has no individual timestamps. Preserve known recent counts at
-- their recorded window start; new requests always record their actual instant.
INSERT INTO mentor_intake_attempts(user_id, operation, idempotency_key, payload_hash, occurred_at, response_status, response_data)
SELECT l.user_id, 'LEGACY', gen_random_uuid(), 'legacy', l.window_started_at, 409, '{"legacy":true}'::jsonb
FROM mentor_participation_attempt_limits l CROSS JOIN LATERAL generate_series(1, LEAST(l.attempt_count, 5)) n
WHERE l.window_started_at > clock_timestamp() - INTERVAL '24 hours';
