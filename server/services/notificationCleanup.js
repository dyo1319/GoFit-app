const cron = require('node-cron');

const RETENTION_DAYS_READ = parseInt(process.env.NOTIFICATION_RETENTION_DAYS_READ) || 30;
const RETENTION_DAYS_UNREAD = parseInt(process.env.NOTIFICATION_RETENTION_DAYS_UNREAD) || 90;

async function cleanupOldNotifications(db) {
  try {
    const [readResult] = await db.query(
      `DELETE FROM notifications 
       WHERE read_at IS NOT NULL 
       AND read_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [RETENTION_DAYS_READ]
    );

    const [unreadResult] = await db.query(
      `DELETE FROM notifications 
       WHERE read_at IS NULL 
       AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [RETENTION_DAYS_UNREAD]
    );

    const totalDeleted = readResult.affectedRows + unreadResult.affectedRows;
    
    if (totalDeleted > 0) {
      console.log(`[Cleanup] Deleted ${totalDeleted} old notifications (${readResult.affectedRows} read, ${unreadResult.affectedRows} unread)`);
    }

    return {
      success: true,
      deletedRead: readResult.affectedRows,
      deletedUnread: unreadResult.affectedRows,
      total: totalDeleted
    };
  } catch (error) {
    console.error('[Cleanup] Error cleaning up notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function cleanupExpiredSubscriptions(db) {
  try {
    const [result] = await db.query(
      `UPDATE push_subscriptions 
       SET is_active = 0 
       WHERE is_active = 1 
       AND updated_at < DATE_SUB(NOW(), INTERVAL 180 DAY)`
    );

    if (result.affectedRows > 0) {
      console.log(`[Cleanup] Deactivated ${result.affectedRows} stale push subscriptions`);
    }

    return {
      success: true,
      deactivated: result.affectedRows
    };
  } catch (error) {
    console.error('[Cleanup] Error cleaning up subscriptions:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function optimizeNotificationTables(db) {
  try {
    await db.query('OPTIMIZE TABLE notifications');
    await db.query('OPTIMIZE TABLE push_subscriptions');
    await db.query('OPTIMIZE TABLE notification_preferences');
    
    console.log('[Cleanup] Database tables optimized');
    
    return { success: true };
  } catch (error) {
    console.error('[Cleanup] Error optimizing tables:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runDailyCleanup(db) {
  console.log('[Cleanup] Starting daily cleanup...');
  
  const notifResult = await cleanupOldNotifications(db);
  const subsResult = await cleanupExpiredSubscriptions(db);
  const optimizeResult = await optimizeNotificationTables(db);
  
  console.log('[Cleanup] Daily cleanup completed');
  
  return {
    notifications: notifResult,
    subscriptions: subsResult,
    optimization: optimizeResult
  };
}

function startCleanupScheduler(db) {
  console.log(`[Cleanup] Scheduler started - Read: ${RETENTION_DAYS_READ}d, Unread: ${RETENTION_DAYS_UNREAD}d`);
  
  cron.schedule('0 2 * * *', async () => {
    await runDailyCleanup(db);
  });
}

module.exports = {
  cleanupOldNotifications,
  cleanupExpiredSubscriptions,
  optimizeNotificationTables,
  runDailyCleanup,
  startCleanupScheduler
};

