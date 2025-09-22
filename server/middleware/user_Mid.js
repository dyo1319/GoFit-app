const md5 = require('md5');
const toStr = (v) => (typeof v === 'string' ? v : '');


const normalizeDate = (dateStr) => {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined' || dateStr === '') {
    return null;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const parts = String(dateStr).split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      const isoFormatted = `${year}-${month}-${day}`;
      const newDate = new Date(isoFormatted);
      if (!isNaN(newDate.getTime())) return isoFormatted;
    }
    return null;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

async function AddUser(req, res, next) {
  const promisePool = db_pool.promise();
  const conn = await promisePool.getConnection();
  
  try {
    await conn.beginTransaction();
    const username = (req.body.username !== undefined) ? addSlashes(req.body.username) : "";
    const phone    = (req.body.phone    !== undefined) ? addSlashes(req.body.phone)    : "";
    const password = (req.body.password !== undefined) ?            req.body.password   : "";
    const role     = (req.body.role     !== undefined) ? addSlashes(req.body.role)     : null;
    const gender   = (req.body.gender   !== undefined) ? addSlashes(req.body.gender)   : null;
    const birthISO = normalizeDate(req.body.birth_date);

    if (!username || !phone || !password || !birthISO) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'שם משתמש / טלפון / סיסמה / תאריך לידה — חובה ותאריך חייב להיות תקין' 
      });
    }
    
    if (role && !['trainee','trainer','admin'].includes(role)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'role לא חוקי' });
    }
    
    if (gender && !['male','female'].includes(gender)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'gender לא חוקי' });
    }

    const enc_pass = md5('A' + password);
    const [userResult] = await conn.execute(
      `INSERT INTO users (username, phone, password, role, gender, birth_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, phone, enc_pass, role, gender, birthISO]
    );

    const newUserId = userResult.insertId;
    if (!newUserId) {
      await conn.rollback();
      return res.status(500).json({ success: false, message: 'שגיאה ביצירת משתמש' });
    }

    const weight        = req.body.weight ? Number(req.body.weight) : null;
    const height        = req.body.height ? Number(req.body.height) : null;
    const body_fat      = req.body.body_fat ? Number(req.body.body_fat) : null;
    const muscle_mass   = req.body.muscle_mass ? Number(req.body.muscle_mass) : null;
    const circumference = req.body.circumference ? Number(req.body.circumference) : null;
    const recordedISO   = normalizeDate(req.body.recorded_at);

    const hasBody = weight || height || body_fat || muscle_mass || circumference || recordedISO;

    if (hasBody) {
      await conn.execute(
        `INSERT INTO bodydetails
         (user_id, weight, height, body_fat, muscle_mass, circumference, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newUserId, weight, height, body_fat, muscle_mass, circumference, recordedISO]
      );
    }

    const startISO = normalizeDate(req.body.start_date);
    const endISO   = normalizeDate(req.body.end_date);
    const payStat  = req.body.payment_status ? addSlashes(req.body.payment_status) : null;

    const hasSub = (startISO !== null || endISO !== null || payStat !== null);

    if (hasSub) {
      await conn.execute(
        `INSERT INTO subscriptions
         (user_id, start_date, end_date, payment_status)
         VALUES (?, ?, ?, ?)`,
        [newUserId, startISO, endISO, payStat]
      );
    }

    await conn.commit();
    
    return res.status(201).json({ 
      success: true, 
      message: 'משתמש נוצר בהצלחה',
      userId: newUserId
    });

  } catch (err) {
    console.error('Error in AddUser:', err);
    await conn.rollback();
    return res.status(500).json({ 
      success: false, 
      message: 'שגיאה פנימית בשרת' 
    });
  } finally {
    conn.release();
  }
}

