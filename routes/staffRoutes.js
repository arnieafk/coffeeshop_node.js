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


/* =====================================================
   🆕 ADMIN ACCESS TO VIEW STAFF PAGE (UML requirement)
   NOTE: Admin can view staff list but NOT inside staff role middleware
===================================================== */

router.get('/admin-view', async (req, res) => {
  try {

    // you will replace this later with DB
    const staff = await staffController.getAllStaff?.() || [];

    res.render('admin/staff', {
      user: req.session.user,
      staff
    });

  } catch (err) {
    console.error(err);

    res.render('admin/staff', {
      user: req.session.user,
      staff: []
    });
  }
});

module.exports = router;