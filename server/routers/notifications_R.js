const express = require('express');
const router = express.Router();
const notifications_Mid = require('../middleware/notifications_Mid');
const { verifyToken } = require('../middleware/auth_Mid');
const { requirePermission } = require('../middleware/permission_Mid');

router.get('/public-key', notifications_Mid.getPublicKey);

router.post('/subscribe', verifyToken, notifications_Mid.subscribe);
router.post('/unsubscribe', verifyToken, notifications_Mid.unsubscribe);
router.get('/preferences', verifyToken, notifications_Mid.getPreferences);
router.put('/preferences', verifyToken, notifications_Mid.updatePreferences);
router.get('/unread-count', verifyToken, notifications_Mid.getUnreadCount); 
router.get('/history', verifyToken, notifications_Mid.getHistory);
router.put('/:id/read', verifyToken, notifications_Mid.markAsRead);
router.put('/read-all', verifyToken, notifications_Mid.markAllAsRead);
router.delete('/read', verifyToken, notifications_Mid.deleteReadNotifications);
router.delete('/:id', verifyToken, notifications_Mid.deleteNotification);

router.post('/send', verifyToken, requirePermission('manage_notifications'), notifications_Mid.sendNotification);

module.exports = router;

