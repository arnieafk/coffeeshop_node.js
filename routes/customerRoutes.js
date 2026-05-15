const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const customerController = require('../controllers/customerController');
const { ensureAuthenticated, authorizeRole } = require('../middleware/authMiddleware');

// protect customer routes
router.use(ensureAuthenticated, authorizeRole('customer'));

/* =========================
   DASHBOARD
========================= */
router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.getByUserId(req.session.user.id);

    const stats = {
      totalOrders: orders.length,
      rating: 5,
      favoriteItem: 'Coffee'
    };

    res.render('dashboard/customer', {
      user: req.session.user,
      stats
    });

  } catch (error) {
    next(error);
  }
});

/* =========================
   MENU & CART
========================= */
router.get('/menu', customerController.viewMenu);
router.post('/menu/:id/add', customerController.addToCart);

router.get('/cart', customerController.viewCart);

router.post('/cart/:id/increase', customerController.increaseQuantity);
router.post('/cart/:id/decrease', customerController.decreaseQuantity);
router.post('/cart/:id/remove', customerController.removeFromCart);

/* =========================
   ORDERS
========================= */
router.post('/orders/place', customerController.placeOrder);
router.get('/orders', customerController.myOrders);

/* =========================
   PAYMENT (NEW)
========================= */
router.get('/payment/:id', customerController.showPaymentPage);
router.post('/payment/:id/pay', customerController.processPayment);

module.exports = router;