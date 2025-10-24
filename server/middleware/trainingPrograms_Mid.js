async function createTrainingProgram(req, res, next) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const { program_name, user_id, exercises } = req.body;

    const [programResult] = await conn.execute(
      `INSERT INTO trainingprogram (program_name, user_id, created_by) 
       VALUES (?, ?, ?)`,
      [program_name, user_id, req.user.userId]
    );

    const programId = programResult.insertId;

    if (exercises && exercises.length > 0) {
      for (const exercise of exercises) {
        await conn.execute(
          `INSERT INTO trainingprogram_exercises 
           (training_program_id, exercise_id, sets, reps, duration) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            programId,
            exercise.exercise_id,
            exercise.sets,
            exercise.reps,
            exercise.duration || 0
          ]
        );
      }
    }

    await conn.commit();
    req.created_program_id = programId;
    next();
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'יצירת תוכנית האימון נכשלה' 
    });
  } finally {
    conn.release();
  }
}

async function getUserTrainingPrograms(req, res, next) {
  try {
    const db = global.db_pool.promise();
    const userId = req.params.userId || req.user.userId;

    const [programs] = await db.query(`
      SELECT tp.*, u.username as created_by_name 
      FROM trainingprogram tp 
      LEFT JOIN users u ON tp.created_by = u.id 
      WHERE tp.user_id = ? 
      ORDER BY tp.created_at DESC
    `, [userId]);

    for (let program of programs) {
      const [exercises] = await db.query(`
        SELECT tpe.id as training_exercise_id, e.*, tpe.sets, tpe.reps, tpe.duration 
        FROM trainingprogram_exercises tpe 
        JOIN exercises e ON tpe.exercise_id = e.id 
        WHERE tpe.training_program_id = ?
        ORDER BY tpe.id
      `, [program.id]);
      
      program.exercises = exercises;
    }

    req.training_programs_data = programs;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'טעינת תוכניות האימון נכשלה' 
    });
  }
}

async function getAllTraineesWithPrograms(req, res, next) {
  try {
    const db = global.db_pool.promise();

    const [trainees] = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.phone, 
        u.birth_date, 
        u.gender,
        COUNT(tp.id) as program_count,
        MAX(tp.created_at) as latest_program_date
      FROM users u 
      LEFT JOIN trainingprogram tp ON u.id = tp.user_id 
      WHERE u.role = 'trainee'
      GROUP BY u.id
      ORDER BY u.username
    `);

    req.trainees_data = trainees;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'טעינת המתאמנים נכשלה' 
    });
  }
}

async function getTrainingProgramById(req, res, next) {
  try {
    const db = global.db_pool.promise();
    const programId = req.params.id;

    const [programs] = await db.query(`
      SELECT tp.*, u.username as created_by_name, trainee.username as trainee_name
      FROM trainingprogram tp 
      LEFT JOIN users u ON tp.created_by = u.id 
      LEFT JOIN users trainee ON tp.user_id = trainee.id 
      WHERE tp.id = ?
    `, [programId]);

    if (programs.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'תוכנית האימון לא נמצאה' 
      });
    }

    const program = programs[0];

    const [exercises] = await db.query(`
      SELECT e.*, tpe.sets, tpe.reps, tpe.duration 
      FROM trainingprogram_exercises tpe 
      JOIN exercises e ON tpe.exercise_id = e.id 
      WHERE tpe.training_program_id = ?
      ORDER BY tpe.training_program_id
    `, [programId]);

    program.exercises = exercises;
    req.training_program_data = program;
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'טעינת תוכנית האימון נכשלה' 
    });
  }
}

async function deleteTrainingProgram(req, res, next) {
  const conn = await global.db_pool.promise().getConnection();
  try {
    await conn.beginTransaction();

    const programId = req.params.id;

    await conn.execute(
      'DELETE FROM trainingprogram_exercises WHERE training_program_id = ?',
      [programId]
    );

    const [result] = await conn.execute(
      'DELETE FROM trainingprogram WHERE id = ?',
      [programId]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ 
        success: false, 
        message: 'תוכנית האימון לא נמצאה' 
      });
    }

    await conn.commit();
    next();
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'מחיקת תוכנית האימון נכשלה' 
    });
  } finally {
    conn.release();
  }
}

async function addExerciseToProgram(req, res, next) {
  try {
    const programId = req.params.id;
    const { exercise_id, sets, reps, duration } = req.body;

    const db = global.db_pool.promise();
    
    const [programs] = await db.query('SELECT id FROM trainingprogram WHERE id = ?', [programId]);
    if (programs.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'תוכנית האימון לא נמצאה' 
      });
    }

    const [existingExercises] = await db.query(
      'SELECT id FROM trainingprogram_exercises WHERE training_program_id = ? AND exercise_id = ?',
      [programId, exercise_id]
    );
    
    if (existingExercises.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Exercise already exists in this training program' 
      });
    }

    const safeParams = {
      exercise_id: exercise_id || null,
      sets: sets || null,
      reps: reps || null,
      duration: duration || 0
    };
    await db.execute(
      `INSERT INTO trainingprogram_exercises 
       (training_program_id, exercise_id, sets, reps, duration) 
       VALUES (?, ?, ?, ?, ?)`,
      [programId, safeParams.exercise_id, safeParams.sets, safeParams.reps, safeParams.duration]
    );

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'הוספת התרגיל לתוכנית נכשלה' 
    });
  }
}

async function updateExerciseInProgram(req, res, next) {
  try {
    const trainingExerciseId = req.params.exerciseId;
    const { sets, reps, duration } = req.body;

    const db = global.db_pool.promise();
    
    const [existingExercises] = await db.query(
      'SELECT * FROM trainingprogram_exercises WHERE id = ?',
      [trainingExerciseId]
    );

    if (existingExercises.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'התרגיל לא נמצא בתוכנית' 
      });
    }

    const safeParams = {
      sets: sets || null,
      reps: reps || null,
      duration: duration || 0,
      trainingExerciseId: trainingExerciseId
    };
    const [result] = await db.execute(
      `UPDATE trainingprogram_exercises 
       SET sets = ?, reps = ?, duration = ?
       WHERE id = ?`,
      [
        safeParams.sets, 
        safeParams.reps, 
        safeParams.duration, 
        safeParams.trainingExerciseId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'התרגיל לא נמצא בתוכנית' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'עדכון התרגיל בתוכנית נכשל' 
    });
  }
}

async function deleteExerciseFromProgram(req, res, next) {
  try {
    const trainingExerciseId = req.params.exerciseId;

    const db = global.db_pool.promise();
    const [result] = await db.execute(
      'DELETE FROM trainingprogram_exercises WHERE id = ?',
      [trainingExerciseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'התרגיל לא נמצא בתוכנית' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'מחיקת התרגיל מהתוכנית נכשלה' 
    });
  }
}

module.exports = {
  createTrainingProgram,
  getUserTrainingPrograms,
  getAllTraineesWithPrograms,
  getTrainingProgramById,
  deleteTrainingProgram,
  addExerciseToProgram,
  updateExerciseInProgram,
  deleteExerciseFromProgram
};