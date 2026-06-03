# Deploying Easy IELTS on Coolify

## Architecture
```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend   │────▶│   Backend   │────▶│  PostgreSQL  │
│  Next.js    │     │  Express    │     │  (managed or │
│  :3000      │     │  :4000      │     │   container) │
└─────────────┘     └─────────────┘     └──────────────┘
```

---

## Option A — Docker Compose (Recommended)

### 1. Push to GitHub
Make sure your repo is pushed to GitHub (private or public).

### 2. Create a new resource in Coolify
- **New Resource → Docker Compose**
- Connect your GitHub repo
- Set **Docker Compose file path**: `docker-compose.yml`

### 3. Set Environment Variables in Coolify dashboard
Copy from `.env.production.example` and fill in real values:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |
| `CLIENT_ORIGIN` | `https://yourdomain.com` |
| `PGPASSWORD` | strong password |
| `JWT_SECRET` | 64-char random hex |
| `CLOUDINARY_CLOUD_NAME` | your cloudinary name |
| `CLOUDINARY_API_KEY` | your cloudinary key |
| `CLOUDINARY_API_SECRET` | your cloudinary secret |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://api.yourdomain.com/api/auth/google/callback` |

### 4. Set up domains in Coolify
- Frontend service → domain: `yourdomain.com`
- Backend service → domain: `api.yourdomain.com`

### 5. Deploy
Click **Deploy**. Coolify will:
1. Build the Docker images
2. Start PostgreSQL
3. Run migrations (`migrate` service exits after running)
4. Start backend + frontend

### 6. Seed demo data (first deploy only)
After deploy, open a terminal in the **backend** container:
```bash
node scripts/seed_demo.js
node scripts/seed_content.js
node scripts/seed_phase1.js
```

---

## Option B — Separate Services (Backend + Frontend separately)

If you prefer to deploy backend and frontend as separate Coolify services:

### Backend
- **New Resource → Dockerfile**
- Root directory: `backend`
- Dockerfile: `backend/Dockerfile`
- Port: `4000`
- Add all env vars from the table above

### Frontend
- **New Resource → Dockerfile**
- Root directory: `frontend`
- Dockerfile: `frontend/Dockerfile`
- Port: `3000`
- Build arg: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`

### Database
- **New Resource → PostgreSQL** (Coolify managed)
- Copy the connection details into backend env vars

---

## Google OAuth — Update Redirect URI
After deploy, go to [Google Cloud Console](https://console.cloud.google.com/) and add:
- **Authorized JavaScript origins**: `https://yourdomain.com`
- **Authorized redirect URIs**: `https://api.yourdomain.com/api/auth/google/callback`

---

## Local Docker Test (before deploying)
```bash
cp .env.production.example .env.production
# Edit .env.production with your values

docker compose --env-file .env.production up --build
```
Then open `http://localhost:3000`
