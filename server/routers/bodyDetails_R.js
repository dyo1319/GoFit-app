const express = require('express');
const router = express.Router();
const bodyDetails_Mid = require('../middleware/BodyDetails_Mid');
const { validate, idParamSchema } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth_Mid');

const Joi = require('joi');

const bodyDetailCreateSchema = Joi.object({
  weight: Joi.number().min(0).max(300).allow(null),
  height: Joi.number().min(0).max(250).allow(null),
  body_fat: Joi.number().min(0).max(100).allow(null),
  muscle_mass: Joi.number().min(0).allow(null),
  circumference: Joi.number().min(0).allow(null),
  recorded_at: Joi.date().required()
});

const bodyDetailUpdateSchema = Joi.object({
  weight: Joi.number().min(0).max(300).allow(null),
  height: Joi.number().min(0).max(250).allow(null),
  body_fat: Joi.number().min(0).max(100).allow(null),
  muscle_mass: Joi.number().min(0).allow(null),
  circumference: Joi.number().min(0).allow(null),
  recorded_at: Joi.date().required()
}).min(1);

router.get('/', verifyToken, bodyDetails_Mid.getUserBodyDetails);
router.get('/recent', verifyToken, bodyDetails_Mid.getRecentBodyDetails);
router.get('/latest', verifyToken, bodyDetails_Mid.getLatestBodyDetail);
router.get('/stats', verifyToken, bodyDetails_Mid.getBodyStats);
router.post('/', verifyToken, validate(bodyDetailCreateSchema), bodyDetails_Mid.createBodyDetail);
router.put('/:id', verifyToken, validate(idParamSchema, 'params'), validate(bodyDetailUpdateSchema), bodyDetails_Mid.updateBodyDetail);
router.delete('/:id', verifyToken, validate(idParamSchema, 'params'), bodyDetails_Mid.deleteBodyDetail);

module.exports = router;