-- Add google_id column for OAuth users (nullable — email/password users don't have one).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id) WHERE google_id IS NOT NULL;
