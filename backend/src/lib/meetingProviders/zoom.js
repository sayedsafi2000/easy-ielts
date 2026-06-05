/**
 * Zoom meeting provider — Server-to-Server OAuth (account-level).
 *
 * Requires env:
 *   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET
 * Optional:
 *   ZOOM_USER_ID (host; defaults to "me")
 *
 * When not configured, isConfigured() is false and the provider registry falls
 * back to the `none` provider, so callers never branch on this themselves.
 *
 * Recording: when `recordingEnabled`, the meeting is created with
 * settings.auto_recording = 'cloud'. If Zoom rejects that (account tier without
 * cloud recording), we retry without it and report recording_status 'unavailable'.
 * The actual recording/transcript URLs arrive later via webhook.
 */
const TOKEN_URL = 'https://zoom.us/oauth/token';
const API = 'https://api.zoom.us/v2';

let _token = { value: null, exp: 0 };

function isConfigured() {
  return !!(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET);
}

async function getToken() {
  const now = Date.now();
  if (_token.value && now < _token.exp - 60_000) return _token.value;

  const basic = Buffer
    .from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`)
    .toString('base64');
  const url = `${TOKEN_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(process.env.ZOOM_ACCOUNT_ID)}`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Basic ${basic}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Zoom token ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  _token = { value: json.access_token, exp: now + (json.expires_in || 3600) * 1000 };
  return _token.value;
}

async function createMeetingRequest(body) {
  const token = await getToken();
  const host = process.env.ZOOM_USER_ID || 'me';
  const res = await fetch(`${API}/users/${encodeURIComponent(host)}/meetings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

async function createMeeting({ topic, startISO, durationMin, recordingEnabled }) {
  const base = {
    topic: topic || 'IELTS Speaking Session',
    type: 2, // scheduled
    start_time: new Date(startISO).toISOString(),
    duration: durationMin || 15,
    timezone: 'UTC',
    settings: { join_before_host: true, waiting_room: true },
  };

  let recordingStatus = 'none';
  let res;
  if (recordingEnabled) {
    res = await createMeetingRequest({ ...base, settings: { ...base.settings, auto_recording: 'cloud' } });
    if (res.ok) {
      recordingStatus = 'pending'; // webhook will flip to available
    } else {
      // Retry without cloud recording (likely an account-tier limitation).
      res = await createMeetingRequest(base);
      recordingStatus = 'unavailable';
    }
  } else {
    res = await createMeetingRequest(base);
    recordingStatus = 'unavailable';
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Zoom create ${res.status}: ${body.slice(0, 200)}`);
  }
  const m = await res.json();
  return {
    provider: 'zoom',
    provider_meeting_id: String(m.id),
    join_url: m.join_url || null,
    host_url: m.start_url || null,
    recording_status: recordingStatus,
  };
}

async function deleteMeeting(meetingId) {
  if (!meetingId) return;
  try {
    const token = await getToken();
    await fetch(`${API}/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error('[zoom] deleteMeeting failed:', err.message);
  }
}

module.exports = { name: 'zoom', isConfigured, createMeeting, deleteMeeting };
