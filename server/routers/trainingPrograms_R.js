const express = require('express');
const router = express.Router();
const trainingPrograms_Mid = require('../middleware/trainingPrograms_Mid');
const { validate, trainingProgramCreateSchema, idParamSchema, userIdParamSchema, exerciseIdParamSchema, trainingProgramExerciseParamsSchema, trainingProgramExerciseSchema, trainingProgramExerciseUpdateSchema } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth_Mid');
const { requirePermission } = require('../middleware/permission_Mid');

router.get('/trainees', 
  verifyToken, 
  requirePermission('manage_plans'), 
  trainingPrograms_Mid.getAllTraineesWithPrograms,
  (req, res) => {
    res.json({
      success: true,
      data: req.trainees_data || []
    });
  }
);

router.get('/user/:userId', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(userIdParamSchema, 'params'),
  trainingPrograms_Mid.getUserTrainingPrograms,
  (req, res) => {
    res.json({
      success: true,
      data: req.training_programs_data || []
    });
  }
);

router.get('/my-programs', 
  verifyToken, 
  trainingPrograms_Mid.getUserTrainingPrograms,
  (req, res) => {
    res.json({
      success: true,
      data: req.training_programs_data || []
    });
  }
);

router.get('/:id', 
  verifyToken, 
  validate(idParamSchema, 'params'),
  trainingPrograms_Mid.getTrainingProgramById,
  (req, res) => {
    res.json({
      success: true,
      data: req.training_program_data
    });
  }
);

router.post('/', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(trainingProgramCreateSchema),
  trainingPrograms_Mid.createTrainingProgram,
  (req, res) => {
    res.status(201).json({
      success: true,
      message: 'Training program created successfully',
      data: { id: req.created_program_id }
    });
  }
);

router.delete('/:id', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(idParamSchema, 'params'),
  trainingPrograms_Mid.deleteTrainingProgram,
  (req, res) => {
    res.json({
      success: true,
      message: 'Training program deleted successfully'
    });
  }
);

router.post('/:id/exercises', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(idParamSchema, 'params'),
  validate(trainingProgramExerciseSchema),
  trainingPrograms_Mid.addExerciseToProgram,
  (req, res) => {
    res.status(201).json({
      success: true,
      message: 'Exercise added to program successfully'
    });
  }
);

router.put('/:id/exercises/:exerciseId', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(trainingProgramExerciseParamsSchema, 'params'),
  validate(trainingProgramExerciseUpdateSchema),
  trainingPrograms_Mid.updateExerciseInProgram,
  (req, res) => {
    res.json({
      success: true,
      message: 'Exercise updated successfully'
    });
  }
);

router.delete('/:id/exercises/:exerciseId', 
  verifyToken, 
  requirePermission('manage_plans'), 
  validate(trainingProgramExerciseParamsSchema, 'params'),
  trainingPrograms_Mid.deleteExerciseFromProgram,
  (req, res) => {
    res.json({
      success: true,
      message: 'Exercise deleted from program successfully'
    });
  }
);

module.exports = router;