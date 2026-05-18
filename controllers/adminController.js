const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/* =========================
   FLASH HELPERS
========================= */
function setSuccess(req, message) {
  req.session.success = message;
}

function setError(req, message) {
  req.session.error = message;
}

/* =========================
   DASHBOARD TOTALS
========================= */
async function getDashboardTotals() {
  try {
    const orders = await Order.getAllWithUser();
    const products = await Product.getAll();
    const customers = await User.getAllStaff();

    let revenue = 0;
    orders.forEach(o => revenue += Number(o.total || 0));

    return {
      revenue,
      orders: orders.length,
      products: products.length,
      customers: customers.length
    };

  } catch (err) {
    console.error('[DASHBOARD TOTALS ERROR]', err);
    return { revenue: 0, orders: 0, products: 0, customers: 0 };
  }
}

async function getRecentOrders() {
  try {
    const orders = await Order.getAllWithUser();
    return (orders || []).slice(0, 5);
  } catch (err) {
    console.error('[RECENT ORDERS ERROR]', err);
    return [];
  }
}

/* =========================
   DASHBOARD
========================= */
async function adminDashboard(req, res) {
  try {
    const totals = await getDashboardTotals();
    const recentOrders = await getRecentOrders();

    return res.render('admin/dashboard', {
      totals,
      recentOrders,
      user: req.session.user
    });

  } catch (error) {
    console.error(error);
    setError(req, 'Failed to load dashboard');
    return res.redirect('/admin/orders');
  }
}

/* =========================
   PRODUCTS
========================= */
async function listProducts(req, res) {
  try {
    const products = await Product.getAll();
    return res.render('admin/products', { products, user: req.session.user });
  } catch (e) {
    console.error(e);
    setError(req, 'Failed');
    return res.redirect('/admin');
  }
}

function showCreateProduct(req, res) {
  return res.render('admin/product-form', {
    product: null,
    action: '/admin/products',
    title: 'Add Product',
    user: req.session.user
  });
}

async function createProduct(req, res) {
  try {
    await Product.create(req.body);
    setSuccess(req, 'Product created');
    return res.redirect('/admin/products');
  } catch (e) {
    console.error(e);
    setError(req, 'Error creating product');
    return res.redirect('/admin/products');
  }
}

async function showEditProduct(req, res) {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) return res.redirect('/admin/products');

    return res.render('admin/product-form', {
      product,
      action: `/admin/products/${product.id}/edit`,
      title: 'Edit Product',
      user: req.session.user
    });

  } catch (e) {
    console.error(e);
    return res.redirect('/admin/products');
  }
}

async function updateProduct(req, res) {
  try {
    await Product.update(req.params.id, req.body);
    setSuccess(req, 'Updated');
    return res.redirect('/admin/products');
  } catch (e) {
    console.error(e);
    return res.redirect('/admin/products');
  }
}

async function deleteProduct(req, res) {
  try {
    await Product.remove(req.params.id);
    setSuccess(req, 'Deleted');
    return res.redirect('/admin/products');
  } catch (e) {
    console.error(e);
    return res.redirect('/admin/products');
  }
}

/* =========================
   RESTOCK PRODUCT + STOCK LOG
========================= */
async function restockProduct(req, res) {
  try {
    const productId = req.params.id;
    const qty = Number(req.body.qty);
    const userId = req.session.user?.id || null;

    if (!qty || qty <= 0) {
      setError(req, 'Invalid restock quantity');
      return res.redirect('/admin/products');
    }

    // update stock
    await Product.restock(productId, qty);

    // log stock history
    const db = require('../config/db');
    await db.query(`
      INSERT INTO stock_logs (product_id, user_id, quantity, created_at)
      VALUES (?, ?, ?, NOW())
    `, [productId, userId, qty]);

    setSuccess(req, `Restocked +${qty}`);
    return res.redirect('/admin/products');

  } catch (error) {
    console.error('[RESTOCK ERROR]', error);
    setError(req, 'Error restocking product');
    return res.redirect('/admin/products');
  }
}

/* =========================
   STOCK LOGS
========================= */
async function listStockLogs(req, res) {
  try {
    const db = require('../config/db');

    const [logs] = await db.query(`
      SELECT 
        sl.*,
        p.name AS product_name,
        u.name AS user_name
      FROM stock_logs sl
      LEFT JOIN products p ON p.id = sl.product_id
      LEFT JOIN users u ON u.id = sl.user_id
      ORDER BY sl.id DESC
    `);

    return res.render('admin/stock-logs', {
      logs: logs || [],
      user: req.session.user
    });

  } catch (error) {
    console.error('[STOCK LOG ERROR]', error);
    return res.render('admin/stock-logs', {
      logs: [],
      user: req.session.user
    });
  }
}

