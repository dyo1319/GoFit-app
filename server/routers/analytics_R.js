const express = require('express');
const router = express.Router();
const analytics_Mid = require('../middleware/analytics_Mid');
const { validate, analyticsDateRangeSchema } = require('../middleware/validate');

const setDefaultDates = (req, res, next) => {
  if (!req.query.from || !req.query.to) {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    
    req.query.from = req.query.from || `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    req.query.to = req.query.to || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }
  next();
};

router.get('/subscriptions/monthly', 
  setDefaultDates,
  validate(analyticsDateRangeSchema, 'query'), 
  analytics_Mid.getMonthlySubscriptions
);

router.get('/payments/monthly', 
  setDefaultDates,
  validate(analyticsDateRangeSchema, 'query'), 
  analytics_Mid.getMonthlyPayments
);

router.get('/dashboard/stats', analytics_Mid.getDashboardStats);

module.exports = router;