const express = require('express');
const router = express.Router();
const { 
  listPlans, 
  getPlan, 
  createPlan, 
  updatePlan, 
  deletePlan 
} = require('../middleware/subscriptionPlans_Mid');
const { verifyToken } = require('../middleware/auth_Mid');

router.get('/', 
  verifyToken,
  listPlans
);

router.get('/:id', 
  verifyToken,
  getPlan
);

router.post('/', 
  verifyToken,
  createPlan
);

router.put('/:id', 
  verifyToken,
  updatePlan
);

router.delete('/:id', 
  verifyToken,
  deletePlan
);

module.exports = router;
