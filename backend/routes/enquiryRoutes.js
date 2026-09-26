const express = require('express');
const router = express.Router();
const { createEnquiry, getEnquiries } = require('../controllers/enquiryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Protect all routes in this file
router.use(authenticate);

// Allow both ADMIN and SALES_USER
router.post('/', authorize(['ADMIN', 'SALES_USER']), createEnquiry);
router.get('/', authorize(['ADMIN', 'SALES_USER']), getEnquiries);

module.exports = router;