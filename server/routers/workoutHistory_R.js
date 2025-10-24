const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth_Mid');

router.get('/user/workout-history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    
    const db = global.db_pool.promise();
    
    const query = `
      SELECT 
        wh.*,
        tp.program_name as tp_program_name
      FROM workout_history wh
      LEFT JOIN trainingprogram tp ON wh.program_id = tp.id
      WHERE wh.user_id = ?
      ORDER BY wh.start_time DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(query, [userId, limit, offset]);
    
    const workoutHistory = rows.map(row => {
      let completedExercises = [];
      try {
        const exercisesData = row.completed_exercises;
        if (exercisesData) {
          if (typeof exercisesData === 'string') {
            completedExercises = JSON.parse(exercisesData);
          } else if (Array.isArray(exercisesData)) {
            completedExercises = exercisesData;
          } else {
            console.log('Unexpected completed_exercises format:', typeof exercisesData, exercisesData);
            completedExercises = [];
          }
        }
      } catch (e) {
        console.error('Error parsing completed_exercises:', e);
        console.error('Raw data:', row.completed_exercises);
        console.error('Data type:', typeof row.completed_exercises);
        completedExercises = [];
      }
      
      return {
        ...row,
        completed_exercises: completedExercises,
        program_name: row.program_name || row.tp_program_name || 'Unknown Program'
      };
    });
    
    
    res.json({
      success: true,
      data: workoutHistory
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת היסטוריית האימונים',
      error: error.message
    });
  }
});

router.post('/user/workout-history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      program_id,
      program_name,
      start_time,
      end_time,
      completed_exercises,
      total_exercises
    } = req.body;
    
    
    const db = global.db_pool.promise();
    
    const start = new Date(start_time);
    const end = new Date(end_time);
    const duration_minutes = Math.round((end - start) / (1000 * 60));
    
    const formatDateTime = (date) => {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    };
    
    const query = `
      INSERT INTO workout_history 
      (user_id, program_id, program_name, start_time, end_time, completed_exercises, total_exercises, duration_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      userId,
      program_id,
      program_name,
      formatDateTime(start),
      formatDateTime(end),
      JSON.stringify(completed_exercises),
      total_exercises,
      duration_minutes
    ];
    
    const [result] = await db.query(query, values);
    
    res.json({
      success: true,
      data: {
        id: result.insertId,
        message: 'אימון נשמר בהצלחה'
      }
    });
  } catch (error) {
    console.error('Error saving workout history:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'שגיאה בשמירת האימון',
      error: error.message
    });
  }
});

router.get('/user/workout-stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = global.db_pool.promise();
    
    const query = `
      SELECT 
        COUNT(*) as total_workouts,
        SUM(duration_minutes) as total_duration,
        AVG(duration_minutes) as avg_duration,
        COUNT(DISTINCT program_id) as unique_programs,
        MAX(start_time) as last_workout,
        SUM(CASE WHEN JSON_LENGTH(completed_exercises) = total_exercises THEN 1 ELSE 0 END) as completed_workouts
      FROM workout_history 
      WHERE user_id = ?
    `;
    
    const [rows] = await db.query(query, [userId]);
    const stats = rows[0];
    
    res.json({
      success: true,
      data: {
        total_workouts: stats.total_workouts || 0,
        total_duration: stats.total_duration || 0,
        avg_duration: Math.round(stats.avg_duration || 0),
        unique_programs: stats.unique_programs || 0,
        last_workout: stats.last_workout,
        completed_workouts: stats.completed_workouts || 0,
        completion_rate: stats.total_workouts > 0 ? 
          Math.round((stats.completed_workouts / stats.total_workouts) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching workout stats:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בטעינת סטטיסטיקות האימונים'
    });
  }
});

module.exports = router;


