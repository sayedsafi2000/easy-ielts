/**
 * Provider webhooks. No auth — authenticity is established by signature.
 *
 * Zoom (`POST /api/webhooks/zoom`):
 *   - Verifies the HMAC signature over the RAW request body (req.rawBody, made
 *     available by the express.json({ verify }) hook in server.js).
 *   - Handles the one-time endpoint.url_validation challenge.
 *   - On recording.completed / recording.transcript_completed, attaches the
 *     recording/transcript to the matching booking.
 *   - Idempotent via the webhook_events ledger (UNIQUE provider, event_id).
 */
const crypto = require('crypto');
const { query } = require('../config/db');

const ZOOM_SECRET = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '';

function zoomSignatureValid(req) {
  if (!ZOOM_SECRET) return false;
  const ts = req.headers['x-zm-request-timestamp'];
  const sig = req.headers['x-zm-signature'];
  if (!ts || !sig || !req.rawBody) return false;
  const message = `v0:${ts}:${req.rawBody.toString('utf8')}`;
  const expected = 'v0=' + crypto.createHmac('sha256', ZOOM_SECRET).update(message).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch (_) {
    return false;
  }
}

/** Returns true if this is the first time we've seen the event (else duplicate). */
async function recordEventOnce(provider, eventId, eventType) {
  try {
    await query(
      `INSERT INTO webhook_events (provider, event_id, event_type) VALUES ($1, $2, $3)`,
      [provider, eventId, eventType]
    );
    return true;
  } catch (err) {
    if (err.code === '23505') return false; // duplicate
    throw err;
  }
}

async function zoom(req, res) {
  const body = req.body || {};
  const event = body.event;

  // 1) URL validation challenge (Zoom sends this when you save the endpoint).
  if (event === 'endpoint.url_validation') {
    const plainToken = body.payload?.plainToken;
    const encryptedToken = crypto.createHmac('sha256', ZOOM_SECRET).update(plainToken || '').digest('hex');
    return res.status(200).json({ plainToken, encryptedToken });
  }

  // 2) Authenticity.
  if (!zoomSignatureValid(req)) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  const obj = body.payload?.object || {};
  const meetingId = obj.id != null ? String(obj.id) : null;
  const eventId = `${event}:${obj.uuid || meetingId || ''}:${body.event_ts || ''}`;

  // 3) Idempotency.
  let fresh;
  try {
    fresh = await recordEventOnce('zoom', eventId, event);
  } catch (err) {
    console.error('[webhook:zoom] ledger error:', err.message);
    return res.status(200).json({ ok: true }); // never make Zoom retry-storm
  }
  if (!fresh) return res.status(200).json({ ok: true, duplicate: true });

  try {
    if (event === 'recording.completed' && meetingId) {
      const files = obj.recording_files || [];
      const url = obj.share_url || files.find((f) => f.play_url)?.play_url || files[0]?.download_url || null;
      await query(
        `UPDATE speaking_bookings
            SET recording_url = COALESCE($2, recording_url),
                recording_status = 'available', updated_at = NOW()
          WHERE provider = 'zoom' AND provider_meeting_id = $1`,
        [meetingId, url]
      );
    } else if (event === 'recording.transcript_completed' && meetingId) {
      const files = obj.recording_files || [];
      const transcript = files.find((f) => f.file_type === 'TRANSCRIPT');
      const url = transcript?.download_url || transcript?.play_url || null;
      await query(
        `UPDATE speaking_bookings
            SET transcript_url = COALESCE($2, transcript_url), updated_at = NOW()
          WHERE provider = 'zoom' AND provider_meeting_id = $1`,
        [meetingId, url]
      );
    }
  } catch (err) {
    console.error('[webhook:zoom] handler error:', err.message);
  }

  return res.status(200).json({ ok: true });
}

module.exports = { zoom };
