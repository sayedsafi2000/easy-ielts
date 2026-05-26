-- =============================================================
-- Phase 1 — Test content + sessions + per-question answers
-- =============================================================

-- ─── Listening: 4 sections × 10 questions each ──────────────
CREATE TABLE IF NOT EXISTS listening_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  section_number  INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 4),
  title           TEXT,
  context         TEXT,
  audio_url       TEXT,
  audio_duration  TEXT,
  question_range  TEXT,            -- e.g. "1–10"
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(test_id, section_number)
);
CREATE INDEX IF NOT EXISTS idx_listen_sections_test ON listening_sections(test_id);

-- Question groups inside a listening section (e.g. "Questions 1–5: MCQ")
CREATE TABLE IF NOT EXISTS listening_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      UUID NOT NULL REFERENCES listening_sections(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,                       -- "Questions 1–5"
  instruction     TEXT NOT NULL,
  type            TEXT NOT NULL
                  CHECK (type IN ('mcq','form','matching','tfng','short')),
  form_title      TEXT,                                -- only used when type='form'
  match_options   JSONB DEFAULT '[]'::jsonb,            -- only used when type='matching'
  order_index     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_listen_groups_section ON listening_groups(section_id);

-- Questions inside a group
CREATE TABLE IF NOT EXISTS listening_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES listening_groups(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,                    -- 1..40 globally per test
  prompt          TEXT,                                -- the question text or blank prefix
  prefix          TEXT,                                -- "Company name:" for fill-in
  suffix          TEXT,                                -- "people" trailing text
  options         JSONB DEFAULT '[]'::jsonb,           -- ["A  …", "B  …", "C  …"]
  correct_answer  TEXT NOT NULL,                       -- canonical answer (pipe-separated alternates)
  points          INTEGER NOT NULL DEFAULT 1,
  order_index     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_listen_q_group ON listening_questions(group_id);

-- ─── Reading: 3 passages × ~13 questions each ───────────────
CREATE TABLE IF NOT EXISTS reading_passages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  passage_number  INTEGER NOT NULL CHECK (passage_number BETWEEN 1 AND 3),
  title           TEXT NOT NULL,
  body_text       TEXT NOT NULL,
  question_range  TEXT,                                -- e.g. "1–13"
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(test_id, passage_number)
);
CREATE INDEX IF NOT EXISTS idx_read_passages_test ON reading_passages(test_id);

CREATE TABLE IF NOT EXISTS reading_groups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id      UUID NOT NULL REFERENCES reading_passages(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  instruction     TEXT NOT NULL,
  type            TEXT NOT NULL
                  CHECK (type IN ('mcq','tfng','fill','matching','short')),
  options         JSONB DEFAULT '[]'::jsonb,           -- TFNG options ["TRUE","FALSE","NOT GIVEN"] etc.
  order_index     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_read_groups_passage ON reading_groups(passage_id);

CREATE TABLE IF NOT EXISTS reading_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  text            TEXT,                                -- main question text
  pre             TEXT,                                -- fill-in prefix
  suf             TEXT,                                -- fill-in suffix
  options         JSONB DEFAULT '[]'::jsonb,           -- MCQ options
  correct_answer  TEXT NOT NULL,
  points          INTEGER NOT NULL DEFAULT 1,
  order_index     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_read_q_group ON reading_questions(group_id);

-- ─── Writing: 2 tasks ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS writing_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  task_number     INTEGER NOT NULL CHECK (task_number IN (1,2)),
  heading         TEXT NOT NULL,                       -- "WRITING TASK 1"
  instruction     TEXT NOT NULL,                       -- "You should spend about 20 minutes…"
  prompt          TEXT NOT NULL,
  note            TEXT,                                -- "Write at least 150 words."
  min_words       INTEGER NOT NULL DEFAULT 150,
  time_minutes    INTEGER NOT NULL DEFAULT 20,
  chart_image_url TEXT,
  has_chart       BOOLEAN NOT NULL DEFAULT FALSE,
  chart_type      TEXT,                                -- 'line', 'bar', etc.
  model_answer    TEXT,
  marking_notes   TEXT,
  UNIQUE(test_id, task_number)
);
CREATE INDEX IF NOT EXISTS idx_write_tasks_test ON writing_tasks(test_id);

-- ─── Speaking: 3 parts × N sample questions ────────────────
CREATE TABLE IF NOT EXISTS speaking_parts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  part_number     INTEGER NOT NULL CHECK (part_number IN (1,2,3)),
  title           TEXT NOT NULL,
  duration        TEXT,                                -- "4–5 minutes"
  description     TEXT,
  prep_time_seconds INTEGER NOT NULL DEFAULT 0,
  questions       JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of strings
  UNIQUE(test_id, part_number)
);
CREATE INDEX IF NOT EXISTS idx_speak_parts_test ON speaking_parts(test_id);

-- ─── Test sessions (one row per attempt × module) ───────────
CREATE TABLE IF NOT EXISTS test_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  module            TEXT NOT NULL CHECK (module IN ('listening','reading','writing','speaking')),
  duration_seconds  INTEGER NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  submitted_at      TIMESTAMPTZ,
  last_saved_at     TIMESTAMPTZ,
  UNIQUE(attempt_id, module)
);
CREATE INDEX IF NOT EXISTS idx_sessions_attempt ON test_sessions(attempt_id);

-- ─── Per-question answers (Listening + Reading) ─────────────
-- Writing answers stay in submissions.answers (jsonb).
CREATE TABLE IF NOT EXISTS attempt_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  module          TEXT NOT NULL CHECK (module IN ('listening','reading')),
  question_number INTEGER NOT NULL,                    -- 1..40 within the module
  answer_value    TEXT,
  is_correct      BOOLEAN,
  flagged         BOOLEAN NOT NULL DEFAULT FALSE,
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id, module, question_number)
);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_module ON attempt_answers(attempt_id, module);
