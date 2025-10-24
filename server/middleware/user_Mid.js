const md5 = require('md5');

const cleanStr = (v) => (v ?? "").toString().trim();
const cleanPhone = (v) => (v ?? "").toString().replace(/\D/g, "").trim();
const normalizeDate = (dateStr) => {
  if (!dateStr || dateStr === 'null' || dateStr === 'undefined' || dateStr === '') {
    return null;
  }
  
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  const parts = String(dateStr).split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    const isoFormatted = `${year}-${month}-${day}`;
    const newDate = new Date(isoFormatted);
    if (!isNaN(newDate.getTime())) return isoFormatted;
  }
  
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  return null;
};

async function AddUser(req, res) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const { 
      username, phone, password, role, gender, birth_date, 
      weight, height, body_fat, muscle_mass, circumference, recorded_at, 
      start_date, end_date, payment_status = 'pending',
      access_profile = 'default', 
      permissions_json = null 
    } = req.body;

    const enc_pass = md5('A' + password);

    const normalizedBirthDate = normalizeDate(birth_date);
    const normalizedRecordedAt = normalizeDate(recorded_at);
    const normalizedStartDate = normalizeDate(start_date);
    const normalizedEndDate = normalizeDate(end_date);

    let finalPermissionsJson = null;
    if (access_profile === 'custom' && permissions_json) {
      const placeholders = permissions_json.map(() => '?').join(',');
      const [valid] = await conn.query(
        `SELECT perm_key FROM permissions_catalog WHERE perm_key IN (${placeholders})`,
        permissions_json
      );
      if (valid.length !== permissions_json.length) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Unknown permission key(s) provided' });
      }
      finalPermissionsJson = JSON.stringify(permissions_json);
    }

    const [userResult] = await conn.execute(
      `INSERT INTO users (username, phone, password, role, gender, birth_date, access_profile, permissions_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
      [username, phone, enc_pass, role, gender, normalizedBirthDate, access_profile, finalPermissionsJson]
    );

    const newUserId = userResult.insertId;
    if (!newUserId) {
      await conn.rollback();
      return res.status(500).json({ success: false, message: 'שגיאה ביצירת משתמש' });
    }

    const hasBody = [weight, height, body_fat, muscle_mass, circumference, normalizedRecordedAt].some(v => v !== undefined && v !== null);
    if (hasBody) {
      await conn.execute(
        `INSERT INTO bodydetails (user_id, weight, height, body_fat, muscle_mass, circumference, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newUserId, weight, height, body_fat, muscle_mass, circumference, normalizedRecordedAt]
      );
    }

    const wantsSub = [normalizedStartDate, normalizedEndDate].some(v => v !== undefined && v !== null);
    if (wantsSub) {
      await conn.execute(
        `INSERT INTO subscriptions (user_id, start_date, end_date, payment_status) VALUES (?, ?, ?, ?)`,
        [newUserId, normalizedStartDate, normalizedEndDate, payment_status]
      );
    }

    await conn.commit();
    return res.status(201).json({
      success: true,
      message: 'משתמש נוצר בהצלחה',
      userId: newUserId
    });
  } catch (err) {
    await conn.rollback();
    console.error('AddUser error:', err);
    return res.status(500).json({ success: false, message: 'שגיאה פנימית בשרת' });
  } finally {
    conn.release();
  }
}

async function GetAllUsers(req, res, next) {
  const promisePool = global.db_pool.promise();
  const page = parseInt(req.query.p) || 0;
  const rowPerPage = 10;

  try {
    const [countResult] = await promisePool.query('SELECT COUNT(id) AS cnt FROM users');
    const total_rows = countResult[0]?.cnt || 0;

    const offset = page * rowPerPage;
    const [data] = await promisePool.query(
      `SELECT id, username, phone, DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date, role, gender
       FROM users ORDER BY id DESC LIMIT ?, ?`,
      [offset, rowPerPage]
    );

    req.users_data = data;
    req.total_rows = total_rows;
    req.total_pages = Math.ceil(total_rows / rowPerPage);
    next();
  } catch (err) {
    return res.status(500).json({ error: 'DB error' });
  }
}

async function DeleteUser(req, res) {
  const id = req.params.id;

  const conn = await global.db_pool.promise().getConnection();
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
    return res.status(500).json({ success: false, error: 'שגיאת שרת' });
  } finally {
    conn.release();
  }
}

async function GetOneUser(req, res, next) {
  const id = req.params.id;

  try {
    const conn = global.db_pool.promise();
    const [rows] = await conn.query(
      `SELECT id, username, phone, DATE_FORMAT(birth_date, '%Y-%m-%d') AS birth_date, role, gender
       FROM users WHERE id = ?`,
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
        `SELECT id, weight, height, body_fat, muscle_mass, circumference, DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
         FROM bodydetails WHERE user_id = ? ORDER BY recorded_at DESC, id DESC LIMIT 1`,
        [id]
      );
      req.one_user_body = bodyRows[0] || null;

      const todayISO = new Date().toISOString().slice(0, 10);
      const [activeSub] = await conn.query(
        `SELECT id, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, payment_status
         FROM subscriptions WHERE user_id = ? AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)
         ORDER BY end_date ASC LIMIT 1`,
        [id, todayISO, todayISO]
      );
      
      let sub = activeSub[0] || null;
      if (!sub) {
        const [lastSub] = await conn.query(
          `SELECT id, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, payment_status
           FROM subscriptions WHERE user_id = ? ORDER BY (end_date IS NULL), end_date DESC, id DESC LIMIT 1`,
          [id]
        );
        sub = lastSub[0] || null;
      }
      req.one_user_subscription = sub;
    }

    return next();
  } catch (err) {
    req.one_user_error = { status: 500, message: 'שגיאת שרת' };
    return next();
  }
}

