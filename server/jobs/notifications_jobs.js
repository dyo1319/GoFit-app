const crypto = require('crypto');
const generateUniqueKey = (data) => 
  crypto.createHash('sha1').update(String(data)).digest('hex');

async function notifyUpcomingRenewals(days = 7) {
  try {
    const db = global.db_pool.promise();
    
    const [rows] = await db.query(
      `SELECT 
        s.id AS sub_id, 
        u.id AS user_id, 
        u.username, 
        u.phone as email,
        s.end_date,
        DATEDIFF(s.end_date, CURDATE()) AS days_until_expiry
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.cancelled_at IS NULL
         AND s.paused_at IS NULL
         AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND s.end_date > CURDATE()`,
      [days]
    );

    if (!rows.length) {
      console.log(`[Jobs] No upcoming renewals found in the next ${days} days`);
      return 0;
    }

    const adminValues = [];
    const userValues = [];

    rows.forEach(row => {
      adminValues.push([
        'admin',
        null,
        'חידוש מנוי קרוב',
        `המנוי של ${row.username} (${row.email}) יפוג בעוד ${row.days_until_expiry} ימים, בתאריך ${formatDate(row.end_date)}`,
        'warning',
        generateUniqueKey(`admin-renewal-${row.user_id}-${row.end_date}`),
      ]);

      userValues.push([
        'user',
        row.user_id,
        'חידוש מנוי קרוב',
        `המנוי שלך יפוג בעוד ${row.days_until_expiry} ימים, בתאריך ${formatDate(row.end_date)}. אנא חידשו את המנוי להמשך שירות.`,
        'warning',
        generateUniqueKey(`user-renewal-${row.user_id}-${row.end_date}`),
      ]);
    });

    let totalCreated = 0;

    if (adminValues.length) {
      const [adminResult] = await db.query(
        `INSERT IGNORE INTO notifications 
         (audience, user_id, title, message, type, uniq_key) 
         VALUES ?`,
        [adminValues]
      );
      totalCreated += adminResult.affectedRows || 0;
    }

    if (userValues.length) {
      const [userResult] = await db.query(
        `INSERT IGNORE INTO notifications 
         (audience, user_id, title, message, type, uniq_key) 
         VALUES ?`,
        [userValues]
      );
      totalCreated += userResult.affectedRows || 0;
    }

    console.log(`[Jobs] Created ${totalCreated} renewal notifications (${adminValues.length} admin, ${userValues.length} user)`);
    return totalCreated;
  } catch (error) {
    console.error('[Jobs] Error in notifyUpcomingRenewals:', error);
    return 0;
  }
}

async function notifyFailedPayments() {
  try {
    const db = global.db_pool.promise();
    
    const [rows] = await db.query(
      `SELECT 
        s.id AS sub_id, 
        u.id AS user_id, 
        u.username, 
        u.phone as email,
        s.updated_at
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.payment_status = 'failed'
         AND DATE(s.updated_at) = CURDATE()
         AND s.cancelled_at IS NULL`
    );

    if (!rows.length) {
      console.log('[Jobs] No failed payments found today');
      return 0;
    }

    const today = new Date().toISOString().slice(0, 10);
    const adminValues = [];
    const userValues = [];

    rows.forEach(row => {
      adminValues.push([
        'admin',
        null,
        'תשלום נכשל',
        `לתשומת ליבך: תשלום נכשל אצל ${row.username} (${row.email}). נדרש טיפול.`,
        'error',
        generateUniqueKey(`admin-payfail-${row.user_id}-${today}`),
      ]);

      userValues.push([
        'user',
        row.user_id,
        'תשלום נכשל',
        `תשלום המנוי שלך נכשל. אנא בדקו את פרטי התשלום או פנו לתמיכה.`,
        'error',
        generateUniqueKey(`user-payfail-${row.user_id}-${today}`),
      ]);
    });

    let totalCreated = 0;

    if (adminValues.length) {
      const [adminResult] = await db.query(
        `INSERT IGNORE INTO notifications 
         (audience, user_id, title, message, type, uniq_key) 
         VALUES ?`,
        [adminValues]
      );
      totalCreated += adminResult.affectedRows || 0;
    }

    if (userValues.length) {
      const [userResult] = await db.query(
        `INSERT IGNORE INTO notifications 
         (audience, user_id, title, message, type, uniq_key) 
         VALUES ?`,
        [userValues]
      );
      totalCreated += userResult.affectedRows || 0;
    }

    console.log(`[Jobs] Created ${totalCreated} failed payment notifications (${adminValues.length} admin, ${userValues.length} user)`);
    return totalCreated;
  } catch (error) {
    console.error('[Jobs] Error in notifyFailedPayments:', error);
    return 0;
  }
}

async function createUserNotification(userId, title, message, type = 'info') {
  try {
    const db = global.db_pool.promise();
    
    const [result] = await db.query(
      `INSERT INTO notifications 
       (audience, user_id, title, message, type, uniq_key) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['user', userId, title, message, type, generateUniqueKey(`user-${userId}-${Date.now()}`)]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error creating user notification:', error);
    return false;
  }
}

async function createAdminNotification(title, message, type = 'info') {
  try {
    const db = global.db_pool.promise();
    
    const [result] = await db.query(
      `INSERT INTO notifications 
       (audience, user_id, title, message, type, uniq_key) 
       VALUES (?, NULL, ?, ?, ?, ?)`,
      ['admin', title, message, type, generateUniqueKey(`admin-${Date.now()}`)]
    );

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error creating admin notification:', error);
    return false;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

module.exports = { 
  notifyUpcomingRenewals, 
  notifyFailedPayments,
  createUserNotification,
  createAdminNotification,
  generateUniqueKey 
};