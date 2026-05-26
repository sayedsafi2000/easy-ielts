/**
 * Easy IELTS API server
 *
 * Express + PostgreSQL (raw SQL via pg). All endpoints follow the envelope:
 *   { success: boolean, data?: any, message?: string, errors?: any[] }
 */
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const cookieParser = require('cookie-parser');

const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const authRoutes        = require('./src/routes/authRoutes');
const dashboardRoutes   = require('./src/routes/dashboardRoutes');
const testRoutes        = require('./src/routes/testRoutes');
const attemptRoutes     = require('./src/routes/attemptRoutes');
const submissionRoutes  = require('./src/routes/submissionRoutes');
const resultRoutes      = require('./src/routes/resultRoutes');
const bookingRoutes     = require('./src/routes/bookingRoutes');
const adminRoutes       = require('./src/routes/adminRoutes');
const contentRoutes     = require('./src/routes/contentRoutes');
const sessionRoutes     = require('./src/routes/sessionRoutes');
const uploadRoutes      = require('./src/routes/uploadRoutes');
const path              = require('path');

const app  = express();
const PORT = Number(process.env.PORT) || 4000;

// ─── Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — allow the configured frontend with credentials.
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser clients (curl, postman) where origin is undefined
      if (!origin) return cb(null, true);
      if (origin === ORIGIN) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// ─── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
});

// ─── Static uploads ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  fallthrough: false,
  maxAge: '1h',
}));

// ─── API routes ─────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/tests',           testRoutes);
app.use('/api/attempts',        attemptRoutes);
app.use('/api/submissions',     submissionRoutes);
app.use('/api/results',         resultRoutes);
app.use('/api/bookings',        bookingRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/test-content',    contentRoutes);
app.use('/api/test-sessions',   sessionRoutes);
app.use('/api/uploads',         uploadRoutes);

// ─── 404 + error handler ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────-
app.listen(PORT, () => {
  console.log(`✅  Easy IELTS API listening on http://localhost:${PORT}`);
  console.log(`    Allowed CORS origin: ${ORIGIN}`);
});