async function UpdateUser(req, res) {
  const id = req.params.id;
  const conn = await global.db_pool.promise().getConnection();

  try {
    await conn.beginTransaction();

    const userUpdates = [];
    const userValues = [];
    
    if (req.body.username !== undefined) { 
      userUpdates.push('username = ?'); 
      userValues.push(cleanStr(req.body.username)); 
    }
    if (req.body.phone !== undefined) { 
      userUpdates.push('phone = ?'); 
      userValues.push(cleanPhone(req.body.phone)); 
    }
    if (req.body.birth_date !== undefined) { 
      userUpdates.push('birth_date = ?'); 
      userValues.push(normalizeDate(req.body.birth_date)); 
    }
    
    if (req.body.role !== undefined) { 
      userUpdates.push('role = ?'); 
      userValues.push(req.body.role); 
      
      if (req.body.role === 'trainee') {
        userUpdates.push('access_profile = ?');
        userValues.push('default');
        userUpdates.push('permissions_json = NULL');
        
        console.log(`Clearing permissions for user ${id} - role changed to trainee`);
      }
    }
    
    if (req.body.gender !== undefined) { 
      userUpdates.push('gender = ?'); 
      userValues.push(req.body.gender); 
    }

    if (userUpdates.length > 0) {
      userValues.push(id);
      const [upd] = await conn.execute(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`, 
        userValues
      );
      if (upd.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: 'משתמש לא נמצא' });
      }
    }

    const bodyKeys = ['weight', 'height', 'body_fat', 'muscle_mass', 'circumference', 'recorded_at'];
    const bodyProvided = bodyKeys.some(k => k in req.body);
    if (bodyProvided) {
      const [latest] = await conn.query(
        `SELECT id FROM bodydetails WHERE user_id = ? ORDER BY recorded_at DESC, id DESC LIMIT 1`,
        [id]
      );

      if (latest.length > 0) {
        const bodyUpdates = [];
        const bodyValues = [];
        
        bodyKeys.forEach(k => {
          if (req.body[k] !== undefined) {
            bodyUpdates.push(`${k} = ?`);
            bodyValues.push(k === 'recorded_at' ? normalizeDate(req.body[k]) : req.body[k]);
          }
        });

        if (bodyUpdates.length > 0) {
          bodyValues.push(latest[0].id);
          await conn.execute(
            `UPDATE bodydetails SET ${bodyUpdates.join(', ')} WHERE id = ?`,
            bodyValues
          );
        }
      }
    }

    const subKeys = ['start_date', 'end_date', 'payment_status'];
    const subProvided = subKeys.some(k => k in req.body);
    if (subProvided) {
      const todayISO = new Date().toISOString().slice(0, 10);
      const [active] = await conn.query(
        `SELECT id FROM subscriptions WHERE user_id = ? AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)
         ORDER BY end_date ASC LIMIT 1`,
        [id, todayISO, todayISO]
      );

      let targetId = active[0]?.id;
      if (!targetId) {
        const [last] = await conn.query(
          `SELECT id FROM subscriptions WHERE user_id = ? ORDER BY (end_date IS NULL), end_date DESC, id DESC LIMIT 1`,
          [id]
        );
        targetId = last[0]?.id;
      }

      if (targetId) {
        const subUpdates = [];
        const subValues = [];
        
        subKeys.forEach(k => {
          if (req.body[k] !== undefined) {
            subUpdates.push(`${k} = ?`);
            subValues.push((k === 'start_date' || k === 'end_date') ? normalizeDate(req.body[k]) : req.body[k]);
          }
        });

        if (subUpdates.length > 0) {
          subValues.push(targetId);
          await conn.execute(
            `UPDATE subscriptions SET ${subUpdates.join(', ')} WHERE id = ?`,
            subValues
          );
        }
      }
    }

    await conn.commit();
    
    let message = 'משתמש עודכן בהצלחה';
    if (req.body.role === 'trainee') {
      message = 'משתמש עודכן למתאמן והרשאותיו נמחקו בהצלחה';
    }
    
    return res.json({ success: true, message, userId: id });
  } catch (err) {
    await conn.rollback();
    console.error('UpdateUser error:', err);
    return res.status(500).json({ success: false, message: 'שגיאת שרת: ' + err.message });
  } finally {
    conn.release();
  }
}

async function search(req, res) {
  try {
    const db = global.db_pool.promise();
    const q = cleanStr(req.query.q);
    if (q.length < 2) return res.json([]);

    const [rows] = await db.query(
      `SELECT id, username, phone FROM users WHERE username LIKE ? OR phone LIKE ? ORDER BY username ASC LIMIT 20`,
      [`%${q}%`, `%${q}%`]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
}

module.exports = {
  AddUser, 
  GetAllUsers, 
  GetOneUser, 
  DeleteUser, 
  search, 
  UpdateUser,
  normalizeDate
};