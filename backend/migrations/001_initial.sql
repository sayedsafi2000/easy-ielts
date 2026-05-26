-- =============================================================
-- Easy IELTS — Database Schema (raw PostgreSQL, no ORM)
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles (users) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student', 'admin', 'examiner')),
  plan            TEXT NOT NULL DEFAULT 'starter'
                  CHECK (plan IN ('starter', 'pro', 'premium', 'intensive')),
  target_band     NUMERIC(2,1) DEFAULT 7.0,
  country         TEXT DEFAULT 'Bangladesh',
  track           TEXT DEFAULT 'academic'
                  CHECK (track IN ('academic', 'general')),
  email_verified  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON profiles(role);

-- ─── Tests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'academic'
                    CHECK (type IN ('academic', 'general')),
  modules           TEXT[] NOT NULL DEFAULT ARRAY['listening','reading','writing','speaking'],
  difficulty        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration_minutes  INTEGER NOT NULL DEFAULT 165,
  status            TEXT NOT NULL DEFAULT 'published'
                    CHECK (status IN ('draft', 'published', 'archived')),
  notes             TEXT,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_type   ON tests(type);

-- ─── Test attempts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_id       UUID REFERENCES tests(id) ON DELETE SET NULL,
  track         TEXT NOT NULL DEFAULT 'academic'
                CHECK (track IN ('academic', 'general')),
  format        TEXT NOT NULL DEFAULT 'full'
                CHECK (format IN ('full', 'single')),
  module        TEXT
                CHECK (module IN ('listening','reading','writing','speaking') OR module IS NULL),
  status        TEXT NOT NULL DEFAULT 'in_progress'
                CHECK (status IN ('in_progress', 'submitted', 'reviewing', 'completed')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attempts_student   ON test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status    ON test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_started   ON test_attempts(started_at DESC);

-- ─── Submissions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id    UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module        TEXT NOT NULL
                CHECK (module IN ('listening','reading','writing','speaking')),
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  word_count    INTEGER,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'reviewing', 'reviewed')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_attempt ON submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status  ON submissions(status);

-- ─── Results ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id   UUID REFERENCES submissions(id) ON DELETE SET NULL,
  module          TEXT
                  CHECK (module IN ('listening','reading','writing','speaking')),
  band_score      NUMERIC(2,1),
  task1_score     NUMERIC(2,1),
  task2_score     NUMERIC(2,1),
  feedback        TEXT,
  criteria        JSONB DEFAULT '{}'::jsonb,
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_attempt ON results(attempt_id);

-- ─── Speaking Bookings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS speaking_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  examiner_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  attempt_id        UUID REFERENCES test_attempts(id) ON DELETE SET NULL,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 15,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_link      TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_student   ON speaking_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_examiner  ON speaking_bookings(examiner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON speaking_bookings(scheduled_at);

-- ─── Examiners (extra metadata for examiner profiles) ──────
CREATE TABLE IF NOT EXISTS examiners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialization    TEXT[] DEFAULT ARRAY['Writing','Speaking'],
  available_slots   JSONB DEFAULT '[]'::jsonb,
  rating            NUMERIC(3,2) DEFAULT 4.8,
  total_reviews     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
