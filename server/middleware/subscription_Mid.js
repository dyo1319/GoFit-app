
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : d;
};
const ALLOWED_PAYMENT = new Set(['pending','paid','failed','refunded']);
const MAX_PAGE_SIZE = 100;
const SORT_FIELDS = {
  end_date:       's.end_date',
  start_date:     's.start_date',
  username:       'u.username',
  payment_status: 's.payment_status',
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
  const [field = 'end_date', dir = 'asc'] = String(sortStr).split(':');
  const orderBy = SORT_FIELDS[field] || SORT_FIELDS.end_date;
  const orderDir = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return { orderBy, orderDir };
};

const isDate = (s) => {
  if (typeof s !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return false;
  const date = new Date(s);
  return !isNaN(date.getTime()) && date.toISOString().slice(0,10) === s;
};

async function list(req, res) {
  try {
    const db = global.db_pool.promise();
    const page     = Math.max(1, toInt(req.query.page, 1));
    const pageSize = Math.min(MAX_PAGE_SIZE, toInt(req.query.pageSize, 10));
    const offset   = (page - 1) * pageSize;

    const query    = (req.query.query || '').trim();
    const status   = (req.query.status || '').trim(); 
    const statuses = (req.query.statuses || '').split(',').map(s => s.trim()).filter(Boolean); 
    const expDays  = req.query.expiresInDays != null ? toInt(req.query.expiresInDays, null) : null;
    const userId   = req.query.userId != null ? toInt(req.query.userId, null) : null;

    const { orderBy, orderDir } = parseSort(req.query.sort);

    const where = [];
    const params = [];

    if (query) {
      where.push('(u.username LIKE ? OR u.phone LIKE ?)');
      params.push(`%${query}%`, `%${query}%`);
    }
    if (userId !== null) {
      where.push('s.user_id = ?');
      params.push(userId);
    }

    const normalized = new Set();
    const addStatus = (s) => {
      if (['active', 'expired', 'canceled', 'paused'].includes(s)) normalized.add(s);
    };
    if (status) addStatus(status);
    for (const s of statuses) addStatus(s);

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

    if (expDays !== null) {
      where.push('s.cancelled_at IS NULL AND s.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)');
      params.push(expDays);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [cntRows] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      ${whereSQL}
      `,
      params
    );
    const total = cntRows[0]?.total || 0;

    const [rows] = await db.query(
      `
      SELECT
        s.id, s.user_id,
        u.username, u.phone,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(s.end_date,   '%Y-%m-%d') AS end_date,
        s.payment_status,
        s.cancelled_at,
        ${STATUS_CASE_SQL},
        ${DAYS_LEFT_SQL}
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      ${whereSQL}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    res.json({ data: rows, total, page, pageSize });
  } catch (err) {
    console.error('subscriptions.list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const db = global.db_pool.promise();

    const id = toInt(req.params.id, -1);
    if (id < 1) return res.status(400).json({ error: 'id לא חוקי' });

    const [rows] = await db.query(
      `
      SELECT
        s.id, s.user_id,
        u.username, u.phone,
        DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(s.end_date,   '%Y-%m-%d') AS end_date,
        s.payment_status,
        s.cancelled_at,
        ${STATUS_CASE_SQL},
        ${DAYS_LEFT_SQL}
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ?
      `,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'לא נמצא מנוי' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error('subscriptions.getOne error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function create(req, res) {
  try {
    const db = global.db_pool.promise();

    const { user_id, start_date, end_date, payment_status = 'pending' } = req.body || {};

    if (!user_id || !isDate(start_date) || !isDate(end_date)) {
      return res.status(400).json({ error: 'user_id, start_date, end_date נדרשים בפורמט תקין' });
    }

    const ps = String(payment_status || '').trim();
    if (!ALLOWED_PAYMENT.has(ps)) {
      return res.status(400).json({ error: 'payment_status לא תקין' });
    }

    const [userExists] = await db.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!userExists.length) {
      return res.status(400).json({ error: 'משתמש לא קיים' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'תאריך התחלה חייב להיות לפני תאריך סיום' });
    }

    const [overlap] = await db.query(
      `
      SELECT 1
      FROM subscriptions
      WHERE user_id = ?
        AND cancelled_at IS NULL
        AND (
          (start_date BETWEEN ? AND ?) OR
          (end_date   BETWEEN ? AND ?) OR
          (start_date <= ? AND end_date >= ?)
        )
      LIMIT 1
      `,
      [user_id, start_date, end_date, start_date, end_date, start_date, end_date]
    );
    if (overlap.length) {
      return res.status(409).json({ error: 'קיים מנוי פעיל למשתמש זה' });
    }

    const [ins] = await db.query(
      `INSERT INTO subscriptions (user_id, start_date, end_date, payment_status) VALUES (?,?,?,?)`,
      [user_id, start_date, end_date, ps]
    );

    res.status(201).json({ id: ins.insertId });
  } catch (err) {
    console.error('subscriptions.create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function update(req, res) {
  try {
    const db = global.db_pool.promise();

    const id = toInt(req.params.id, -1);
    if (id < 1) return res.status(400).json({ error: 'id לא חוקי' });

    const [currentSub] = await db.query(
      'SELECT user_id, start_date, end_date FROM subscriptions WHERE id = ?',
      [id]
    );
    if (!currentSub.length) {
      return res.status(404).json({ error: 'לא נמצא מנוי' });
    }

    const fields = [];
    const params = [];

    if ('start_date' in req.body) {
      if (!isDate(req.body.start_date)) return res.status(400).json({ error: 'start_date לא תקין' });
      fields.push('start_date = ?'); params.push(req.body.start_date);
    }
    if ('end_date' in req.body) {
      if (!isDate(req.body.end_date)) return res.status(400).json({ error: 'end_date לא תקין' });
      fields.push('end_date = ?'); params.push(req.body.end_date);
    }
    if ('payment_status' in req.body) {
      const ps = String(req.body.payment_status || '').trim();
      if (!ALLOWED_PAYMENT.has(ps)) return res.status(400).json({ error: 'payment_status לא תקין' });
      fields.push('payment_status = ?'); params.push(ps);
    }

    if (!fields.length) return res.status(400).json({ error: 'אין שדות לעדכון' });

    const startDate = req.body.start_date || currentSub[0].start_date;
    const endDate   = req.body.end_date   || currentSub[0].end_date;

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'תאריך התחלה חייב להיות לפני תאריך סיום' });
    }

    const [overlap] = await db.query(
      `
      SELECT 1
      FROM subscriptions
      WHERE user_id = ?
        AND id != ?
        AND cancelled_at IS NULL
        AND (
          (start_date BETWEEN ? AND ?) OR
          (end_date   BETWEEN ? AND ?) OR
          (start_date <= ? AND end_date >= ?)
        )
      LIMIT 1
      `,
      [currentSub[0].user_id, id, startDate, endDate, startDate, endDate, startDate, endDate]
    );
    if (overlap.length) {
      return res.status(409).json({ error: 'קיים מנוי פעיל/חופף למשתמש זה' });
    }

    const sql = `UPDATE subscriptions SET ${fields.join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`;
    params.push(id);

    const [upd] = await db.query(sql, params);
    if (!upd.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי לעדכון' });

    res.json({ affected: upd.affectedRows });
  } catch (err) {
    console.error('subscriptions.update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function cancel(req, res) {
  try {
    const db = global.db_pool.promise();

    const id = toInt(req.params.id, -1);
    if (id < 1) return res.status(400).json({ error: 'id לא חוקי' });

    const [upd] = await db.query(
      `UPDATE subscriptions SET cancelled_at = NOW(), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [id]
    );
    if (!upd.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי לביטול' });

    res.json({ affected: upd.affectedRows });
  } catch (err) {
    console.error('subscriptions.cancel error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function restore(req, res) {
  try {
    const db = global.db_pool.promise();

    const id = toInt(req.params.id, -1);
    if (id < 1) return res.status(400).json({ error: 'id לא חוקי' });

    const [upd] = await db.query(
      `UPDATE subscriptions SET cancelled_at = NULL, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [id]
    );
    if (!upd.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי לשחזור' });

    res.json({ affected: upd.affectedRows });
  } catch (err) {
    console.error('subscriptions.restore error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function pause(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = toInt(req.params.id, -1);
    if (id < 1) return res.status(400).json({ error: 'id לא חוקי' });

    const [cur] = await db.query(
      `SELECT paused_at, cancelled_at FROM subscriptions WHERE id=?`, [id]
    );
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
    res.status(500).json({ error: 'Server error' });
  }
}

async function resume(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = toInt(req.params.id, -1);
    if (id < 1) return res.status(400).json({ error: 'id לא חוקי' });

    const [cur] = await db.query(
      `SELECT paused_at, end_date FROM subscriptions WHERE id=?`, [id]
    );
    if (!cur.length) return res.status(404).json({ error: 'לא נמצא מנוי' });
    if (!cur[0].paused_at) return res.status(409).json({ error: 'המנוי אינו מוקפא' });

    const [[{ deltaDays }]] = await db.query(
      `SELECT DATEDIFF(CURDATE(), ?) AS deltaDays`, [cur[0].paused_at]
    );

    const [upd] = await db.query(
      `
      UPDATE subscriptions
      SET end_date = DATE_ADD(end_date, INTERVAL ? DAY),
          paused_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [Math.max(0, Number(deltaDays) || 0), id]
    );

    res.json({ affected: upd.affectedRows, added_days: Math.max(0, Number(deltaDays) || 0) });
  } catch (err) {
    console.error('subscriptions.resume error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deletesub(req, res) {
  try {
    const db = global.db_pool.promise();
    const id = toInt(req.params.id, -1);
    if (id < 1) return res.status(400).json({ error: 'id לא חוקי' });

    const [del] = await db.query('DELETE FROM subscriptions WHERE id = ?', [id]);
    if (!del.affectedRows) return res.status(404).json({ error: 'לא נמצא מנוי למחיקה' });

    res.json({ affected: del.affectedRows });
  } catch (err) {
    console.error('subscriptions.hardDelete error:', err);
    res.status(500).json({ error: 'Server error' });
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
  deletesub
};