async function GetAllUsers(req, res, next) {
  const promisePool = db_pool.promise(); 
  let page = 0;
  const rowPerPage = 10;

  if (req.query.p !== undefined) page = parseInt(req.query.p) || 0;
  req.page = page;

  let total_rows = 0;

  try {
    const [countResult] = await promisePool.query('SELECT COUNT(id) AS cnt FROM users');
    total_rows = countResult[0]?.cnt || 0;
  } catch (err) {
    console.error('Count error:', err);
    return res.status(500).json({ error: 'DB error (count)' });
  }

  req.total_rows  = total_rows;
  req.total_pages = Math.ceil(total_rows / rowPerPage);

  try {
    const offset = page * rowPerPage;
    const [data] = await promisePool.query(
      `SELECT 
         id,
         username,
         phone,
         DATE_FORMAT(birth_date, '%d-%m-%Y') AS birth_date,
         role,
         gender
       FROM users
       ORDER BY id DESC
       LIMIT ?, ?`,
      [offset, rowPerPage]
    );
    req.users_data = data;
    next();
  } catch (err) {
    console.error('Select error:', err);
    return res.status(500).json({ error: 'DB error (select)' });
  }
}

async function DeleteUser(req, res) {
  const id = Number(req.params.id || req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'id לא חוקי' });
  }

  const conn = await db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();
    
    await conn.query('DELETE FROM bodydetails WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM subscriptions WHERE user_id = ?', [id]);
    
    const [result] = await conn.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'לא נמצא משתמש למחיקה' });
    }

    await conn.commit();
    return res.json({ success: true, deletedId: id });
  } catch (err) {
    await conn.rollback();
    console.error('DeleteUser error:', err);
    return res.status(500).json({ success: false, error: 'שגיאת שרת' });
  } finally {
    conn.release();
  }
}

