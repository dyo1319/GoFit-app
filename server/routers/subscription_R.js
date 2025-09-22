const express = require('express');
const router = express.Router();
const subscription_Mid = require('../middleware/subscription_Mid');

router.get('/', subscription_Mid.list);
router.get('/:id', subscription_Mid.getOne);
router.post('/', subscription_Mid.create);
router.put('/:id', subscription_Mid.update);
router.post('/:id/restore', subscription_Mid.restore);
router.post('/:id/pause', subscription_Mid.pause);
router.post('/:id/resume', subscription_Mid.resume);
router.post('/:id/cancel', subscription_Mid.cancel);
router.delete('/:id', subscription_Mid.deletesub);

module.exports = router;