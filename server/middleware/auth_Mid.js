const md5 = require('md5');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('משתנה הסביבה JWT_SECRET נדרש');
}

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

async function signup(req, res) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const { phone_number, username, password, date_birth, gender } = req.body;

    const cleanPhone = phone_number.replace(/\D/g, '');
    const cleanUsername = username.trim();

    const [existingUsers] = await conn.query(
      'SELECT id FROM users WHERE phone = ?', 
      [cleanPhone]
    );

    if (existingUsers.length > 0) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: 'משתמש עם מספר טלפון זה כבר קיים'
      });
    }

    const enc_pass = md5('A' + password);
    const normalizedBirthDate = normalizeDate(date_birth);

    const [insertResults] = await conn.query(
      `INSERT INTO users (phone, username, password, birth_date, gender, role, access_profile) 
       VALUES (?, ?, ?, ?, ?, 'trainee', 'default')`,
      [cleanPhone, cleanUsername, enc_pass, normalizedBirthDate, gender || null]
    );

    const tokenPayload = {
      userId: insertResults.insertId,
      phone: cleanPhone,
      role: 'trainee'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'gym-app',
        subject: insertResults.insertId.toString()
      }
    );

    const userResponse = {
      id: insertResults.insertId,
      phone: cleanPhone,
      username: cleanUsername,
      role: 'trainee',
      birth_date: normalizedBirthDate,
      gender: gender || null,
      access_profile: 'default'
    };

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'החשבון נוצר בהצלחה',
      token,
      user: userResponse
    });

  } catch (error) {
    await conn.rollback();
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת. אנא נסה שוב מאוחר יותר.'
    });
  } finally {
    conn.release();
  }
}

async function signin(req, res) {
  try {
    const { phone_number, password } = req.body;

    const cleanPhone = phone_number.replace(/\D/g, '');
    const db = global.db_pool.promise();

    const [users] = await db.query(
      `SELECT id, phone, username, password, role, birth_date, gender, access_profile
       FROM users WHERE phone = ?`,
      [cleanPhone]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'מספר טלפון או סיסמה שגויים'
      });
    }

    const user = users[0];

    const enc_pass = md5('A' + password);
    if (enc_pass !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'מספר טלפון או סיסמה שגויים'
      });
    }

    const tokenPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role || 'trainee'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'gym-app',
        subject: user.id.toString()
      }
    );

    const userResponse = {
      id: user.id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      birth_date: user.birth_date,
      gender: user.gender,
      access_profile: user.access_profile
    };

    res.json({
      success: true,
      message: 'ההתחברות הצליחה',
      token,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת. אנא נסה שוב מאוחר יותר.'
    });
  }
}

function verifyToken(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'גישה נדחתה. לא סופק טוקן.'
    });
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET,
    );
    
    // ❗ מוסיפים alias ל-id לתאימות לאחור עם קוד ישן
    req.user = {
      userId: decoded.userId,
      id: decoded.userId,   // ← תאימות לאחור
      phone: decoded.phone,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'הטוקן פג'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'טוקן לא תקין'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'אימות הטוקן נכשל'
    });
  }
}

async function verify(req, res) {
  try {
    const db = global.db_pool.promise();
    
    const [users] = await db.query(
      `SELECT id, phone, username, role, birth_date, gender, access_profile
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    const user = users[0];
    const userResponse = {
      id: user.id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      birth_date: user.birth_date,
      gender: user.gender,
      access_profile: user.access_profile
    };

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת במהלך אימות הטוקן'
    });
  }
}

async function getProfile(req, res) {
  try {
    const db = global.db_pool.promise();
    
    const [users] = await db.query(
      `SELECT id, phone, username, role, birth_date, gender, access_profile
       FROM users WHERE id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }

    const user = users[0];
    const userResponse = {
      id: user.id,
      phone: user.phone,
      username: user.username,
      role: user.role,
      birth_date: user.birth_date,
      gender: user.gender,
      access_profile: user.access_profile
    };

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  }
}

async function updateProfile(req, res) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const { username, date_birth, gender } = req.body;
    const userId = req.user.userId;
    
    const updates = [];
    const values = [];
    
    if (username) {
      updates.push('username = ?');
      values.push(username.trim());
    }

    if (date_birth !== undefined) {
      updates.push('birth_date = ?');
      values.push(normalizeDate(date_birth));
    }
    
    if (gender) {
      updates.push('gender = ?');
      values.push(gender);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'אין שדות תקינים לעדכון'
      });
    }
    
    values.push(userId);
    
    const [result] = await conn.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }
    
    await conn.commit();
    
    res.json({
      success: true,
      message: 'הפרופיל עודכן בהצלחה'
    });
    
  } catch (error) {
    await conn.rollback();
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת'
    });
  } finally {
    conn.release();
  }
}

async function changePassword(req, res) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const userId = req.user && req.user.userId;
    if (!userId) {
      await conn.rollback();
      return res.status(401).json({ success: false, message: 'נדרשת התחברות' });
    }

    const { old_password, new_password } = req.body || {};

    if (!old_password || !new_password) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'סיסמה ישנה וסיסמה חדשה נדרשות' });
    }

    const [rows] = await conn.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const currentHash = rows[0].password;
    const checkHash = md5('A' + old_password);

    if (checkHash !== currentHash) {
      await conn.rollback();
      return res.status(401).json({ success: false, message: 'הסיסמה הישנה שגויה' });
    }

    const newHash = md5('A' + new_password);
    const [upd] = await conn.query('UPDATE users SET password = ? WHERE id = ?', [newHash, userId]);
    if (!upd.affectedRows) {
      await conn.rollback();
      return res.status(500).json({ success: false, message: 'לא ניתן לעדכן סיסמה' });
    }

    await conn.commit();
    return res.json({ success: true, message: 'הסיסמה עודכנה בהצלחה' });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: 'שגיאת שרת בעת שינוי סיסמה' });
  } finally {
    conn.release();
  }
}


module.exports = {
  signup,
  signin,
  verifyToken,
  getProfile,
  verify,
  updateProfile,
  changePassword
};
