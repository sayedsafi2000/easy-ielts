/**
 * Fallback "no provider" meeting backend.
 *
 * Used when the chosen provider isn't configured (no creds) or when the student
 * picked no real provider. Scheduling still succeeds — the session just has no
 * auto-generated link (an admin/examiner can paste one later) and recording is
 * marked unavailable. This is what makes the whole flow work with zero creds.
 */
module.exports = {
  name: 'none',
  isConfigured() {
    return true;
  },
  async createMeeting() {
    return {
      provider: 'none',
      provider_meeting_id: null,
      join_url: null,
      host_url: null,
      recording_status: 'unavailable',
    };
  },
  async deleteMeeting() {
    /* nothing to delete */
  },
};
