# Easy IELTS

Full-stack IELTS mock-test platform.

- **Frontend** — Next.js 14 (App Router) + Tailwind. A pixel-perfect clone of the
  original `ielts-platform-v3-expanded` UI, with all data wired to the backend.
- **Backend** — Node.js + Express + PostgreSQL (raw SQL via `pg`, **no ORM, no Supabase**).
- **Auth** — JWT issued as an httpOnly cookie *and* a Bearer token (the frontend
  uses both, automatically).

```
easy-ielts/
├── frontend/   ← Next.js 14 App Router
└── backend/    ← Express + Postgres API
```

## Prerequisites

- **Node.js** ≥ 18.17 (required by Next.js 14)
- **npm** ≥ 9
- **PostgreSQL** ≥ 13 running locally (or any reachable instance)

Verify with:

```bash
node -v
npm -v
psql --version
```

## 1. Set up the PostgreSQL database

Create an empty database (replace user / password with your local Postgres
credentials):

```bash
psql -U postgres -c "CREATE DATABASE easy_ielts;"
```

If your local Postgres uses your macOS user with no password, that works too — adjust the env vars in the next step accordingly.

## 2. Run the backend

```bash
cd backend
cp .env.example .env       # then edit .env with your DB credentials + JWT secret
npm install
npm run migrate            # creates all tables (raw SQL — see migrations/schema.sql)
npm run seed               # inserts demo admin + student + 5 sample tests
npm run dev                # starts on http://localhost:4000
```

Demo credentials seeded by `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Student | `student@ieltsjournal.com` | `Demo1234!` |
| Admin | `admin@ieltsjournal.com` | `admin1234` |

## 3. Run the frontend

In a second terminal:

```bash
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                        # starts on http://localhost:3000
```

Open <http://localhost:3000> and sign in with one of the demo credentials.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | API port | `4000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS | `http://localhost:3000` |
| `PGHOST` | Postgres host | `localhost` |
| `PGPORT` | Postgres port | `5432` |
| `PGUSER` | Postgres user | `postgres` |
| `PGPASSWORD` | Postgres password | `postgres` |
| `PGDATABASE` | Database name | `easy_ielts` |
| `JWT_SECRET` | Long random secret used to sign JWTs | `change_me…` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `COOKIE_NAME` | Cookie key for the auth token | `eielts_token` |

### Frontend (`frontend/.env.local`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend (no trailing slash) | `http://localhost:4000` |

## API reference

All responses follow the envelope:

```json
{ "success": true, "data": { … }, "message": "…" }
```

Errors (4xx / 5xx) have:

```json
{ "success": false, "message": "…", "errors": [ { "field": "email", "message": "…" } ] }
```

Authentication is required for any endpoint that returns user-specific data.
The frontend's `api` helper sends `credentials: "include"` plus a `Bearer` token
from `localStorage`, so cookies and headers both work.

### Auth

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | `{ email, password, full_name }` | Create a student account. Returns `{ user, role, token }` and sets the `eielts_token` cookie. |
| POST | `/api/auth/login` | `{ email, password }` | Same envelope as register. |
| POST | `/api/auth/logout` | – | Clears the auth cookie. |
| GET | `/api/auth/me` | – | Returns the currently logged-in user. |

Example request:

```bash
curl -i -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@ieltsjournal.com","password":"Demo1234!"}'
```

### Student endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard` | Aggregator: `{ profile, attempts, upcomingSpeaking }`. |
| GET | `/api/tests` | Public list of `published` tests. |
| GET | `/api/tests/:id` | Single test. |
| POST | `/api/attempts` | Start a new attempt: `{ test_id?, track, format, module? }`. |
| GET | `/api/attempts/mine` | All attempts for the current user. |
| GET | `/api/attempts/:id` | Single attempt (must belong to the user, or admin). |
| POST | `/api/submissions` | Submit answers: `{ attempt_id, module, answers, word_count? }`. Marks attempt as `submitted`. |
| GET | `/api/results` | All results published for the current user. |
| GET | `/api/bookings` | Speaking bookings for the current user. |
| POST | `/api/bookings` | Book a speaking slot: `{ scheduled_at, examiner_id?, attempt_id? }`. |

### Admin / examiner endpoints (require role `admin` or `examiner`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard totals + upcoming speaking. |
| GET | `/api/admin/students` | List of student accounts. (admin only) |
| GET | `/api/admin/submissions` | All submissions (most recent first), with student + test metadata. |
| POST | `/api/admin/submissions/:id/review` | Submit a review: `{ band_score, task1_score, task2_score, feedback, criteria, student_id, attempt_id }`. Creates a `results` row and marks the attempt complete. |
| GET | `/api/tests/admin/all` | All tests including drafts (admin only). |
| POST | `/api/tests` | Create test (admin only). |
| PATCH | `/api/tests/:id` | Update test (admin only). |
| DELETE | `/api/tests/:id` | Delete test (admin only). |

### Example: post a writing review

```bash
curl -X POST http://localhost:4000/api/admin/submissions/<submission-id>/review \
  -H "Content-Type: application/json" \
  -b "eielts_token=<admin-jwt-from-login>" \
  -d '{
    "student_id": "<student-uuid>",
    "attempt_id": "<attempt-uuid>",
    "band_score": 7.0,
    "task1_score": 6.5,
    "task2_score": 7.0,
    "feedback": "Strong overall structure...",
    "criteria": {
      "task_achievement": 7.0,
      "coherence_cohesion": 7.0,
      "lexical_resource": 6.5,
      "grammatical_range": 7.5
    }
  }'
```

## Database schema

See `backend/migrations/schema.sql` for the full DDL. Top-level tables:

- `profiles` — users (students, admins, examiners). Stores `password_hash`.
- `tests` — mock-test catalogue.
- `test_attempts` — one row per `(student, test, started_at)` instance.
- `submissions` — written / spoken answers awaiting review.
- `results` — examiner-published band scores + feedback.
- `speaking_bookings` — booked speaking-test slots.
- `examiners` — extra metadata for examiner profiles.

All foreign keys cascade or null appropriately on delete; indexes are added on
the columns the API filters by.

## Production notes

- `JWT_SECRET` must be a long random string in production.
- Set `NODE_ENV=production` so cookies are issued as `secure`.
- Keep `CLIENT_ORIGIN` tight — the API only allows that one origin to send
  credentials.
- Any deploy target running both apps behind one domain can drop CORS entirely
  by reverse-proxying `/api` to the backend.
# easy-ielts
# easy-ielts
