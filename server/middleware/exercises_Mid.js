const { normalizeDate } = require('./user_Mid');

async function getAllExercises(req, res, next) {
  try {
    const db = global.db_pool.promise();
    
    const [rows] = await db.query(`
      SELECT e.*, u.username as created_by_name 
      FROM exercises e 
      LEFT JOIN users u ON e.created_by = u.id 
      ORDER BY e.exercise_name
    `);
    
    req.exercises_data = rows;
    next();
  } catch (error) {
    console.error('exercises_Mid.getAllExercises error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch exercises' 
    });
  }
}

async function createExercise(req, res, next) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const { 
      exercise_name, 
      category, 
      description, 
      muscle_group, 
      difficulty, 
      equipment, 
      video_url 
    } = req.body;

    const [result] = await conn.execute(
      `INSERT INTO exercises 
       (exercise_name, category, description, muscle_group, difficulty, equipment, video_url, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exercise_name, 
        category, 
        description || null, 
        muscle_group || null, 
        difficulty || null, 
        equipment || null, 
        video_url || null, 
        req.user.userId
      ]
    );

    await conn.commit();
    
    req.created_exercise_id = result.insertId;
    next();
  } catch (error) {
    await conn.rollback();
    console.error('exercises_Mid.createExercise error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create exercise' 
    });
  } finally {
    conn.release();
  }
}

async function updateExercise(req, res, next) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const exerciseId = req.params.id;
    const { 
      exercise_name, 
      category, 
      description, 
      muscle_group, 
      difficulty, 
      equipment, 
      video_url 
    } = req.body;

    const updates = [];
    const values = [];

    if (exercise_name !== undefined) {
      updates.push('exercise_name = ?');
      values.push(exercise_name);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (muscle_group !== undefined) {
      updates.push('muscle_group = ?');
      values.push(muscle_group);
    }
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      values.push(difficulty);
    }
    if (equipment !== undefined) {
      updates.push('equipment = ?');
      values.push(equipment);
    }
    if (video_url !== undefined) {
      updates.push('video_url = ?');
      values.push(video_url);
    }

    if (updates.length === 0) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(exerciseId);

    const [result] = await conn.execute(
      `UPDATE exercises SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'התרגיל לא נמצא' 
      });
    }

    await conn.commit();
    next();
  } catch (error) {
    await conn.rollback();
    console.error('exercises_Mid.updateExercise error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update exercise' 
    });
  } finally {
    conn.release();
  }
}

async function deleteExercise(req, res, next) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const exerciseId = req.params.id;

    const [usedInPrograms] = await conn.execute(
      `SELECT COUNT(*) as usage_count 
       FROM trainingprogram_exercises 
       WHERE exercise_id = ?`,
      [exerciseId]
    );

    if (usedInPrograms[0].usage_count > 0) {
      await conn.rollback();
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete exercise - it is being used in training programs' 
      });
    }

    const [result] = await conn.execute(
      'DELETE FROM exercises WHERE id = ?',
      [exerciseId]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'התרגיל לא נמצא' 
      });
    }

    await conn.commit();
    next();
  } catch (error) {
    await conn.rollback();
    console.error('exercises_Mid.deleteExercise error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete exercise' 
    });
  } finally {
    conn.release();
  }
}

async function getExerciseById(req, res, next) {
  try {
    const db = global.db_pool.promise();
    const exerciseId = req.params.id;

    const [rows] = await db.query(`
      SELECT e.*, u.username as created_by_name 
      FROM exercises e 
      LEFT JOIN users u ON e.created_by = u.id 
      WHERE e.id = ?
    `, [exerciseId]);

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'התרגיל לא נמצא' 
      });
    }

    req.exercise_data = rows[0];
    next();
  } catch (error) {
    console.error('exercises_Mid.getExerciseById error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch exercise' 
    });
  }
}

module.exports = {
  getAllExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  getExerciseById
};