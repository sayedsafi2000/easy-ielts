/**
 * Google Meet provider — creates a Google Calendar event with conferenceData,
 * which auto-generates a Meet link.
 *
 * Auth: a single stored "scheduler" Google account refresh token (obtained via
 * the one-time admin connect flow in googleAuthController). Requires env
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET and a stored google_scheduler
 * credential. When either is missing, isConfigured() is false and the registry
 * falls back to `none`.
 *
 * Recording/transcript: Meet recording needs Google Workspace + the Drive/Meet
 * API, so recording_status is reported 'unavailable' here. Columns are ready for
 * a future Workspace integration; no Google webhook in this version.
 */
const { google } = require('googleapis');
const integrationModel = require('../../models/integrationModel');

const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/auth/google/callback';

async function isConfigured() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return false;
  return integrationModel.hasCredential('google_scheduler');
}

async function getCalendarClient() {
  const cred = await integrationModel.getCredential('google_scheduler');
  if (!cred || !cred.refresh_token) throw new Error('Google scheduler not connected.');
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK_URL
  );
  oauth2.setCredentials({ refresh_token: cred.refresh_token });
  return google.calendar({ version: 'v3', auth: oauth2 });
}

async function createMeeting({ topic, startISO, durationMin, requestId }) {
  const calendar = await getCalendarClient();
  const start = new Date(startISO);
  const end = new Date(start.getTime() + (durationMin || 15) * 60_000);

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary: topic || 'IELTS Speaking Session',
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: end.toISOString(), timeZone: 'UTC' },
      conferenceData: {
        createRequest: {
          requestId: requestId || `eielts-${start.getTime()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const entry = (data.conferenceData?.entryPoints || []).find((e) => e.entryPointType === 'video');
  return {
    provider: 'google',
    provider_meeting_id: data.id || null,
    join_url: entry?.uri || data.hangoutLink || null,
    host_url: null,
    recording_status: 'unavailable',
  };
}

async function deleteMeeting(eventId) {
  if (!eventId) return;
  try {
    const calendar = await getCalendarClient();
    await calendar.events.delete({ calendarId: 'primary', eventId });
  } catch (err) {
    console.error('[google] deleteMeeting failed:', err.message);
  }
}

module.exports = { name: 'google', isConfigured, createMeeting, deleteMeeting };
