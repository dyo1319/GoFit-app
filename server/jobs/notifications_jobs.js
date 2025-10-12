const crypto = require('crypto');

const generateUniqueKey = (data) => 
  crypto.createHash('sha1').update(String(data)).digest('hex');

async function notifyUpcomingRenewals(days = 7) {
  try {
    const db = global.db_pool.promise(); // Use global pool
    
    const [rows] = await db.query(
      `SELECT 
        s.id AS sub_id, 
        u.id AS user_id, 
        u.username, 
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

    const values = rows.map(row => ([
      'admin',
      row.user_id,
      'חידוש מנוי קרוב',
      `המנוי של ${row.username} (${row.email}) יפוג בעוד ${row.days_until_expiry} ימים, בתאריך ${formatDate(row.end_date)}`,
      'warning',
      generateUniqueKey(`renewal-${row.user_id}-${row.end_date}`),
    ]));

    const [result] = await db.query(
      `INSERT IGNORE INTO notifications 
       (audience, user_id, title, message, type, uniq_key) 
       VALUES ?`,
      [values]
    );

    console.log(`[Jobs] Created ${result.affectedRows} renewal notifications`);
    return result.affectedRows || 0;
  } catch (error) {
    console.error('[Jobs] Error in notifyUpcomingRenewals:', error);
    return 0;
  }
}

async function notifyFailedPayments() {
  try {
    const db = global.db_pool.promise(); // Use global pool
    
    const [rows] = await db.query(
      `SELECT 
        s.id AS sub_id, 
        u.id AS user_id, 
        u.username, 
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
    const values = rows.map(row => ([
      'admin',
      row.user_id,
      'תשלום נכשל',
      `לתשומת ליבך: תשלום נכשל אצל ${row.username} (${row.email}). נדרש טיפול.`,
      'error',
      generateUniqueKey(`payfail-${row.user_id}-${today}`),
    ]));

    const [result] = await db.query(
      `INSERT IGNORE INTO notifications 
       (audience, user_id, title, message, type, uniq_key) 
       VALUES ?`,
      [values]
    );

    console.log(`[Jobs] Created ${result.affectedRows} failed payment notifications`);
    return result.affectedRows || 0;
  } catch (error) {
    console.error('[Jobs] Error in notifyFailedPayments:', error);
    return 0;
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
  generateUniqueKey 
};