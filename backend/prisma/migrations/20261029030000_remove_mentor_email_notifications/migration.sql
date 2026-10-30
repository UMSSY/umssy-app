BEGIN;

DROP TABLE mentor_mail_outbox;
DROP FUNCTION IF EXISTS mentor_mail_kind(TEXT);
DROP FUNCTION IF EXISTS mentor_mail_kind_title(UUID);
DROP FUNCTION IF EXISTS mentor_mail_status(TEXT);
DROP FUNCTION IF EXISTS mentor_mail_status_title(UUID);
DROP TABLE mentor_mail_kinds;
DROP TABLE mentor_mail_statuses;

COMMIT;
