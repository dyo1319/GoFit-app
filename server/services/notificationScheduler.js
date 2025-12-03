const pushNotificationService = require('./pushNotificationService');
const { NOTIFICATION_TYPES, getNotificationContent, getNotificationUrl } = require('./notificationTypes');


async function checkSubscriptionRenewals() {
  try {
    const db = global.db_pool.promise();
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const [subs3Days] = await db.query(
      `SELECT s.id, s.user_id, s.end_date, s.plan_name, u.username
       FROM subscriptions s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.cancelled_at IS NULL 
         AND DATE(s.end_date) = ?
         AND s.payment_status = 'paid'`,
      [threeDaysStr]
    );

    for (const sub of subs3Days) {
      const content = getNotificationContent(NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_3_DAYS, {
        end_date: sub.end_date
      });

      await pushNotificationService.sendAndSaveNotification(
        db,
        sub.user_id,
        content.title,
        content.body,
        NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_3_DAYS,
        {
          subscription_id: sub.id,
          end_date: sub.end_date,
          plan_name: sub.plan_name,
          url: getNotificationUrl(NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_3_DAYS)
        }
      );
    }

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStr = oneDayFromNow.toISOString().split('T')[0];

    const [subs1Day] = await db.query(
      `SELECT s.id, s.user_id, s.end_date, s.plan_name, u.username
       FROM subscriptions s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.cancelled_at IS NULL 
         AND DATE(s.end_date) = ?
         AND s.payment_status = 'paid'`,
      [oneDayStr]
    );

    for (const sub of subs1Day) {
      const content = getNotificationContent(NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_1_DAY, {
        end_date: sub.end_date
      });

      await pushNotificationService.sendAndSaveNotification(
        db,
        sub.user_id,
        content.title,
        content.body,
        NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_1_DAY,
        {
          subscription_id: sub.id,
          end_date: sub.end_date,
          plan_name: sub.plan_name,
          url: getNotificationUrl(NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_1_DAY)
        }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const [expiredSubs] = await db.query(
      `SELECT s.id, s.user_id, s.end_date, s.plan_name, u.username
       FROM subscriptions s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.cancelled_at IS NULL 
         AND DATE(s.end_date) = ?
         AND s.payment_status = 'paid'`,
      [today]
    );

    for (const sub of expiredSubs) {
      const content = getNotificationContent(NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED, {
        end_date: sub.end_date
      });

      await pushNotificationService.sendAndSaveNotification(
        db,
        sub.user_id,
        content.title,
        content.body,
        NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED,
        {
          subscription_id: sub.id,
          end_date: sub.end_date,
          plan_name: sub.plan_name,
          url: getNotificationUrl(NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED)
        }
      );
    }

    console.log(`Checked subscription renewals: ${subs3Days.length} (3 days), ${subs1Day.length} (1 day), ${expiredSubs.length} (expired)`);
  } catch (error) {
    console.error('Error checking subscription renewals:', error);
  }
}


async function checkPaymentDues() {
  try {
    const db = global.db_pool.promise();
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const [invoices3Days] = await db.query(
      `SELECT i.id, i.user_id, i.due_date, i.total_amount, i.invoice_number, u.username
       FROM invoices i
       INNER JOIN users u ON i.user_id = u.id
       WHERE i.status = 'pending' 
         AND DATE(i.due_date) = ?`,
      [threeDaysStr]
    );

    for (const invoice of invoices3Days) {
      const content = getNotificationContent(NOTIFICATION_TYPES.PAYMENT_DUE_3_DAYS, {
        due_date: invoice.due_date,
        amount: invoice.total_amount
      });

      await pushNotificationService.sendAndSaveNotification(
        db,
        invoice.user_id,
        content.title,
        content.body,
        NOTIFICATION_TYPES.PAYMENT_DUE_3_DAYS,
        {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          due_date: invoice.due_date,
          amount: invoice.total_amount,
          url: getNotificationUrl(NOTIFICATION_TYPES.PAYMENT_DUE_3_DAYS)
        }
      );
    }

    const oneDayFromNow = new Date();
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    const oneDayStr = oneDayFromNow.toISOString().split('T')[0];

    const [invoices1Day] = await db.query(
      `SELECT i.id, i.user_id, i.due_date, i.total_amount, i.invoice_number, u.username
       FROM invoices i
       INNER JOIN users u ON i.user_id = u.id
       WHERE i.status = 'pending' 
         AND DATE(i.due_date) = ?`,
      [oneDayStr]
    );

    for (const invoice of invoices1Day) {
      const content = getNotificationContent(NOTIFICATION_TYPES.PAYMENT_DUE_1_DAY, {
        due_date: invoice.due_date,
        amount: invoice.total_amount
      });

      await pushNotificationService.sendAndSaveNotification(
        db,
        invoice.user_id,
        content.title,
        content.body,
        NOTIFICATION_TYPES.PAYMENT_DUE_1_DAY,
        {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          due_date: invoice.due_date,
          amount: invoice.total_amount,
          url: getNotificationUrl(NOTIFICATION_TYPES.PAYMENT_DUE_1_DAY)
        }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const [overdueInvoices] = await db.query(
      `SELECT i.id, i.user_id, i.due_date, i.total_amount, i.invoice_number, u.username
       FROM invoices i
       INNER JOIN users u ON i.user_id = u.id
       WHERE i.status = 'pending' 
         AND DATE(i.due_date) < ?`,
      [today]
    );

    for (const invoice of overdueInvoices) {
      const [existing] = await db.query(
        `SELECT id FROM notifications 
         WHERE user_id = ? 
           AND type = ?
           AND DATE(created_at) = CURDATE()
           AND JSON_EXTRACT(data, '$.invoice_id') = ?`,
        [invoice.user_id, NOTIFICATION_TYPES.PAYMENT_OVERDUE, invoice.id]
      );

      if (existing.length === 0) {
        const content = getNotificationContent(NOTIFICATION_TYPES.PAYMENT_OVERDUE, {
          amount: invoice.total_amount
        });

        await pushNotificationService.sendAndSaveNotification(
          db,
          invoice.user_id,
          content.title,
          content.body,
          NOTIFICATION_TYPES.PAYMENT_OVERDUE,
          {
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            due_date: invoice.due_date,
            amount: invoice.total_amount,
            url: getNotificationUrl(NOTIFICATION_TYPES.PAYMENT_OVERDUE)
          }
        );
      }
    }

    console.log(`Checked payment dues: ${invoices3Days.length} (3 days), ${invoices1Day.length} (1 day), ${overdueInvoices.length} (overdue)`);
  } catch (error) {
    console.error('Error checking payment dues:', error);
  }
}


async function runScheduledChecks() {
  console.log('Running scheduled notification checks...');
  await checkSubscriptionRenewals();
  await checkPaymentDues();
}

module.exports = {
  checkSubscriptionRenewals,
  checkPaymentDues,
  runScheduledChecks
};




