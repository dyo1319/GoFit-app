const express = require('express');
const router = express.Router();
const subscription_Mid = require('../middleware/subscription_Mid');
const { validate, subscriptionListQuerySchema, subscriptionCreateSchema, subscriptionUpdateSchema, paymentStatusSchema, idParamSchema } = require('../middleware/validate');

router.get('/', validate(subscriptionListQuerySchema, 'query'), subscription_Mid.list);
router.get('/count', validate(subscriptionListQuerySchema, 'query'), subscription_Mid.count);
router.put('/:id/payment', validate(idParamSchema, 'params'), validate(paymentStatusSchema), subscription_Mid.updatePaymentStatus);
router.get('/:id', validate(idParamSchema, 'params'), subscription_Mid.getOne);
router.post('/', validate(subscriptionCreateSchema), subscription_Mid.create);
router.put('/:id', validate(idParamSchema, 'params'), validate(subscriptionUpdateSchema), subscription_Mid.update);
router.post('/:id/restore', validate(idParamSchema, 'params'), subscription_Mid.restore);
router.post('/:id/pause', validate(idParamSchema, 'params'), subscription_Mid.pause);
router.post('/:id/resume', validate(idParamSchema, 'params'), subscription_Mid.resume);
router.post('/:id/cancel', validate(idParamSchema, 'params'), subscription_Mid.cancel);
router.delete('/:id', validate(idParamSchema, 'params'), subscription_Mid.deletesub);
router.get('/stats/dashboard', subscription_Mid.getDashboardStats);

module.exports = router;