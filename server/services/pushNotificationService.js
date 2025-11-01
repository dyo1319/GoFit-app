const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
let vapidContactEmail = process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@gofit.com';

if (vapidContactEmail && !vapidContactEmail.startsWith('mailto:')) {
  vapidContactEmail = 'mailto:' + vapidContactEmail;
}

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidContactEmail, vapidPublicKey, vapidPrivateKey);
}


async function sendPushNotification(subscription, payload) {
  try {
    const notificationPayload = JSON.stringify(payload);
    const result = await webpush.sendNotification(subscription, notificationPayload);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, expired: true, error: error.message };
    }
    
    return { success: false, expired: false, error: error.message };
  }
}


async function sendToUser(db, userId, payload) {
  try {
    const [subscriptions] = await db.query(
      `SELECT id, endpoint, p256dh, auth FROM push_subscriptions 
       WHERE user_id = ? AND is_active = 1`,
      [userId]
    );

    if (subscriptions.length === 0) {
      return { success: false, message: 'No active subscriptions found for user' };
    }

    const results = [];
    const expiredSubscriptions = [];

    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      const result = await sendPushNotification(subscription, payload);
      
      if (result.expired) {
        expiredSubscriptions.push(sub.id);
      }
      
      results.push({
        subscriptionId: sub.id,
        ...result
      });
    }

    if (expiredSubscriptions.length > 0) {
      await db.query(
        `UPDATE push_subscriptions SET is_active = 0 WHERE id IN (?)`,
        [expiredSubscriptions]
      );
    }

    const successful = results.filter(r => r.success).length;
    
    return {
      success: successful > 0,
      totalSubscriptions: subscriptions.length,
      successful,
      failed: results.length - successful,
      results,
      expiredSubscriptions: expiredSubscriptions.length
    };
  } catch (error) {
    console.error('Error in sendToUser:', error);
    return { success: false, error: error.message };
  }
}


async function sendToUsers(db, userIds, payload) {
  try {
    const results = [];
    
    for (const userId of userIds) {
      const result = await sendToUser(db, userId, payload);
      results.push({ userId, ...result });
    }

    const successful = results.filter(r => r.success).length;
    
    return {
      success: successful > 0,
      totalUsers: userIds.length,
      successful,
      failed: results.length - successful,
      results
    };
  } catch (error) {
    console.error('Error in sendToUsers:', error);
    return { success: false, error: error.message };
  }
}


async function sendToRole(db, role, payload) {
  try {
    const [users] = await db.query(
      `SELECT id FROM users WHERE role = ?`,
      [role]
    );

    if (users.length === 0) {
      return { success: false, message: `No users found with role: ${role}` };
    }

    const userIds = users.map(u => u.id);
    return await sendToUsers(db, userIds, payload);
  } catch (error) {
    console.error('Error in sendToRole:', error);
    return { success: false, error: error.message };
  }
}


async function saveNotification(db, userId, title, body, type, data = null) {
  try {
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, title, body, data, type, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, title, body, data ? JSON.stringify(data) : null, type]
    );

    return result.insertId;
  } catch (error) {
    console.error('Error saving notification:', error);
    throw error;
  }
}


async function sendAndSaveNotification(db, userId, title, body, type, data = null) {
  try {
    const notificationId = await saveNotification(db, userId, title, body, type, data);

    const payload = {
      title,
      body,
      icon: '/assests/logo.svg',
      badge: '/assests/logo.svg',
      data: {
        ...data,
        notificationId,
        type,
        url: data?.url || '/'
      }
    };

    const sendResult = await sendToUser(db, userId, payload);

    const status = sendResult.success ? 'sent' : 'failed';
    await db.query(
      `UPDATE notifications SET status = ?, sent_at = NOW() WHERE id = ?`,
      [status, notificationId]
    );

    return {
      notificationId,
      sendResult,
      success: sendResult.success
    };
  } catch (error) {
    console.error('Error in sendAndSaveNotification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPushNotification,
  sendToUser,
  sendToUsers,
  sendToRole,
  saveNotification,
  sendAndSaveNotification
};

