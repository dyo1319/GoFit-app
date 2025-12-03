const { normalizeDate } = require('./user_Mid'); 

async function getUserBodyDetails(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [rows] = await db.query(
      `SELECT id, user_id, weight, height, body_fat, muscle_mass, circumference, 
              DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
       FROM bodydetails 
       WHERE user_id = ? 
       ORDER BY recorded_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('bodyDetails.getUserBodyDetails error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במסד הנתונים' 
    });
  }
}

async function getRecentBodyDetails(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [rows] = await db.query(
      `SELECT id, user_id, weight, height, body_fat, muscle_mass, circumference, 
              DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
       FROM bodydetails 
       WHERE user_id = ? 
       AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY recorded_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('bodyDetails.getRecentBodyDetails error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במסד הנתונים' 
    });
  }
}

async function createBodyDetail(req, res) {
  try {
    console.log('createBodyDetail - req.body:', req.body);
    console.log('createBodyDetail - req.user:', req.user);
    console.log('createBodyDetail - userId from req.user.userId:', req.user.userId);
    console.log('createBodyDetail - userId from req.user.id:', req.user.id);
    
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { weight, height, body_fat, muscle_mass, circumference, recorded_at } = req.body;

    if (!recorded_at) {
      return res.status(400).json({ 
        success: false, 
        message: 'תאריך הרשומה נדרש' 
      });
    }

    if (!weight && !height && !body_fat && !muscle_mass && !circumference) {
      return res.status(400).json({ 
        success: false, 
        message: 'נדרש לפחות מדד גוף אחד' 
      });
    }

    const [checkResult] = await db.query(
      'SELECT id FROM bodydetails WHERE user_id = ? AND recorded_at = ?',
      [userId, normalizeDate(recorded_at)]
    );

    if (checkResult.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'קיימת כבר רשומה עבור תאריך זה. אנא עדכן את הרשומה הקיימת במקום זאת.' 
      });
    }

    const insertValues = [
      userId,
      weight || null,
      height || null, 
      body_fat || null,
      muscle_mass || null,
      circumference || null,
      normalizeDate(recorded_at)
    ];
    
    console.log('Insert values:', insertValues);
    console.log('Normalized date:', normalizeDate(recorded_at));
    console.log('About to execute database query...');
    
    const [result] = await db.query(
      `INSERT INTO bodydetails (user_id, weight, height, body_fat, muscle_mass, circumference, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      insertValues
    );
    
    console.log('Database query executed successfully. Result:', result);

    res.status(201).json({
      success: true,
      message: 'מדדי הגוף נשמרו בהצלחה',
      data: {
        id: result.insertId,
        user_id: userId,
        weight,
        height,
        body_fat,
        muscle_mass,
        circumference,
        recorded_at: normalizeDate(recorded_at)
      }
    });
  } catch (error) {
    console.error('bodyDetails.createBodyDetail error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשמירת מדדי הגוף' 
    });
  }
}

async function updateBodyDetail(req, res) {
  try {
    const db = global.db_pool.promise();
    const recordId = req.params.id;
    const userId = req.user.userId;
    const { weight, height, body_fat, muscle_mass, circumference, recorded_at } = req.body;

    if (!weight && !height && !body_fat && !muscle_mass && !circumference) {
      return res.status(400).json({ 
        success: false, 
        message: 'נדרש לפחות מדד גוף אחד' 
      });
    }

    const [checkResult] = await db.query(
      'SELECT user_id FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    if (checkResult[0].user_id != userId) {
      return res.status(403).json({ success: false, message: 'אין הרשאה לגשת' });
    }

    const [updateResult] = await db.query(
      `UPDATE bodydetails 
       SET weight = ?, height = ?, body_fat = ?, muscle_mass = ?, circumference = ?, recorded_at = ?
       WHERE id = ?`,
      [
        weight || null,
        height || null,
        body_fat || null,
        muscle_mass || null,
        circumference || null,
        normalizeDate(recorded_at),
        recordId
      ]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    res.json({
      success: true,
      message: 'מדדי הגוף עודכנו בהצלחה'
    });
  } catch (error) {
    console.error('bodyDetails.updateBodyDetail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בעדכון מדדי הגוף' 
    });
  }
}

async function deleteBodyDetail(req, res) {
  try {
    const db = global.db_pool.promise();
    const recordId = req.params.id;
    const userId = req.user.userId;

    const [checkResult] = await db.query(
      'SELECT user_id FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    if (checkResult[0].user_id != userId) {
      return res.status(403).json({ success: false, message: 'אין הרשאה לגשת' });
    }

    const [deleteResult] = await db.query(
      'DELETE FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    res.json({
      success: true,
      message: 'מדדי הגוף נמחקו בהצלחה'
    });
  } catch (error) {
    console.error('bodyDetails.deleteBodyDetail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במחיקת מדדי הגוף' 
    });
  }
}

async function getLatestBodyDetail(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [rows] = await db.query(
      `SELECT id, user_id, weight, height, body_fat, muscle_mass, circumference, 
              DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
       FROM bodydetails 
       WHERE user_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'לא נמצאו מדדי גוף'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('bodyDetails.getLatestBodyDetail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במסד הנתונים' 
    });
  }
}

