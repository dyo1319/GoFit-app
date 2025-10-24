const express = require('express');
const router = express.Router();
const { 
  listInvoices, 
  getInvoice, 
  createInvoice, 
  updateInvoiceStatus,
  generateInvoiceFromSubscription
} = require('../middleware/invoices_Mid');
const { verifyToken } = require('../middleware/auth_Mid');

router.get('/', 
  verifyToken,
  listInvoices
);

router.get('/:id', 
  verifyToken,
  getInvoice
);

router.post('/', 
  verifyToken,
  createInvoice
);

router.post('/generate-from-subscription', 
  verifyToken,
  generateInvoiceFromSubscription
);

router.put('/:id/status', 
  verifyToken,
  updateInvoiceStatus
);

module.exports = router;
