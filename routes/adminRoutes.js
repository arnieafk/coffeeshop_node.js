const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const {
  ensureAuthenticated,
  authorizeRole
} = require('../middleware/authMiddleware');

/*
|--------------------------------------------------------------------------
| Protect all admin routes
|--------------------------------------------------------------------------
*/
router.use(
  ensureAuthenticated,
  authorizeRole('admin')
);

/*
|--------------------------------------------------------------------------
| Dashboard (FIXED)
|--------------------------------------------------------------------------
*/
router.get('/', async (req, res) => {
  try {
    // SAFE DEFAULTS (prevents "totals is not defined")
    const totals = await adminController.getDashboardTotals?.() || {
      revenue: 0,
      orders: 0,
      products: 0,
      customers: 0
    };

    const recentOrders = await adminController.getRecentOrders?.() || [];

    res.render('dashboard/admin', {
      user: req.session.user,
      totals,
      recentOrders
    });

  } catch (err) {
    console.error(err);
    res.render('dashboard/admin', {
      user: req.session.user,
      totals: {
        revenue: 0,
        orders: 0,
        products: 0,
        customers: 0
      },
      recentOrders: []
    });
  }
});

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/
router.get('/products', adminController.listProducts);
router.get('/products/new', adminController.showCreateProduct);
router.post('/products', adminController.createProduct);
router.get('/products/:id/edit', adminController.showEditProduct);
router.post('/products/:id/edit', adminController.updateProduct);
router.post('/products/:id/delete', adminController.deleteProduct);

/*
|--------------------------------------------------------------------------
| Orders
|--------------------------------------------------------------------------
*/
router.get('/orders', adminController.listOrders);
router.get('/orders/:id', adminController.showOrder);

/*
|--------------------------------------------------------------------------
| Payments
|--------------------------------------------------------------------------
*/
router.get('/payments', adminController.listPayments);

router.post('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;