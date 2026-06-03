/**
 * Google OAuth 2.0 — authorization code flow.
 *
 * GET /api/auth/google           → redirect user to Google consent screen
 * GET /api/auth/google/callback  → handle callback, issue JWT, redirect to frontend
 *
 * Flow:
 *   1. User clicks "Continue with Google" in the frontend.
 *   2. Frontend navigates (window.location.href) to /api/auth/google.
 *   3. Backend redirects to accounts.google.com with the OAuth params.
 *   4. User approves → Google redirects to /api/auth/google/callback.
 *   5. Backend exchanges the code for an access token, fetches the user's
 *      profile, creates or finds the profile row, issues a JWT, sets the
 *      httpOnly cookie, and redirects the browser to the frontend dashboard.
 */

const { OAuth2Client } = require('google-auth-library');
const userModel = require('../models/userModel');
const { query }  = require('../config/db');
const jwt        = require('jsonwebtoken');
const { COOKIE_NAME } = require('../middleware/auth');

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL  = process.env.GOOGLE_CALLBACK_URL  || 'http://localhost:4000/api/auth/google/callback';
const FRONTEND_URL  = process.env.CLIENT_ORIGIN        || 'http://localhost:3000';

function getClient() {
  return new OAuth2Client(CLIENT_ID, CLIENT_SECRET, CALLBACK_URL);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/',
  };
}

/**
 * Step 1 — redirect to Google's consent screen.
 */
function googleRedirect(req, res) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    // Google OAuth not configured — redirect back with error param
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
  }
  const client = getClient();
  const url    = client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
  return res.redirect(url);
}

/**
 * Step 2 — handle the redirect back from Google.
 */
async function googleCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_denied`);
  }

  try {
    const client = getClient();

    // Exchange the authorisation code for tokens
    const { tokens } = await client.getToken(String(code));
    client.setCredentials(tokens);

    // Verify the ID token and extract claims
    const ticket = await client.verifyIdToken({
      idToken:  tokens.id_token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('No email returned from Google.');
    }

    const email    = payload.email.toLowerCase();
    const name     = payload.name  ?? email.split('@')[0];
    const googleId = payload.sub;

    // Find or create the user in our database
    let user = await userModel.findByEmail(email);
    if (!user) {
      // New user — create with a random non-usable password hash
      const { rows } = await query(
        `INSERT INTO profiles
           (email, password_hash, full_name, role, plan, email_verified, google_id)
         VALUES ($1, $2, $3, 'student', 'starter', TRUE, $4)
         ON CONFLICT (email) DO UPDATE
           SET email_verified = TRUE,
               google_id = EXCLUDED.google_id,
               updated_at = NOW()
         RETURNING id, email, full_name, role, plan, track, target_band`,
        [email, 'google-oauth-no-password', name, googleId]
      );
      user = rows[0];
    } else {
      // Existing user — ensure email_verified and google_id are set
      await query(
        `UPDATE profiles SET email_verified = TRUE, google_id = $1, updated_at = NOW() WHERE id = $2`,
        [googleId, user.id]
      );
    }

    // Issue our own JWT
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role ?? 'student' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set the httpOnly auth cookie
    res.cookie(COOKIE_NAME, token, cookieOptions());

    // Redirect to the right dashboard
    const destination = (user.role === 'admin' || user.role === 'examiner')
      ? `${FRONTEND_URL}/admin`
      : `${FRONTEND_URL}/dashboard`;

    return res.redirect(`${destination}?google=1`);
  } catch (err) {
    console.error('[Google OAuth] callback error:', err.message);
    return res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
  }
}

module.exports = { googleRedirect, googleCallback };
