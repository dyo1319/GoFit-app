const express = require('express');
const router = express.Router();
const exercises_Mid = require('../middleware/exercises_Mid');
const { validate, exerciseCreateSchema, exerciseUpdateSchema, idParamSchema } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth_Mid');
const { requirePermission } = require('../middleware/permission_Mid');

router.get('/', 
  verifyToken, 
  requirePermission('manage_plans'), 
  exercises_Mid.getAllExercises, 
  (req, res) => {
    res.json({
      success: true,
      data: req.exercises_data || []
    });
  }
);

router.get('/library', 
  verifyToken, 
  exercises_Mid.getAllExercises, 
  (req, res) => {
    res.json({
      success: true,
      data: req.exercises_data || []
    });
  }
);

router.get('/:id', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(idParamSchema, 'params'),
  exercises_Mid.getExerciseById,
  (req, res) => {
    res.json({
      success: true,
      data: req.exercise_data
    });
  }
);

router.post('/', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(exerciseCreateSchema),
  exercises_Mid.createExercise,
  (req, res) => {
    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: { id: req.created_exercise_id }
    });
  }
);

router.put('/:id', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(idParamSchema, 'params'),
  validate(exerciseUpdateSchema),
  exercises_Mid.updateExercise,
  (req, res) => {
    res.json({
      success: true,
      message: 'Exercise updated successfully'
    });
  }
);

router.delete('/:id', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(idParamSchema, 'params'),
  exercises_Mid.deleteExercise,
  (req, res) => {
    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  }
);

module.exports = router;