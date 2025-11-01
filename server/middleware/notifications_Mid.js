const pushNotificationService = require('../services/pushNotificationService');
const { NOTIFICATION_TYPES, getNotificationContent, getNotificationUrl } = require('../services/notificationTypes');
const notificationBatcher = require('../services/notificationBatcher');

async function subscribe(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { endpoint, keys, browser, deviceInfo } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: endpoint, keys.p256dh, keys.auth'
      });
    }

    const [existing] = await db.query(
      `SELECT id FROM push_subscriptions WHERE endpoint = ?`,
      [endpoint]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE push_subscriptions 
         SET user_id = ?, p256dh = ?, auth = ?, browser = ?, device_info = ?, is_active = 1, updated_at = NOW()
         WHERE endpoint = ?`,
        [userId, keys.p256dh, keys.auth, browser || null, deviceInfo || null, endpoint]
      );

      return res.json({
        success: true,
        message: 'Subscription updated successfully'
      });
    }

    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, browser, device_info)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, endpoint, keys.p256dh, keys.auth, browser || null, deviceInfo || null]
    );

    res.json({
      success: true,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    console.error('notifications.subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function unsubscribe(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    await db.query(
      `UPDATE push_subscriptions SET is_active = 0 WHERE user_id = ? AND endpoint = ?`,
      [userId, endpoint]
    );

    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error) {
    console.error('notifications.unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


function getPublicKey(req, res) {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      return res.status(500).json({
        success: false,
        message: 'VAPID keys not configured'
      });
    }

    res.json({
      success: true,
      publicKey
    });
  } catch (error) {
    console.error('notifications.getPublicKey error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function getPreferences(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [preferences] = await db.query(
      `SELECT preference_type, enabled FROM notification_preferences WHERE user_id = ?`,
      [userId]
    );

    const prefs = {};
    preferences.forEach(p => {
      prefs[p.preference_type] = p.enabled === 1;
    });

    res.json({
      success: true,
      preferences: prefs
    });
  } catch (error) {
    console.error('notifications.getPreferences error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function updatePreferences(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Preferences object is required'
      });
    }

    for (const [type, enabled] of Object.entries(preferences)) {
      await db.query(
        `INSERT INTO notification_preferences (user_id, preference_type, enabled)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE enabled = ?, updated_at = NOW()`,
        [userId, type, enabled ? 1 : 0, enabled ? 1 : 0]
      );
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('notifications.updatePreferences error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function getUnreadCount(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [unreadResult] = await db.query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND read_at IS NULL`,
      [userId]
    );
    const unreadCount = unreadResult[0].total || 0;

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('notifications.getUnreadCount error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function getHistory(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { page = 1, limit = 20, type, unread_only = false } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = `SELECT id, title, body, type, status, read_at, created_at, sent_at, data
                 FROM notifications WHERE user_id = ?`;
    let params = [userId];

    if (type) {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (unread_only === 'true') {
      query += ` AND read_at IS NULL`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [notifications] = await db.query(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`;
    let countParams = [userId];

    if (type) {
      countQuery += ` AND type = ?`;
      countParams.push(type);
    }

    if (unread_only === 'true') {
      countQuery += ` AND read_at IS NULL`;
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    const [unreadResult] = await db.query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND read_at IS NULL`,
      [userId]
    );
    const unreadCount = unreadResult[0].total;

    res.json({
      success: true,
      notifications: notifications.map(n => ({
        ...n,
        read: n.read_at !== null,
        read_at: n.read_at,
        data: n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('notifications.getHistory error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function markAsRead(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { id } = req.params;

    const [notification] = await db.query(
      `SELECT id FROM notifications WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await db.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('notifications.markAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function markAllAsRead(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    await db.query(
      `UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('notifications.markAllAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function deleteReadNotifications(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [result] = await db.query(
      `DELETE FROM notifications WHERE user_id = ? AND read_at IS NOT NULL`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Read notifications deleted',
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('notifications.deleteReadNotifications error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function deleteNotification(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const id = req.params.id;

    const [notification] = await db.query(
      `SELECT id FROM notifications WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const [result] = await db.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('notifications.deleteNotification error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}


async function sendNotification(req, res) {
  try {
    const db = global.db_pool.promise();
    const { userIds, title, body, type, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required'
      });
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title and body are required'
      });
    }

    const notificationType = type || NOTIFICATION_TYPES.ADMIN_NOTIFICATION;
    const url = getNotificationUrl(notificationType, data || {});
    const notificationData = {
      ...data,
      url
    };

    let result;
    
    if (userIds.length > notificationBatcher.BATCH_SIZE) {
      result = await notificationBatcher.sendNotificationBatch(
        db,
        userIds,
        title,
        body,
        notificationType,
        notificationData
      );
    } else {
      const results = [];
      for (const userId of userIds) {
        const sendResult = await pushNotificationService.sendAndSaveNotification(
          db,
          userId,
          title,
          body,
          notificationType,
          notificationData
        );
        results.push({ userId, ...sendResult });
      }
      
      const successful = results.filter(r => r.success).length;
      result = {
        success: successful > 0,
        total: userIds.length,
        successful,
        failed: results.length - successful,
        results
      };
    }

    res.json({
      success: result.success,
      message: 'Notifications sent',
      ...result
    });
  } catch (error) {
    console.error('notifications.sendNotification error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  getPublicKey,
  getPreferences,
  updatePreferences,
  getUnreadCount,
  getHistory,
  markAsRead,
  markAllAsRead,
  deleteReadNotifications,
  deleteNotification,
  sendNotification
};