async function getUserBodyDetailsByAdmin(req, res) {
  try {
    const db = global.db_pool.promise();
    const targetUserId = req.params.userId;
    const adminUserId = req.user.userId;

    // Verify that the requester is admin or trainer
    const [userRows] = await db.query(
      `SELECT role FROM users WHERE id = ?`,
      [adminUserId]
    );

    if (!userRows.length || (userRows[0].role !== 'admin' && userRows[0].role !== 'trainer')) {
      return res.status(403).json({
        success: false,
        message: 'אין הרשאה לצפות במדדי גוף של משתמשים אחרים'
      });
    }

    const [rows] = await db.query(
      `SELECT id, user_id, weight, height, body_fat, muscle_mass, circumference, 
              DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
       FROM bodydetails 
       WHERE user_id = ? 
       ORDER BY recorded_at DESC`,
      [targetUserId]
    );

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('bodyDetails.getUserBodyDetailsByAdmin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במסד הנתונים' 
    });
  }
}

async function getBodyStats(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;

    const [latestResult] = await db.query(
      `SELECT weight, height, body_fat, muscle_mass, circumference, 
              DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
       FROM bodydetails 
       WHERE user_id = ? 
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [userId]
    );

    const [oldResult] = await db.query(
      `SELECT weight, height, body_fat, muscle_mass, circumference, 
              DATE_FORMAT(recorded_at, '%Y-%m-%d') AS recorded_at
       FROM bodydetails 
       WHERE user_id = ? 
       AND recorded_at <= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY recorded_at DESC 
       LIMIT 1`,
      [userId]
    );

    const latest = latestResult.length > 0 ? latestResult[0] : null;
    const old = oldResult.length > 0 ? oldResult[0] : null;

    const stats = {
      latest: latest,
      old: old,
      changes: {}
    };

    if (latest && old) {
      stats.changes = {
        weight: latest.weight && old.weight ? (latest.weight - old.weight).toFixed(1) : null,
        body_fat: latest.body_fat && old.body_fat ? (latest.body_fat - old.body_fat).toFixed(1) : null,
        muscle_mass: latest.muscle_mass && old.muscle_mass ? (latest.muscle_mass - old.muscle_mass).toFixed(1) : null,
        circumference: latest.circumference && old.circumference ? (latest.circumference - old.circumference).toFixed(1) : null
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('bodyDetails.getBodyStats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במסד הנתונים' 
    });
  }
}

async function createBodyDetailForUser(req, res) {
  try {
    const db = global.db_pool.promise();
    const targetUserId = req.params.userId;
    const adminUserId = req.user.userId;
    const { weight, height, body_fat, muscle_mass, circumference, recorded_at } = req.body;

    // Verify that the requester is admin or trainer
    const [userRows] = await db.query(
      `SELECT role FROM users WHERE id = ?`,
      [adminUserId]
    );

    if (!userRows.length || (userRows[0].role !== 'admin' && userRows[0].role !== 'trainer')) {
      return res.status(403).json({
        success: false,
        message: 'אין הרשאה להוסיף מדדי גוף למשתמשים אחרים'
      });
    }

    if (!recorded_at) {
      return res.status(400).json({ 
        success: false, 
        message: 'תאריך הרשומה נדרש' 
      });
    }

    if (!weight && !height && !body_fat && !muscle_mass && !circumference) {
      return res.status(400).json({ 
        success: false, 
        message: 'נדרש לפחות מדד גוף אחד' 
      });
    }

    const [checkResult] = await db.query(
      'SELECT id FROM bodydetails WHERE user_id = ? AND recorded_at = ?',
      [targetUserId, normalizeDate(recorded_at)]
    );

    if (checkResult.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'קיימת כבר רשומה עבור תאריך זה. אנא עדכן את הרשומה הקיימת במקום זאת.' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO bodydetails (user_id, weight, height, body_fat, muscle_mass, circumference, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        targetUserId,
        weight || null,
        height || null, 
        body_fat || null,
        muscle_mass || null,
        circumference || null,
        normalizeDate(recorded_at)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'מדדי הגוף נשמרו בהצלחה',
      data: {
        id: result.insertId,
        user_id: targetUserId,
        weight,
        height,
        body_fat,
        muscle_mass,
        circumference,
        recorded_at: normalizeDate(recorded_at)
      }
    });
  } catch (error) {
    console.error('bodyDetails.createBodyDetailForUser error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בשמירת מדדי הגוף' 
    });
  }
}

async function updateBodyDetailForUser(req, res) {
  try {
    const db = global.db_pool.promise();
    const recordId = req.params.id;
    const adminUserId = req.user.userId;
    const { weight, height, body_fat, muscle_mass, circumference, recorded_at } = req.body;

    // Verify that the requester is admin or trainer
    const [userRows] = await db.query(
      `SELECT role FROM users WHERE id = ?`,
      [adminUserId]
    );

    if (!userRows.length || (userRows[0].role !== 'admin' && userRows[0].role !== 'trainer')) {
      return res.status(403).json({
        success: false,
        message: 'אין הרשאה לערוך מדדי גוף של משתמשים אחרים'
      });
    }

    if (!weight && !height && !body_fat && !muscle_mass && !circumference) {
      return res.status(400).json({ 
        success: false, 
        message: 'נדרש לפחות מדד גוף אחד' 
      });
    }

    const [checkResult] = await db.query(
      'SELECT user_id FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    const [updateResult] = await db.query(
      `UPDATE bodydetails 
       SET weight = ?, height = ?, body_fat = ?, muscle_mass = ?, circumference = ?, recorded_at = ?
       WHERE id = ?`,
      [
        weight || null,
        height || null,
        body_fat || null,
        muscle_mass || null,
        circumference || null,
        normalizeDate(recorded_at),
        recordId
      ]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    res.json({
      success: true,
      message: 'מדדי הגוף עודכנו בהצלחה'
    });
  } catch (error) {
    console.error('bodyDetails.updateBodyDetailForUser error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בעדכון מדדי הגוף' 
    });
  }
}

async function deleteBodyDetailForUser(req, res) {
  try {
    const db = global.db_pool.promise();
    const recordId = req.params.id;
    const adminUserId = req.user.userId;

    // Verify that the requester is admin or trainer
    const [userRows] = await db.query(
      `SELECT role FROM users WHERE id = ?`,
      [adminUserId]
    );

    if (!userRows.length || (userRows[0].role !== 'admin' && userRows[0].role !== 'trainer')) {
      return res.status(403).json({
        success: false,
        message: 'אין הרשאה למחוק מדדי גוף של משתמשים אחרים'
      });
    }

    const [checkResult] = await db.query(
      'SELECT user_id FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    const [deleteResult] = await db.query(
      'DELETE FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'הרשומה לא נמצאה' });
    }

    res.json({
      success: true,
      message: 'מדדי הגוף נמחקו בהצלחה'
    });
  } catch (error) {
    console.error('bodyDetails.deleteBodyDetailForUser error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במחיקת מדדי הגוף' 
    });
  }
}

module.exports = {
  getUserBodyDetails,
  getRecentBodyDetails,
  createBodyDetail,
  updateBodyDetail,
  deleteBodyDetail,
  getLatestBodyDetail,
  getBodyStats,
  getUserBodyDetailsByAdmin,
  createBodyDetailForUser,
  updateBodyDetailForUser,
  deleteBodyDetailForUser
};