const MAX_PAGE_SIZE = 200;

const SORT_FIELDS = {
  end_date:       's.end_date',
  start_date:     's.start_date',
  username:       'u.username',
  payment_status: 's.payment_status',
  price:          's.price',
  plan_name:      's.plan_name',
  id:             's.id',
};

const STATUS_CASE_SQL = `
  CASE
    WHEN s.cancelled_at IS NOT NULL THEN 'canceled'
    WHEN s.paused_at    IS NOT NULL THEN 'paused'
    WHEN s.end_date     <  CURDATE() THEN 'expired'
    ELSE 'active'
  END AS subscription_status
`;

const DAYS_LEFT_SQL = `
  CASE
    WHEN s.cancelled_at IS NOT NULL THEN NULL
    WHEN s.end_date < CURDATE() THEN NULL
    ELSE DATEDIFF(s.end_date, CURDATE())
  END AS days_left
`;

const parseSort = (sortStr = 'end_date:asc') => {
  const [field = 'end_date', dir = 'asc'] = String(sortStr || '').split(':');
  const orderBy = SORT_FIELDS[field] || SORT_FIELDS.end_date;
  const orderDir = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return { orderBy, orderDir };
};

async function list(req, res) {
  try {
    const db = global.db_pool.promise();
    const {
      page = 1,
      pageSize = 10,
      query = '',
      status = '',
      statuses = '',
      expiresInDays,
      userId,
      payment_status,
      sort
    } = req.query;

    const pageNum     = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize, 10) || 10));
    const offset      = (pageNum - 1) * pageSizeNum;

    const { orderBy, orderDir } = parseSort(sort);

    const where = [];
    const params = [];

    if (query) {
      where.push('(u.username LIKE ? OR u.phone LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }
    if (userId) {
      where.push('s.user_id = ?');
      params.push(userId);
    }
    if (payment_status) {
      where.push('s.payment_status = ?');
      params.push(payment_status);
    }

    const normalized = new Set();
    const addStatus = (s) => {
      if (['active', 'expired', 'canceled', 'paused'].includes(s)) normalized.add(s);
    };
    if (status) addStatus(status);
    String(statuses || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(addStatus);

    if (normalized.size) {
      const parts = [];
      for (const s of normalized) {
        if (s === 'active')  parts.push('(s.cancelled_at IS NULL AND s.paused_at IS NULL AND s.end_date >= CURDATE())');
        if (s === 'expired') parts.push('(s.cancelled_at IS NULL AND s.paused_at IS NULL AND s.end_date <  CURDATE())');
        if (s === 'canceled')parts.push('(s.cancelled_at IS NOT NULL)');
        if (s === 'paused')  parts.push('(s.cancelled_at IS NULL AND s.paused_at IS NOT NULL)');
      }
      if (parts.length) where.push(`(${parts.join(' OR ')})`);
    }

    const expNum = expiresInDays === '' || expiresInDays == null ? undefined : Number(expiresInDays);
    if (Number.isFinite(expNum) && expNum >= 0) {
      where.push('s.cancelled_at IS NULL AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)');
      params.push(expNum);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [cntRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       ${whereSQL}`,
      params
    );
    const total = cntRows[0]?.total || 0;

    const [rows] = await db.query(
      `SELECT
        s.id, s.user_id, u.username, u.phone,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(s.end_date,   '%Y-%m-%d') AS end_date,
        s.payment_status, s.cancelled_at, s.price, s.plan_type, s.plan_name,
        ${STATUS_CASE_SQL}, ${DAYS_LEFT_SQL}
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       ${whereSQL}
       ORDER BY ${orderBy} ${orderDir}
       LIMIT ${pageSizeNum} OFFSET ${offset}`,
      params
    );

    res.json({ data: rows, total, page: pageNum, pageSize: pageSizeNum });
  } catch (err) {
    console.error('subscriptions.list error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function getOne(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [rows] = await db.query(
      `SELECT
        s.id, s.user_id, u.username, u.phone,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(s.end_date,   '%Y-%m-%d') AS end_date,
        s.payment_status, s.cancelled_at, s.price, s.plan_type, s.plan_name,
        ${STATUS_CASE_SQL}, ${DAYS_LEFT_SQL}
       FROM subscriptions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'לא נמצא מנוי' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error('subscriptions.getOne error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function create(req, res) {
  try {
    const db = global.db_pool.promise();
    const { 
      user_id, 
      start_date, 
      end_date, 
      payment_status = 'pending',
      price = 0,
      plan_type = 'monthly',
      plan_name = 'מנוי חודשי',
      plan_id = null
    } = req.body;

    const [userExists] = await db.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!userExists.length) {
      return res.status(400).json({ error: 'משתמש לא קיים' });
    }

    const [overlap] = await db.query(
      `SELECT 1 FROM subscriptions
       WHERE user_id = ? AND cancelled_at IS NULL
         AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?) OR (start_date <= ? AND end_date >= ?))
       LIMIT 1`,
      [user_id, start_date, end_date, start_date, end_date, start_date, end_date]
    );
    if (overlap.length) {
      return res.status(409).json({ error: 'קיים מנוי פעיל למשתמש זה' });
    }

    const [ins] = await db.query(
      `INSERT INTO subscriptions (user_id, start_date, end_date, payment_status, price, plan_type, plan_name, plan_id) 
       VALUES (?,?,?,?,?,?,?,?)`,
      [user_id, start_date, end_date, payment_status, price, plan_type, plan_name, plan_id]
    );

    res.status(201).json({ id: ins.insertId });
  } catch (err) {
    console.error('subscriptions.create error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function update(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [currentSub] = await db.query(
      'SELECT user_id, start_date, end_date FROM subscriptions WHERE id = ?',
      [id]
    );
    if (!currentSub.length) {
      return res.status(404).json({ error: 'לא נמצא מנוי' });
    }

    const updates = [];
    const params = [];

    if ('start_date' in req.body) {
      updates.push('start_date = ?'); 
      params.push(req.body.start_date);
    }
    if ('end_date' in req.body) {
      updates.push('end_date = ?'); 
      params.push(req.body.end_date);
    }
    if ('payment_status' in req.body) {
      updates.push('payment_status = ?'); 
      params.push(req.body.payment_status);
    }

    if (!updates.length) return res.status(400).json({ error: 'אין שדות לעדכון' });

    const startDate = req.body.start_date || currentSub[0].start_date;
    const endDate = req.body.end_date || currentSub[0].end_date;

    const [overlap] = await db.query(
      `SELECT 1 FROM subscriptions
       WHERE user_id = ? AND id != ? AND cancelled_at IS NULL
         AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?) OR (start_date <= ? AND end_date >= ?))
       LIMIT 1`,
      [currentSub[0].user_id, id, startDate, endDate, startDate, endDate, startDate, endDate]
    );
    if (overlap.length) {
      return res.status(409).json({ error: 'קיים מנוי פעיל/חופף למשתמש זה' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const [upd] = await db.query(
      `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    if (!upd.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי לעדכון' });

    res.json({ affected: upd.affectedRows });
  } catch (err) {
    console.error('subscriptions.update error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function cancel(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [upd] = await db.query(
      `UPDATE subscriptions SET cancelled_at = NOW(), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [id]
    );
    if (!upd.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי לביטול' });

    res.json({ affected: upd.affectedRows });
  } catch (err) {
    console.error('subscriptions.cancel error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function restore(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [upd] = await db.query(
      `UPDATE subscriptions SET cancelled_at = NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [id]
    );
    if (!upd.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי לשחזור' });

    res.json({ affected: upd.affectedRows });
  } catch (err) {
    console.error('subscriptions.restore error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function pause(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [cur] = await db.query(`SELECT paused_at FROM subscriptions WHERE id=?`, [id]);
    if (!cur.length) return res.status(404).json({ error: 'לא נמצא מנוי' });
    if (cur[0].paused_at) return res.status(409).json({ error: 'המנוי כבר מוקפא' });

    const [upd] = await db.query(
      `UPDATE subscriptions SET paused_at = CURDATE(), updated_at=CURRENT_TIMESTAMP WHERE id=? AND cancelled_at IS NULL`,
      [id]
    );
    if (!upd.affectedRows) return res.status(409).json({ error: 'לא ניתן להקפיא מנוי מבוטל' });

    res.json({ affected: upd.affectedRows });
  } catch (err) {
    console.error('subscriptions.pause error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function resume(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [cur] = await db.query(`SELECT paused_at FROM subscriptions WHERE id=?`, [id]);
    if (!cur.length) return res.status(404).json({ error: 'לא נמצא מנוי' });
    if (!cur[0].paused_at) return res.status(409).json({ error: 'המנוי אינו מוקפא' });

    const [[{ deltaDays }]] = await db.query(`SELECT DATEDIFF(CURDATE(), ?) AS deltaDays`, [cur[0].paused_at]);

    const addDays = Math.max(0, deltaDays || 0);
    const [upd] = await db.query(
      `UPDATE subscriptions
         SET end_date = DATE_ADD(end_date, INTERVAL ? DAY),
             paused_at = NULL,
             updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [addDays, id]
    );

    res.json({ affected: upd.affectedRows, added_days: addDays });
  } catch (err) {
    console.error('subscriptions.resume error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function deletesub(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;

    const [del] = await db.query('DELETE FROM subscriptions WHERE id = ?', [id]);
    if (!del.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי למחיקה' });

    res.json({ affected: del.affectedRows });
  } catch (err) {
    console.error('subscriptions.hardDelete error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function count(req, res) {
  try {
    const db = global.db_pool.promise();
    const { query = '', status = '', statuses = '', expiresInDays, userId, payment_status } = req.query;

    const where = [];
    const params = [];

    if (query) {
      where.push('(u.username LIKE ? OR u.phone LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }
    if (userId) {
      where.push('s.user_id = ?');
      params.push(userId);
    }
    if (payment_status) {
      where.push('s.payment_status = ?');
      params.push(payment_status);
    }

    const normalized = new Set();
    const addStatus = (s) => {
      if (['active', 'expired', 'canceled', 'paused'].includes(s)) normalized.add(s);
    };
    if (status) addStatus(status);
    String(statuses || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(addStatus);

    if (normalized.size) {
      const parts = [];
      for (const s of normalized) {
        if (s === 'active')  parts.push('(s.cancelled_at IS NULL AND s.paused_at IS NULL AND s.end_date >= CURDATE())');
        if (s === 'expired') parts.push('(s.cancelled_at IS NULL AND s.paused_at IS NULL AND s.end_date <  CURDATE())');
        if (s === 'canceled')parts.push('(s.cancelled_at IS NOT NULL)');
        if (s === 'paused')  parts.push('(s.cancelled_at IS NULL AND s.paused_at IS NOT NULL)');
      }
      if (parts.length) where.push(`(${parts.join(' OR ')})`);
    }

    const expNum = expiresInDays === '' || expiresInDays == null ? undefined : Number(expiresInDays);
    if (Number.isFinite(expNum) && expNum >= 0) {
      where.push('s.cancelled_at IS NULL AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)');
      params.push(expNum);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [cntRows] = await db.query(
      `SELECT COUNT(*) AS count
         FROM subscriptions s
         JOIN users u ON u.id = s.user_id
       ${whereSQL}`,
      params
    );

    res.json({ count: cntRows[0]?.count || 0 });
  } catch (err) {
    console.error('subscriptions.count error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = req.params.id;
    const status = req.body.status;

    const [upd] = await db.query(
      `UPDATE subscriptions SET payment_status=?, updated_at=CURRENT_TIMESTAMP
       WHERE id=? AND payment_status='pending'`,
      [status, id]
    );
    if (!upd.affectedRows) {
      return res.status(404).json({ error: 'לא נמצא/לא במצב pending' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('subscriptions.updatePaymentStatus error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const db = global.db_pool.promise();
    
    const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
    const [trainersCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "trainer"');
    const [expiringSubs] = await db.query(`SELECT COUNT(*) as count FROM subscriptions WHERE cancelled_at IS NULL AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`);
    
    const [paymentStats] = await db.query(`
      SELECT payment_status, COUNT(*) as count 
      FROM subscriptions 
      GROUP BY payment_status
    `);

    const [subscriptionStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN cancelled_at IS NOT NULL THEN 1 ELSE 0 END) as canceled,
        SUM(CASE WHEN paused_at IS NOT NULL THEN 1 ELSE 0 END) as paused,
        SUM(CASE WHEN cancelled_at IS NULL AND paused_at IS NULL AND end_date >= CURDATE() THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN cancelled_at IS NULL AND paused_at IS NULL AND end_date < CURDATE() THEN 1 ELSE 0 END) as expired
      FROM subscriptions
    `);

    const [pendingPaymentsResult] = await db.query(`
      SELECT COUNT(*) as count 
      FROM subscriptions 
      WHERE payment_status = 'pending'
    `);

    res.json({
      users: usersCount[0].count,
      trainers: trainersCount[0].count,
      activeSubs: subscriptionStats[0].active,
      expiredSubs: subscriptionStats[0].expired,
      canceledSubs: subscriptionStats[0].canceled,
      pausedSubs: subscriptionStats[0].paused,
      expiring7: expiringSubs[0].count,
      pendingPayments: pendingPaymentsResult[0].count,
      paymentStats: paymentStats.reduce((acc, curr) => {
        acc[curr.payment_status] = curr.count;
        return acc;
      }, {}),
      subscriptionStats: subscriptionStats[0] 
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}


async function getUserSubscriptions(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [rows] = await db.query(
      `SELECT
        s.id, s.user_id, u.username,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
        s.payment_status, s.cancelled_at,
        ${STATUS_CASE_SQL}, ${DAYS_LEFT_SQL}
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = ?
       ORDER BY s.start_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (err) {
    console.error('subscriptions.getUserSubscriptions error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function getCurrentSubscription(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const currentDate = new Date().toISOString().split('T')[0];

    const [rows] = await db.query(
      `SELECT
        s.id, s.user_id, u.username,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
        s.payment_status, s.cancelled_at,
        ${STATUS_CASE_SQL}, ${DAYS_LEFT_SQL}
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = ?
         AND s.cancelled_at IS NULL
         AND s.start_date <= ?
         AND s.end_date >= ?
       ORDER BY s.start_date DESC
       LIMIT 1`,
      [userId, currentDate, currentDate]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    console.error('subscriptions.getCurrentSubscription error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function getUserSubscriptionStats(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const [totalResult] = await db.query(
      `SELECT COUNT(*) as total_subscriptions
       FROM subscriptions 
       WHERE user_id = ?`,
      [userId]
    );

    const [activeResult] = await db.query(
      `SELECT COUNT(*) as active_subscriptions
       FROM subscriptions 
       WHERE user_id = ? 
         AND cancelled_at IS NULL 
         AND end_date >= CURDATE()`,
      [userId]
    );

    const [expiredResult] = await db.query(
      `SELECT COUNT(*) as expired_subscriptions
       FROM subscriptions 
       WHERE user_id = ? 
         AND cancelled_at IS NULL 
         AND end_date < CURDATE()`,
      [userId]
    );

    const totalSubscriptions = totalResult[0]?.total_subscriptions || 0;
    const activeSubscriptions = activeResult[0]?.active_subscriptions || 0;
    const expiredSubscriptions = expiredResult[0]?.expired_subscriptions || 0;

    res.json({
      success: true,
      data: {
        total_subscriptions: parseInt(totalSubscriptions),
        active_subscriptions: parseInt(activeSubscriptions),
        expired_subscriptions: parseInt(expiredSubscriptions),
        current_month: currentMonth,
        current_year: currentYear
      }
    });
  } catch (err) {
    console.error('subscriptions.getUserSubscriptionStats error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

async function createUserSubscription(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { start_date, end_date, payment_status = 'pending' } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Start date and end date are required' 
      });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const [overlap] = await db.query(
      `SELECT 1 FROM subscriptions
       WHERE user_id = ? AND cancelled_at IS NULL
         AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?) OR (start_date <= ? AND end_date >= ?))
       LIMIT 1`,
      [userId, start_date, end_date, start_date, end_date, start_date, end_date]
    );

    if (overlap.length) {
      return res.status(409).json({ success: false, message: 'Active subscription already exists for this period' });
    }

    const [ins] = await db.query(
      `INSERT INTO subscriptions (user_id, start_date, end_date, payment_status) VALUES (?,?,?,?)`,
      [userId, start_date, end_date, payment_status]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { id: ins.insertId }
    });
  } catch (err) {
    console.error('subscriptions.createUserSubscription error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}


module.exports = {
  list,
  getOne,
  create,
  update,
  cancel,
  restore,
  pause,
  resume,
  deletesub,
  count,
  getDashboardStats,
  updatePaymentStatus,
  getUserSubscriptions,
  getCurrentSubscription,
  getUserSubscriptionStats,
  createUserSubscription
};
