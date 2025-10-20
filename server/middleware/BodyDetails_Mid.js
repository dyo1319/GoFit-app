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
      message: 'Database error occurred' 
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
      message: 'Database error occurred' 
    });
  }
}

async function createBodyDetail(req, res) {
  try {
    const db = global.db_pool.promise();
    const userId = req.user.userId;
    const { weight, height, body_fat, muscle_mass, circumference, recorded_at } = req.body;

    if (!recorded_at) {
      return res.status(400).json({ 
        success: false, 
        message: 'Record date is required' 
      });
    }

    if (!weight && !height && !body_fat && !muscle_mass && !circumference) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one body measurement is required' 
      });
    }

    const [checkResult] = await db.query(
      'SELECT id FROM bodydetails WHERE user_id = ? AND recorded_at = ?',
      [userId, normalizeDate(recorded_at)]
    );

    if (checkResult.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'A record already exists for this date. Please update the existing record instead.' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO bodydetails (user_id, weight, height, body_fat, muscle_mass, circumference, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
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
      message: 'Body details saved successfully',
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
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save body details' 
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
        message: 'At least one body measurement is required' 
      });
    }

    const [checkResult] = await db.query(
      'SELECT user_id FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (checkResult[0].user_id != userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
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
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.json({
      success: true,
      message: 'Body details updated successfully'
    });
  } catch (error) {
    console.error('bodyDetails.updateBodyDetail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update body details' 
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
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (checkResult[0].user_id != userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [deleteResult] = await db.query(
      'DELETE FROM bodydetails WHERE id = ?',
      [recordId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.json({
      success: true,
      message: 'Body details deleted successfully'
    });
  } catch (error) {
    console.error('bodyDetails.deleteBodyDetail error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete body details' 
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
        message: 'No body details found'
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
      message: 'Database error occurred' 
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
      message: 'Database error occurred' 
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
  getBodyStats
};