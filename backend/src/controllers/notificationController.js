/**
 * In-app notifications — list, unread count, mark read.
 */
const notificationModel = require('../models/notificationModel');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

const list = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    notificationModel.listForUser(req.user.id, { limit: 30 }),
    notificationModel.unreadCount(req.user.id),
  ]);
  return res.json({ success: true, data: { items, unread } });
});

const markRead = asyncHandler(async (req, res) => {
  const row = await notificationModel.markRead(req.user.id, req.params.id);
  if (!row) throw httpError(404, 'Notification not found.');
  return res.json({ success: true, data: row });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationModel.markAllRead(req.user.id);
  return res.json({ success: true, message: 'All notifications marked read.' });
});

module.exports = { list, markRead, markAllRead };
