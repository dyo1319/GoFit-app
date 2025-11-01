
const NOTIFICATION_TYPES = {
  SUBSCRIPTION_RENEWAL_3_DAYS: 'subscription_renewal_3_days',
  SUBSCRIPTION_RENEWAL_1_DAY: 'subscription_renewal_1_day',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_PAUSED: 'subscription_paused',
  SUBSCRIPTION_RESTORED: 'subscription_restored',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_DUE_3_DAYS: 'payment_due_3_days',
  PAYMENT_DUE_1_DAY: 'payment_due_1_day',
  PAYMENT_OVERDUE: 'payment_overdue',
  PAYMENT_RECEIVED: 'payment_received',
  INVOICE_CREATED: 'invoice_created',
  INVOICE_PAID: 'invoice_paid',
  TRAINING_PROGRAM_ASSIGNED: 'training_program_assigned',
  WORKOUT_REMINDER: 'workout_reminder',
  ADMIN_NOTIFICATION: 'admin_notification'
};


function getNotificationContent(type, data = {}) {
  const templates = {
    [NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_3_DAYS]: {
      title: 'תזכורת מנוי',
      body: `המנוי שלך יפוג בעוד 3 ימים (${data.end_date || ''}). אנא חידש את המנוי.`
    },
    [NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_1_DAY]: {
      title: 'תזכורת מנוי דחופה',
      body: `המנוי שלך יפוג מחר (${data.end_date || ''}). אנא חידש את המנוי בהקדם.`
    },
    [NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED]: {
      title: 'המנוי פג תוקף',
      body: `המנוי שלך פג תוקף ב-${data.end_date || ''}. אנא חידש את המנוי.`
    },
    [NOTIFICATION_TYPES.SUBSCRIPTION_CREATED]: {
      title: 'מנוי חדש נוצר',
      body: `מנוי ${data.plan_name || 'חדש'} נוצר בהצלחה. תאריך התחלה: ${data.start_date || ''}.`
    },
    [NOTIFICATION_TYPES.SUBSCRIPTION_UPDATED]: {
      title: 'המנוי עודכן',
      body: data.changes || `המנוי ${data.plan_name || 'שלך'} עודכן בהצלחה. תאריך התחלה: ${data.start_date || ''}, תאריך סיום: ${data.end_date || ''}.`
    },
    [NOTIFICATION_TYPES.SUBSCRIPTION_PAUSED]: {
      title: 'המנוי הוקפא',
      body: `${data.plan_name || 'המנוי שלך'} הוקפא זמנית.`
    },
    [NOTIFICATION_TYPES.SUBSCRIPTION_RESTORED]: {
      title: 'המנוי שוחזר',
      body: `${data.plan_name || 'המנוי שלך'} שוחזר בהצלחה והמנוי פעיל שוב.`
    },
    [NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED]: {
      title: 'המנוי בוטל',
      body: `המנוי שלך בוטל. ${data.reason ? `סיבה: ${data.reason}` : ''}`
    },
    [NOTIFICATION_TYPES.PAYMENT_DUE_3_DAYS]: {
      title: 'תזכורת תשלום',
      body: `יש לך תשלום שצריך לבצע עד ${data.due_date || ''}. סכום: ₪${data.amount || 0}.`
    },
    [NOTIFICATION_TYPES.PAYMENT_DUE_1_DAY]: {
      title: 'תזכורת תשלום דחופה',
      body: `יש לך תשלום שצריך לבצע עד מחר (${data.due_date || ''}). סכום: ₪${data.amount || 0}.`
    },
    [NOTIFICATION_TYPES.PAYMENT_OVERDUE]: {
      title: 'תשלום מאוחר',
      body: `יש לך תשלום מאוחר בסכום של ₪${data.amount || 0}. אנא בצע תשלום בהקדם.`
    },
    [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
      title: 'תשלום התקבל',
      body: `תשלום בסכום של ₪${data.amount || 0} התקבל בהצלחה. תודה!`
    },
    [NOTIFICATION_TYPES.INVOICE_CREATED]: {
      title: 'חשבונית חדשה',
      body: `חשבונית חדשה נוצרה עבורך. סכום: ₪${data.amount || 0}. תאריך יעד: ${data.due_date || ''}.`
    },
    [NOTIFICATION_TYPES.INVOICE_PAID]: {
      title: 'חשבונית שולמה',
      body: `חשבונית #${data.invoice_number || ''} שולמה בהצלחה. סכום: ₪${data.amount || 0}.`
    },
    [NOTIFICATION_TYPES.TRAINING_PROGRAM_ASSIGNED]: {
      title: 'תוכנית אימונים חדשה',
      body: `תוכנית אימונים חדשה "${data.program_name || ''}" הוקצתה עבורך.`
    },
    [NOTIFICATION_TYPES.WORKOUT_REMINDER]: {
      title: 'תזכורת אימון',
      body: `זוכר שאתה צריך להתאמן היום! ${data.program_name ? `תוכנית: ${data.program_name}` : ''}`
    },
    [NOTIFICATION_TYPES.ADMIN_NOTIFICATION]: {
      title: data.title || 'התראה',
      body: data.body || 'יש לך התראה חדשה.'
    }
  };

  return templates[type] || {
    title: data.title || 'התראה',
    body: data.body || 'יש לך התראה חדשה.'
  };
}


function getNotificationUrl(type, data = {}) {
  let baseUrl = '/';
  
  switch (type) {
    case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_3_DAYS:
    case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL_1_DAY:
    case NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
    case NOTIFICATION_TYPES.SUBSCRIPTION_CREATED:
    case NOTIFICATION_TYPES.SUBSCRIPTION_UPDATED:
    case NOTIFICATION_TYPES.SUBSCRIPTION_PAUSED:
    case NOTIFICATION_TYPES.SUBSCRIPTION_RESTORED:
    case NOTIFICATION_TYPES.SUBSCRIPTION_CANCELLED:
      baseUrl = '/app/membership';
      if (data.subscription_id) {
        baseUrl += `?subscription_id=${data.subscription_id}`;
      }
      break;
      
    case NOTIFICATION_TYPES.PAYMENT_DUE_3_DAYS:
    case NOTIFICATION_TYPES.PAYMENT_DUE_1_DAY:
    case NOTIFICATION_TYPES.PAYMENT_OVERDUE:
    case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
      baseUrl = '/app/membership';
      if (data.subscription_id) {
        baseUrl += `?subscription_id=${data.subscription_id}`;
      }
      break;
      
    case NOTIFICATION_TYPES.INVOICE_CREATED:
    case NOTIFICATION_TYPES.INVOICE_PAID:
      baseUrl = '/admin/invoices';
      if (data.invoice_id) {
        baseUrl += `?invoice_id=${data.invoice_id}`;
      }
      break;
      
    case NOTIFICATION_TYPES.TRAINING_PROGRAM_ASSIGNED:
    case NOTIFICATION_TYPES.WORKOUT_REMINDER:
      baseUrl = '/app/workouts';
      if (data.program_id) {
        baseUrl += `?program_id=${data.program_id}`;
      }
      break;
      
    case NOTIFICATION_TYPES.ADMIN_NOTIFICATION:
      baseUrl = data.url || '/app';
      break;
      
    default:
      baseUrl = '/app';
  }

  return baseUrl;
}

module.exports = {
  NOTIFICATION_TYPES,
  getNotificationContent,
  getNotificationUrl
};

