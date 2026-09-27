const express = require('express');
const router = express.Router();
// We added getQuotations to the import list below
const { createQuotation, updateQuotationStatus, getQuotations } = require('../controllers/quotationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

// GET /quotations (This was the missing piece!)
router.get('/', authorize(['ADMIN', 'SALES_USER']), getQuotations);

// POST /quotations
router.post('/', authorize(['ADMIN', 'SALES_USER']), createQuotation);

// PATCH /quotations/:id/status
router.patch('/:id/status', authorize(['ADMIN', 'SALES_USER']), updateQuotationStatus);

module.exports = router;