/* =========================
   ORDERS
========================= */
async function listOrders(req, res) {
  try {
    const orders = await Order.getAllWithUser();
    const staffList = await User.getAllStaff();

    const staffMap = {};
    staffList.forEach(s => staffMap[s.id] = s.name);

    orders.forEach(o => {
      o.assigned_staff_name = staffMap[o.assigned_staff_id] || 'Unassigned';
    });

    return res.render('admin/orders', {
      orders,
      staffList,
      user: req.session.user
    });

  } catch (e) {
    console.error(e);
    return res.redirect('/admin/orders');
  }
}

async function showOrder(req, res) {
  try {
    const order = await Order.getById(req.params.id);
    if (!order) return res.redirect('/admin/orders');

    return res.render('admin/order-details', {
      order,
      user: req.session.user
    });

  } catch (e) {
    console.error(e);
    return res.redirect('/admin/orders');
  }
}

async function assignOrderStaff(req, res) {
  try {
    let { staff_id } = req.body;
    staff_id = Number(staff_id || null);

    await Order.assignStaff(req.params.id, staff_id);

    setSuccess(req, 'Assigned');
    return res.redirect('/admin/orders');

  } catch (e) {
    console.error(e);
    return res.redirect('/admin/orders');
  }
}

/* =========================
   PAYMENTS
========================= */
async function listPayments(req, res) {
  try {
    const payments = await Payment.getAll();
    return res.render('admin/payments', {
      payments,
      user: req.session.user
    });

  } catch (e) {
    console.error(e);
    return res.redirect('/admin/payments');
  }
}

/* =========================
   ORDER STATUS
========================= */
async function updateOrderStatus(req, res) {
  try {
    await Order.updateStatus(req.params.id, req.body.status);
    setSuccess(req, 'Updated');
    return res.redirect('/admin/orders');
  } catch (e) {
    console.error(e);
    return res.redirect('/admin/orders');
  }
}

/* =========================
   STAFF
========================= */
async function listStaff(req, res) {
  try {
    const staff = await User.getAllStaff();
    return res.render('admin/staff', { staff, user: req.session.user });
  } catch (e) {
    console.error(e);
    setError(req, 'Failed to load staff');
    return res.redirect('/admin');
  }
}

function showCreateStaff(req, res) {
  return res.render('admin/staff-form', {
    staff: null,
    action: '/admin/staff',
    user: req.session.user
  });
}

async function createStaff(req, res) {
  try {
    const { name, email, password, role, status } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) {
      setError(req, 'Email already exists');
      return res.redirect('/admin/staff');
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      role: role || 'staff',
      status: status || 'active'
    });

    setSuccess(req, 'Staff created successfully');
    return res.redirect('/admin/staff');

  } catch (e) {
    console.error('[CREATE STAFF ERROR]', e);
    setError(req, 'Failed to create staff');
    return res.redirect('/admin/staff');
  }
}

async function showEditStaff(req, res) {
  try {
    const staff = await User.getById(req.params.id);

    if (!staff) {
      setError(req, 'Staff not found');
      return res.redirect('/admin/staff');
    }

    return res.render('admin/staff-form', {
      staff,
      action: `/admin/staff/${staff.id}/update`,
      user: req.session.user
    });

  } catch (e) {
    console.error('[SHOW EDIT STAFF ERROR]', e);
    setError(req, 'Failed to load staff');
    return res.redirect('/admin/staff');
  }
}

async function updateStaff(req, res) {
  try {
    const id = req.params.id;

    const data = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      status: req.body.status
    };

    await User.update(id, data);

    setSuccess(req, 'Staff updated successfully');
    return res.redirect('/admin/staff');

  } catch (e) {
    console.error('[UPDATE STAFF ERROR]', e);
    setError(req, 'Failed to update staff');
    return res.redirect('/admin/staff');
  }
}

async function deleteStaff(req, res) {
  try {
    await User.remove(req.params.id);
    setSuccess(req, 'Staff deleted successfully');
    return res.redirect('/admin/staff');

  } catch (e) {
    console.error('[DELETE STAFF ERROR]', e);
    setError(req, 'Failed to delete staff');
    return res.redirect('/admin/staff');
  }
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  listProducts,
  showCreateProduct,
  createProduct,
  showEditProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  listStockLogs,

  listOrders,
  showOrder,
  assignOrderStaff,

  listPayments,
  updateOrderStatus,

  listStaff,
  showCreateStaff,
  createStaff,
  showEditStaff,
  updateStaff,
  deleteStaff,

  adminDashboard,
  getDashboardTotals,
  getRecentOrders
};