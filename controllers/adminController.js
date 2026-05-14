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
   PRODUCTS
========================= */

async function listProducts(req, res) {
  try {
    const products = await Product.getAll();

    return res.render('admin/products', {
      products,
      user: req.session.user
    });

  } catch (error) {
    console.error('[PRODUCT LIST ERROR]', error);
    setError(req, 'Failed to load products');
    return res.redirect('/admin/products');
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

    setSuccess(req, 'Product created successfully');
    return res.redirect('/admin/products');

  } catch (error) {
    console.error('[CREATE PRODUCT ERROR]', error);
    setError(req, 'Error creating product');
    return res.redirect('/admin/products');
  }
}

async function showEditProduct(req, res) {
  try {
    const product = await Product.getById(req.params.id);

    if (!product) {
      setError(req, 'Product not found');
      return res.redirect('/admin/products');
    }

    return res.render('admin/product-form', {
      product,
      action: `/admin/products/${product.id}/edit`,
      title: 'Edit Product',
      user: req.session.user
    });

  } catch (error) {
    console.error('[SHOW EDIT PRODUCT ERROR]', error);
    setError(req, 'Error loading product');
    return res.redirect('/admin/products');
  }
}

async function updateProduct(req, res) {
  try {
    await Product.update(req.params.id, req.body);

    setSuccess(req, 'Product updated successfully');
    return res.redirect('/admin/products');

  } catch (error) {
    console.error('[UPDATE PRODUCT ERROR]', error);
    setError(req, 'Error updating product');
    return res.redirect('/admin/products');
  }
}

async function deleteProduct(req, res) {
  try {
    await Product.remove(req.params.id);

    setSuccess(req, 'Product deleted successfully');
    return res.redirect('/admin/products');

  } catch (error) {
    console.error('[DELETE PRODUCT ERROR]', error);
    setError(req, 'Error deleting product');
    return res.redirect('/admin/products');
  }
}

/* =========================
   ORDERS
========================= */

async function listOrders(req, res) {
  try {

    const orders = await Order.getAllWithUser();
    const staffList = await User.getAllStaff();

    return res.render('admin/orders', {
      orders,
      staffList,
      user: req.session.user
    });

  } catch (error) {
    console.error('[ORDER LIST ERROR]', error);
    setError(req, 'Failed to load orders');

    return res.redirect('/admin/orders');
  }
}

async function showOrder(req, res) {
  try {

    const order = await Order.getById(req.params.id);

    if (!order) {
      setError(req, 'Order not found');
      return res.redirect('/admin/orders');
    }

    return res.render('admin/order-details', {
      title: 'Order Details',
      order,
      user: req.session.user
    });

  } catch (error) {
    console.error('[ORDER DETAILS ERROR]', error);
    setError(req, 'Error loading order');
    return res.redirect('/admin/orders');
  }
}

/* =========================
   ASSIGN ORDER TO STAFF (FIXED)
========================= */

async function assignOrderStaff(req, res) {
  try {

    let { staff_id } = req.body;

    // 🔥 FIX: prevent empty string / invalid value
    staff_id = staff_id ? Number(staff_id) : null;

    if (staff_id === 0 || Number.isNaN(staff_id)) {
      staff_id = null;
    }

    await Order.assignStaff(req.params.id, staff_id);

    setSuccess(req, 'Order assigned successfully');
    return res.redirect('/admin/orders');

  } catch (error) {
    console.error('[ASSIGN STAFF ERROR]', error);
    setError(req, 'Error assigning staff');
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

  } catch (error) {
    console.error('[PAYMENTS ERROR]', error);
    setError(req, 'Error loading payments');
    return res.redirect('/admin/payments');
  }
}

/* =========================
   ORDER STATUS
========================= */

async function updateOrderStatus(req, res) {
  try {

    const map = {
      pending: 'Pending',
      preparing: 'Preparing',
      completed: 'Completed'
    };

    const status = map[req.body.status] || req.body.status;

    await Order.updateStatus(req.params.id, status);

    setSuccess(req, 'Order status updated successfully');
    return res.redirect('/admin/orders');

  } catch (error) {
    console.error('[ORDER STATUS ERROR]', error);
    setError(req, 'Error updating order');
    return res.redirect('/admin/orders');
  }
}

/* =========================
   STAFF MANAGEMENT
========================= */

async function listStaff(req, res) {
  try {
    const staff = await User.getAllStaff();

    return res.render('admin/staff', {
      staff,
      user: req.session.user
    });

  } catch (error) {
    console.error('[STAFF LIST ERROR]', error);
    setError(req, 'Failed to load staff');
    return res.redirect('/admin');
  }
}

function showCreateStaff(req, res) {
  return res.render('admin/staff-form', {
    staff: null,
    action: '/admin/staff',
    title: 'Add Staff',
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'staff',
      status: status || 'active'
    });

    setSuccess(req, 'Staff created successfully');
    return res.redirect('/admin/staff');

  } catch (error) {
    console.error('[CREATE STAFF ERROR]', error);
    setError(req, 'Error creating staff');
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
      title: 'Edit Staff',
      user: req.session.user
    });

  } catch (error) {
    console.error('[SHOW STAFF ERROR]', error);
    setError(req, 'Error loading staff');
    return res.redirect('/admin/staff');
  }
}

async function updateStaff(req, res) {
  try {

    const { name, email, role, status } = req.body;

    await User.update(req.params.id, {
      name,
      email,
      role: role || 'staff',
      status: status || 'active'
    });

    setSuccess(req, 'Staff updated successfully');
    return res.redirect('/admin/staff');

  } catch (error) {
    console.error('[UPDATE STAFF ERROR]', error);
    setError(req, 'Error updating staff');
    return res.redirect('/admin/staff');
  }
}

async function deleteStaff(req, res) {
  try {

    await User.remove(req.params.id);

    setSuccess(req, 'Staff deleted successfully');
    return res.redirect('/admin/staff');

  } catch (error) {
    console.error('[DELETE STAFF ERROR]', error);
    setError(req, 'Error deleting staff');
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
  deleteStaff
};