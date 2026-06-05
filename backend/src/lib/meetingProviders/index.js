/**
 * Meeting provider registry.
 *
 * getProvider('zoom'|'google'|'none') returns the requested provider IF it's
 * configured, otherwise the `none` fallback — so booking code never has to
 * branch on credentials. createMeeting() always resolves; the returned
 * `provider` field tells callers what actually happened.
 */
const none = require('./none');
const zoom = require('./zoom');
const google = require('./google');

const REGISTRY = { none, zoom, google };

async function getProvider(name) {
  const p = REGISTRY[name];
  if (!p) return none;
  try {
    const ok = await p.isConfigured();
    return ok ? p : none;
  } catch (_) {
    return none;
  }
}

/**
 * Create a meeting for a booking using the requested provider, falling back to
 * `none` when that provider isn't configured.
 * @returns {Promise<{provider, provider_meeting_id, join_url, host_url, recording_status}>}
 */
async function createMeeting(requestedProvider, args) {
  const provider = await getProvider(requestedProvider);
  return provider.createMeeting(args);
}

async function deleteMeeting(providerName, meetingId) {
  const provider = await getProvider(providerName);
  return provider.deleteMeeting(meetingId);
}

/** Report which providers currently have working credentials (for admin UI). */
async function statuses() {
  const out = {};
  for (const [name, p] of Object.entries(REGISTRY)) {
    if (name === 'none') continue;
    try { out[name] = await p.isConfigured(); } catch (_) { out[name] = false; }
  }
  return out;
}

module.exports = { getProvider, createMeeting, deleteMeeting, statuses };
