const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth_Mid');
const {
  setNotificationBaseQuery,
  buildNotificationQuery,
  validateNotificationOwnership,
  getNotificationStats,
  executeNotificationQuery
} = require('../middleware/notificationFilter_Mid');

const validateNotificationQuery = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '10', 10)));
  const query = (req.query.query || '').trim();
  const type = (req.query.type || '').trim();
  const onlyUnread = req.query.onlyUnread === '1';
  const audience = (req.query.audience || 'user').trim();

  if (type && !['info', 'warning', 'error', 'success'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid notification type' 
    });
  }

  if (audience && !['user', 'admin'].includes(audience)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid audience type' 
    });
  }

  req.validatedQuery = { page, pageSize, query, type, onlyUnread, audience };
  next();
};

router.get('/',
  verifyToken,
  validateNotificationQuery,
  setNotificationBaseQuery,
  buildNotificationQuery,
  executeNotificationQuery,
  (req, res) => {
    res.json({ 
      success: true, 
      data: req.notificationResults 
    });
  }
);

router.post('/:id/read',
  verifyToken,
  validateNotificationOwnership,
  async (req, res) => {
    try {
      const db = global.db_pool.promise();
      
      const [result] = await db.query(
        `UPDATE notifications 
         SET read_at = IFNULL(read_at, NOW()), 
             updated_at = NOW() 
         WHERE id = ?`,
        [req.notificationId]
      );

      res.json({ 
        success: true, 
        affected: result.affectedRows,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('POST /notifications/:id/read error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to mark notification as read' 
      });
    }
  }
);

router.delete('/:id',
  verifyToken,
  validateNotificationOwnership,
  async (req, res) => {
    try {
      const db = global.db_pool.promise();
      
      const [result] = await db.query(
        `DELETE FROM notifications WHERE id = ?`,
        [req.notificationId]
      );

      res.json({ 
        success: true, 
        affected: result.affectedRows,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('DELETE /notifications/:id error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete notification' 
      });
    }
  }
);

router.post('/read-all',
  verifyToken,
  setNotificationBaseQuery,
  async (req, res) => {
    try {
      const db = global.db_pool.promise();
      
      const whereClause = req.notificationBaseConditions.length > 0 
        ? `WHERE ${req.notificationBaseConditions.join(' AND ')} AND read_at IS NULL`
        : 'WHERE read_at IS NULL';

      const [result] = await db.query(
        `UPDATE notifications 
         SET read_at = NOW(), 
             updated_at = NOW() 
         ${whereClause}`,
        req.notificationBaseParams
      );

      res.json({ 
        success: true, 
        affected: result.affectedRows,
        message: `Marked ${result.affectedRows} notifications as read`
      });
    } catch (error) {
      console.error('POST /notifications/read-all error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to mark all notifications as read' 
      });
    }
  }
);

router.delete('/',
  verifyToken,
  setNotificationBaseQuery,
  async (req, res) => {
    try {
      const db = global.db_pool.promise();
      
      const whereClause = req.notificationBaseConditions.length > 0 
        ? `WHERE ${req.notificationBaseConditions.join(' AND ')}`
        : '';

      const [result] = await db.query(
        `DELETE FROM notifications ${whereClause}`,
        req.notificationBaseParams
      );

      res.json({ 
        success: true, 
        affected: result.affectedRows,
        message: `Deleted ${result.affectedRows} notifications`
      });
    } catch (error) {
      console.error('DELETE /notifications error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clear notifications' 
      });
    }
  }
);

router.get('/stats',
  verifyToken,
  getNotificationStats,
  (req, res) => {
    res.json({
      success: true,
      data: req.notificationStats
    });
  }
);

module.exports = router;