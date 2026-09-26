const express = require('express');
const router = express.Router();
const { createQuotation, updateQuotationStatus } = require('../controllers/quotationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

// POST /quotations
router.post('/', authorize(['ADMIN', 'SALES_USER']), createQuotation);

// PATCH /quotations/:id/status
router.patch('/:id/status', authorize(['ADMIN', 'SALES_USER']), updateQuotationStatus);

module.exports = router;