const express = require('express');
const router = express.Router();

const staffController = require('../controllers/staffController');
const {
  ensureAuthenticated,
  authorizeRole
} = require('../middleware/authMiddleware');

console.log('Staff routes loaded');

/* ======================
   PROTECT STAFF ROUTES
====================== */
router.use(
  ensureAuthenticated,
  authorizeRole('staff')
);

/* ======================
   STAFF DASHBOARD
====================== */
router.get('/', async (req, res) => {
  try {
    const stats = await staffController.getStats?.() || {
      pending: 0,
      preparing: 0,
      completed: 0
    };

    const orders = await staffController.getOrders?.() || [];

    res.render('dashboard/staff', {
      user: req.session.user,
      stats,
      orders
    });

  } catch (err) {
    console.error(err);

    res.render('dashboard/staff', {
      user: req.session.user,
      stats: { pending: 0, preparing: 0, completed: 0 },
      orders: []
    });
  }
});

/* ======================
   STAFF ORDERS PAGE
====================== */
router.get('/orders', staffController.listOrders);

/* ======================
   UPDATE ORDER STATUS
====================== */
router.post('/orders/:id/status', staffController.updateOrderStatus);

module.exports = router;