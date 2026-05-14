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
| Dashboard
|--------------------------------------------------------------------------
*/
router.get('/', async (req, res) => {
  try {
    const totals = await adminController.getDashboardTotals?.();

    const safeTotals = totals || {
      revenue: 0,
      orders: 0,
      products: 0,
      customers: 0
    };

    const recentOrders = await adminController.getRecentOrders?.() || [];

    return res.render('dashboard/admin', {
      title: 'Admin Dashboard',
      user: req.session.user,
      totals: safeTotals,
      recentOrders
    });

  } catch (err) {
    console.error('[ADMIN DASHBOARD ERROR]', err);

    return res.render('dashboard/admin', {
      title: 'Admin Dashboard',
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
router.post('/orders/:id/status', adminController.updateOrderStatus);

/*
|--------------------------------------------------------------------------
| Payments
|--------------------------------------------------------------------------
*/
router.get('/payments', adminController.listPayments);

/*
|--------------------------------------------------------------------------
| STAFF MANAGEMENT (FULL CRUD)
|--------------------------------------------------------------------------
*/

// VIEW STAFF
router.get('/staff', adminController.listStaff);

// SHOW ADD STAFF FORM
router.get('/staff/new', adminController.showCreateStaff);

// CREATE STAFF
router.post('/staff', adminController.createStaff);

// SHOW EDIT STAFF FORM
router.get('/staff/:id/edit', adminController.showEditStaff);

// UPDATE STAFF
router.post('/staff/:id/update', adminController.updateStaff);

// DELETE STAFF
router.post('/staff/:id/delete', adminController.deleteStaff);

module.exports = router;