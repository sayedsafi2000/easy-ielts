-- =============================================================
-- 005 — Speaking sessions: booking workflow, meetings, notifications
-- =============================================================
-- Adds the real booking state machine (request -> assign -> accept/propose ->
-- confirm -> scheduled -> completed), video-meeting metadata, recording/transcript
-- columns, an in-app notifications table, a webhook idempotency ledger, and a
-- place to store the encrypted Google "scheduler" refresh token.
--
-- Additive + idempotent, except the status CHECK constraint which must be
-- dropped and recreated. Legacy rows are mapped to the new vocabulary first.

-- ─── Extend speaking_bookings ───────────────────────────────
ALTER TABLE speaking_bookings
  ADD COLUMN IF NOT EXISTS provider            TEXT,            -- 'google' | 'zoom' | 'none'
  ADD COLUMN IF NOT EXISTS provider_meeting_id TEXT,            -- Zoom meeting id / Google event id
  ADD COLUMN IF NOT EXISTS join_url            TEXT,            -- attendee join link
  ADD COLUMN IF NOT EXISTS host_url            TEXT,            -- Zoom start_url; NULL for Meet
  ADD COLUMN IF NOT EXISTS proposed_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposed_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recording_status    TEXT NOT NULL DEFAULT 'none', -- none|pending|available|unavailable|failed
  ADD COLUMN IF NOT EXISTS recording_url       TEXT,
  ADD COLUMN IF NOT EXISTS transcript_url      TEXT,
  ADD COLUMN IF NOT EXISTS transcript_text     TEXT,
  ADD COLUMN IF NOT EXISTS result_id           UUID REFERENCES results(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reminder_sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Preserve any legacy (fake/real) meeting link in the new column.
UPDATE speaking_bookings SET join_url = meeting_link
  WHERE join_url IS NULL AND meeting_link IS NOT NULL;

-- ─── New status state machine ───────────────────────────────
ALTER TABLE speaking_bookings DROP CONSTRAINT IF EXISTS speaking_bookings_status_check;

-- Map legacy statuses to the new vocabulary before re-adding the constraint.
UPDATE speaking_bookings SET status = 'scheduled' WHERE status = 'confirmed';
UPDATE speaking_bookings SET status = 'requested' WHERE status = 'pending';

ALTER TABLE speaking_bookings
  ADD CONSTRAINT speaking_bookings_status_check CHECK (status IN (
    'requested', 'assigned', 'time_proposed', 'scheduled', 'completed', 'cancelled', 'declined'
  ));
ALTER TABLE speaking_bookings ALTER COLUMN status SET DEFAULT 'requested';

ALTER TABLE speaking_bookings DROP CONSTRAINT IF EXISTS speaking_bookings_provider_check;
ALTER TABLE speaking_bookings ADD CONSTRAINT speaking_bookings_provider_check
  CHECK (provider IS NULL OR provider IN ('google', 'zoom', 'none'));

ALTER TABLE speaking_bookings DROP CONSTRAINT IF EXISTS speaking_bookings_recstatus_check;
ALTER TABLE speaking_bookings ADD CONSTRAINT speaking_bookings_recstatus_check
  CHECK (recording_status IN ('none', 'pending', 'available', 'unavailable', 'failed'));

CREATE INDEX IF NOT EXISTS idx_bookings_provider_meeting
  ON speaking_bookings(provider, provider_meeting_id) WHERE provider_meeting_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status ON speaking_bookings(status);

-- ─── Notifications (in-app bell) ────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,             -- 'booking.requested', 'booking.assigned', ...
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,                      -- frontend route to deep-link to
  data       JSONB DEFAULT '{}'::jsonb, -- { booking_id, ... }
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);

-- ─── Webhook idempotency ledger ─────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL,            -- 'zoom' | 'google'
  event_id    TEXT NOT NULL,            -- provider event uuid / message id
  event_type  TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

-- ─── Integration credentials (runtime-acquired secrets) ─────
-- Holds the Google "scheduler" refresh token, app-encrypted. NEVER store this in
-- platform_settings — that table is returned wholesale to the admin browser.
CREATE TABLE IF NOT EXISTS integration_credentials (
  provider   TEXT PRIMARY KEY,          -- 'google_scheduler'
  data       JSONB NOT NULL DEFAULT '{}'::jsonb, -- { refresh_token(enc), email, connected_by, connected_at }
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Operator toggles (safe to expose to admin UI) ──────────
INSERT INTO platform_settings (key, value) VALUES
  ('speaking_provider_default', 'google'),
  ('meeting_recording_enabled', 'true'),
  ('notify_email_enabled',      'true')
ON CONFLICT (key) DO NOTHING;
