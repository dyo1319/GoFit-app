const pushNotificationService = require('./pushNotificationService');

const BATCH_SIZE = parseInt(process.env.NOTIFICATION_BATCH_SIZE) || 50;
const BATCH_DELAY_MS = parseInt(process.env.NOTIFICATION_BATCH_DELAY_MS) || 1000;

async function sendNotificationBatch(db, userIds, title, body, type, data = null) {
  const results = [];
  const batches = [];
  
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    batches.push(userIds.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    const batchPromises = batch.map(async (userId) => {
      try {
        const result = await pushNotificationService.sendAndSaveNotification(
          db,
          userId,
          title,
          body,
          type,
          data
        );
        return { userId, ...result };
      } catch (error) {
        return { userId, success: false, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    success: successful > 0,
    total: userIds.length,
    successful,
    failed,
    results
  };
}

async function sendToRoleBatched(db, role, title, body, type, data = null) {
  try {
    const [users] = await db.query(
      `SELECT id FROM users WHERE role = ?`,
      [role]
    );

    if (users.length === 0) {
      return { success: false, message: `No users found with role: ${role}` };
    }

    const userIds = users.map(u => u.id);
    return await sendNotificationBatch(db, userIds, title, body, type, data);
  } catch (error) {
    console.error('Error in sendToRoleBatched:', error);
    return { success: false, error: error.message };
  }
}

async function sendToAllUsersBatched(db, title, body, type, data = null) {
  try {
    const [users] = await db.query(`SELECT id FROM users`);

    if (users.length === 0) {
      return { success: false, message: 'No users found' };
    }

    const userIds = users.map(u => u.id);
    return await sendNotificationBatch(db, userIds, title, body, type, data);
  } catch (error) {
    console.error('Error in sendToAllUsersBatched:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotificationBatch,
  sendToRoleBatched,
  sendToAllUsersBatched,
  BATCH_SIZE
};

