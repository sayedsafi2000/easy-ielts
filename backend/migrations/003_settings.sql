-- Platform settings — one row per key-value pair.
CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default values (idempotent).
INSERT INTO platform_settings (key, value) VALUES
  ('platform_name',           'IELTS Journal'),
  ('support_email',           'support@ieltsjournal.com'),
  ('contact_number',          '+880 1234 567890'),
  ('timezone',                'UTC+6 (Dhaka)'),
  ('platform_description',    'IELTS Journal provides full-length mock tests for Academic and General Training.'),
  ('allow_registration',      'true'),
  ('require_email_verification','true'),
  ('show_auto_score',         'true'),
  ('allow_same_day_retake',   'false'),
  ('maintenance_mode',        'false'),
  ('listening_duration',      '40'),
  ('reading_duration',        '60'),
  ('writing_duration',        '60'),
  ('speaking_duration',       '15'),
  ('writing_review_sla',      '48'),
  ('max_pending_per_examiner','10'),
  ('stripe_publishable_key',  ''),
  ('session_timeout',         'false'),
  ('two_factor_auth',         'false')
ON CONFLICT (key) DO NOTHING;
