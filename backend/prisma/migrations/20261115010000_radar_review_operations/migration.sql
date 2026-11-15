BEGIN;

CREATE TABLE radar_review_operations (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kind VARCHAR(10) NOT NULL
    CHECK (kind IN ('cv', 'skill')),
  target_id UUID NOT NULL,
  decision VARCHAR(20) NOT NULL
    CHECK (decision IN ('approved', 'rejected', 'revoked')),
  payload_hash VARCHAR(64) NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX radar_review_operations_admin_created_idx
  ON radar_review_operations (admin_id, created_at DESC);

COMMIT;