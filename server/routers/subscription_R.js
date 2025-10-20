const express = require('express');
const router = express.Router();
const subscription_Mid = require('../middleware/subscription_Mid');
const { validate, subscriptionListQuerySchema, subscriptionCreateSchema, subscriptionUpdateSchema, paymentStatusSchema, idParamSchema } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth_Mid'); 

router.get('/', verifyToken, validate(subscriptionListQuerySchema, 'query'), subscription_Mid.list);
router.get('/count', verifyToken, validate(subscriptionListQuerySchema, 'query'), subscription_Mid.count);
router.put('/:id/payment', verifyToken, validate(idParamSchema, 'params'), validate(paymentStatusSchema), subscription_Mid.updatePaymentStatus);
router.get('/:id', verifyToken, validate(idParamSchema, 'params'), subscription_Mid.getOne);
router.post('/', verifyToken, validate(subscriptionCreateSchema), subscription_Mid.create);
router.put('/:id', verifyToken, validate(idParamSchema, 'params'), validate(subscriptionUpdateSchema), subscription_Mid.update);
router.post('/:id/restore', verifyToken, validate(idParamSchema, 'params'), subscription_Mid.restore);
router.post('/:id/pause', verifyToken, validate(idParamSchema, 'params'), subscription_Mid.pause);
router.post('/:id/resume', verifyToken, validate(idParamSchema, 'params'), subscription_Mid.resume);
router.post('/:id/cancel', verifyToken, validate(idParamSchema, 'params'), subscription_Mid.cancel);
router.delete('/:id', verifyToken, validate(idParamSchema, 'params'), subscription_Mid.deletesub);
router.get('/stats/dashboard', verifyToken, subscription_Mid.getDashboardStats);
router.get('/user/mine', verifyToken, subscription_Mid.getUserSubscriptions);
router.get('/user/current', verifyToken, subscription_Mid.getCurrentSubscription);
router.get('/user/stats', verifyToken, subscription_Mid.getUserSubscriptionStats);
router.post('/user/create', verifyToken, validate(subscriptionCreateSchema), subscription_Mid.createUserSubscription);

module.exports = router;