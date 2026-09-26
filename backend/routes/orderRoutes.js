const express = require('express');
const router = express.Router();
const { convertToOrder, confirmOrder, dispatchOrder, getOrders } = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.use(authenticate);

// Both can convert an accepted quote to an order
router.post('/convert/:quotationId', authorize(['ADMIN', 'SALES_USER']), convertToOrder);

// Only ADMIN can confirm an order (which reserves stock)
router.post('/:id/confirm', authorize(['ADMIN']), confirmOrder);

// Only ADMIN can dispatch an order
router.post('/:id/dispatch', authorize(['ADMIN']), dispatchOrder);

// GET /sales-orders
router.get('/', authorize(['ADMIN', 'SALES_USER']), getOrders);

module.exports = router;