async function GetOneUser(req, res, next) {
  const id = Number(req.params.id || req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    req.one_user_error = { status: 400, message: 'id לא חוקי' };
    return next();
  }

  const conn = db_pool.promise();

  try {
    const [rows] = await conn.query(
      `SELECT 
         id, username, phone,
         DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date,
         role, gender
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      req.one_user_error = { status: 404, message: 'משתמש לא נמצא' };
      req.one_user_data = null;
      return next();
    }

    req.one_user_data = rows[0];

    const expand = String(req.query.expand || '0') === '1';
    if (expand) {
      const [bodyRows] = await conn.query(
        `SELECT id, weight, height, body_fat, muscle_mass, circumference,
                DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
         FROM bodydetails
         WHERE user_id = ?
         ORDER BY recorded_at DESC, id DESC
         LIMIT 1`,
        [id]
      );
      req.one_user_body = bodyRows[0] || null;

      const todayISO = new Date().toISOString().slice(0, 10);
      const [activeSub] = await conn.query(
        `SELECT id,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date,   '%Y-%m-%d') AS end_date,
                payment_status
         FROM subscriptions
         WHERE user_id = ?
           AND (start_date IS NULL OR start_date <= ?)
           AND (end_date   IS NULL OR end_date   >= ?)
         ORDER BY end_date ASC
         LIMIT 1`,
        [id, todayISO, todayISO]
      );
      let sub = activeSub[0] || null;
      if (!sub) {
        const [lastSub] = await conn.query(
          `SELECT id,
                  DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                  DATE_FORMAT(end_date,   '%Y-%m-%d') AS end_date,
                  payment_status
           FROM subscriptions
           WHERE user_id = ?
           ORDER BY (end_date IS NULL), end_date DESC, id DESC
           LIMIT 1`,
          [id]
        );
        sub = lastSub[0] || null;
      }
      req.one_user_subscription = sub;
    }

    return next();
  } catch (err) {
    console.error('GetOneUser middleware error:', err);
    req.one_user_error = { status: 500, message: 'שגיאת שרת' };
    return next();
  }
}

async function UpdateUser(req, res, next) {
  const id = Number(req.params.id || req.query.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'id לא חוקי' });
  }

  const promisePool = db_pool.promise();
  const conn = await promisePool.getConnection();

  try {
    await conn.beginTransaction();

    const fields = {};
    if (req.body.username !== undefined) fields.username = addSlashes(String(req.body.username).trim());
    if (req.body.phone    !== undefined) fields.phone    = addSlashes(String(req.body.phone).trim());
    if (req.body.birth_date !== undefined) {
      const birthISO = normalizeDate(req.body.birth_date);
      if (req.body.birth_date && !birthISO) {
        await conn.rollback(); 
        conn.release();
        return res.status(400).json({ success:false, message:'birth_date לא תקין (YYYY-MM-DD)' });
      }
      fields.birth_date = birthISO;
    }
    if (req.body.role !== undefined) {
      const role = req.body.role ? addSlashes(String(req.body.role).trim()) : null;
      if (role && !['trainee','trainer','admin'].includes(role)) {
        await conn.rollback(); 
        conn.release();
        return res.status(400).json({ success:false, message:'role לא חוקי' });
      }
      fields.role = role;
    }
    if (req.body.gender !== undefined) {
      const gender = req.body.gender ? addSlashes(String(req.body.gender).trim()) : null;
      if (gender && !['male','female'].includes(gender)) {
        await conn.rollback(); 
        conn.release();
        return res.status(400).json({ success:false, message:'gender לא חוקי' });
      }
      fields.gender = gender;
    }

    if (Object.keys(fields).length > 0) {
      const setParts = [];
      const values = [];
      for (const [k, v] of Object.entries(fields)) {
        setParts.push(`${k} = ?`);
        values.push(v);
      }
      values.push(id);
      const sql = `UPDATE users SET ${setParts.join(', ')} WHERE id = ?`;
      const [upd] = await conn.execute(sql, values);
      if (upd.affectedRows === 0) {
        await conn.rollback(); 
        conn.release();
        return res.status(404).json({ success:false, message:'משתמש לא נמצא' });
      }
    } else {
      const [chk] = await conn.query(`SELECT id FROM users WHERE id = ?`, [id]);
      if (chk.length === 0) {
        await conn.rollback(); 
        conn.release();
        return res.status(404).json({ success:false, message:'משתמש לא נמצא' });
      }
    }

    const bodyKeys = ['weight','height','body_fat','muscle_mass','circumference','recorded_at'];
    const bodyProvided = bodyKeys.some(k => k in req.body);
    if (bodyProvided) {
      const [latest] = await conn.query(
        `SELECT id FROM bodydetails
         WHERE user_id = ?
         ORDER BY recorded_at DESC, id DESC
         LIMIT 1`,
        [id]
      );
      if (latest.length > 0) {
        const bodyFields = {};
        if (req.body.weight        !== undefined) bodyFields.weight        = (req.body.weight === null || req.body.weight === '') ? null : Number(req.body.weight);
        if (req.body.height        !== undefined) bodyFields.height        = (req.body.height === null || req.body.height === '') ? null : Number(req.body.height);
        if (req.body.body_fat      !== undefined) bodyFields.body_fat      = (req.body.body_fat === null || req.body.body_fat === '') ? null : Number(req.body.body_fat);
        if (req.body.muscle_mass   !== undefined) bodyFields.muscle_mass   = (req.body.muscle_mass === null || req.body.muscle_mass === '') ? null : Number(req.body.muscle_mass);
        if (req.body.circumference !== undefined) bodyFields.circumference = (req.body.circumference === null || req.body.circumference === '') ? null : Number(req.body.circumference);
        if (req.body.recorded_at   !== undefined) {
          const rISO = (req.body.recorded_at === null || req.body.recorded_at === '') 
            ? null 
            : normalizeDate(req.body.recorded_at);
          if (req.body.recorded_at && !rISO) {
            await conn.rollback(); 
            conn.release();
            return res.status(400).json({ success:false, message:'recorded_at לא תקין (YYYY-MM-DD)' });
          }
          bodyFields.recorded_at = rISO;
        }

        if (Object.keys(bodyFields).length > 0) {
          const parts = [];
          const vals  = [];
          for (const [k, v] of Object.entries(bodyFields)) {
            parts.push(`${k} = ?`);
            vals.push(v);
          }
          vals.push(latest[0].id);
          await conn.execute(
            `UPDATE bodydetails SET ${parts.join(', ')} WHERE id = ?`,
            vals
          );
        }
      }
    }

    const subKeys = ['start_date','end_date','payment_status'];
    const subProvided = subKeys.some(k => k in req.body);
    if (subProvided) {
      const todayISO = new Date().toISOString().slice(0,10);
      const [active] = await conn.query(
        `SELECT id
         FROM subscriptions
         WHERE user_id = ?
           AND (start_date IS NULL OR start_date <= ?)
           AND (end_date   IS NULL OR end_date   >= ?)
         ORDER BY end_date ASC
         LIMIT 1`,
        [id, todayISO, todayISO]
      );
      let targetId = active[0]?.id;
      if (!targetId) {
        const [last] = await conn.query(
          `SELECT id
           FROM subscriptions
           WHERE user_id = ?
           ORDER BY (end_date IS NULL), end_date DESC, id DESC
           LIMIT 1`,
          [id]
        );
        targetId = last[0]?.id;
      }

      if (targetId) {
        const sFields = {};
        if (req.body.start_date !== undefined) {
          const sISO = (req.body.start_date === null || req.body.start_date === '') 
            ? null 
            : normalizeDate(req.body.start_date);
          if (req.body.start_date && !sISO) {
            await conn.rollback(); 
            conn.release();
            return res.status(400).json({ success:false, message:'start_date לא תקין (YYYY-MM-DD)' });
          }
          sFields.start_date = sISO;
        }
        if (req.body.end_date !== undefined) {
          const eISO = (req.body.end_date === null || req.body.end_date === '') 
            ? null 
            : normalizeDate(req.body.end_date);
          if (req.body.end_date && !eISO) {
            await conn.rollback(); 
            conn.release();
            return res.status(400).json({ success:false, message:'end_date לא תקין (YYYY-MM-DD)' });
          }
          sFields.end_date = eISO;
        }
        if (req.body.payment_status !== undefined) {
          sFields.payment_status = req.body.payment_status ? addSlashes(String(req.body.payment_status).trim()) : null;
        }

        if (Object.keys(sFields).length > 0) {
          const parts = [];
          const vals  = [];
          for (const [k, v] of Object.entries(sFields)) {
            parts.push(`${k} = ?`);
            vals.push(v);
          }
          vals.push(targetId);
          await conn.execute(
            `UPDATE subscriptions SET ${parts.join(', ')} WHERE id = ?`,
            vals
          );
        }
      }
    }

    await conn.commit();
    conn.release();

    return res.json({ 
      success: true, 
      message: 'משתמש עודכן בהצלחה',
      userId: id
    });

  } catch (err) {
    console.error('UpdateUser error details:', err.message, err.stack);
    console.error('Request body:', req.body);
    await conn.rollback();
    conn.release();
    return res.status(500).json({ 
      success: false, 
      message: 'שגיאת שרת: ' + err.message 
    });
  }
}

async function search(req, res) {
  try {
    const db = global.db_pool.promise();
    const q = toStr(req.query.q).trim();
    if (q.length < 2) return res.json([]); 

    const [rows] = await db.query(
      `
      SELECT id, username, phone
      FROM users
      WHERE username LIKE ? OR phone LIKE ?
      ORDER BY username ASC
      LIMIT 20
      `,
      [`%${q}%`, `%${q}%`]
    );

    res.json(rows);
  } catch (err) {
    console.error('users.search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { 
  AddUser,
  GetAllUsers,
  GetOneUser,
  DeleteUser,
  search,
  UpdateUser
};