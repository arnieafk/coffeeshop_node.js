const Order = require('../models/Order');

/* ======================
   GET DASHBOARD STATS
====================== */
async function getStats(staffId) {

  try {

    const orders = await Order.getAllForStaff(staffId);

    const stats = {
      pending: 0,
      preparing: 0,
      completed: 0
    };

    orders.forEach(order => {

      const status = String(order.status || '').toLowerCase();

      if (status === 'pending') {
        stats.pending++;
      }

      else if (status === 'preparing') {
        stats.preparing++;
      }

      else if (status === 'completed') {
        stats.completed++;
      }

    });

    return stats;

  } catch (error) {

    console.error(error);

    return {
      pending: 0,
      preparing: 0,
      completed: 0
    };

  }
}

/* ======================
   GET DASHBOARD ORDERS
====================== */
async function getOrders(staffId) {

  try {

    return await Order.getAllForStaff(staffId);

  } catch (error) {

    console.error(error);
    return [];

  }
}

/* ======================
   STAFF DASHBOARD
====================== */
async function dashboard(req, res) {

  try {

    const staffId = req.session.user.id;

    const stats = await getStats(staffId);
    const orders = await getOrders(staffId);

    res.render('dashboard/staff', {
      user: req.session.user,
      stats,
      orders
    });

  } catch (error) {

    console.error(error);

    res.render('dashboard/staff', {
      user: req.session.user,
      stats: {
        pending: 0,
        preparing: 0,
        completed: 0
      },
      orders: []
    });

  }
}

/* ======================
   STAFF ORDERS PAGE
====================== */
async function listOrders(req, res) {

  try {

    const staffId = req.session.user.id;

    const orders = await Order.getAllForStaff(staffId);

    res.render('staff/orders', {
      orders,
      user: req.session.user
    });

  } catch (error) {

    console.error(error);
    res.send('Error loading staff orders');

  }
}

/* ======================
   UPDATE ORDER STATUS
====================== */
async function updateOrderStatus(req, res) {

  try {

    const order = await Order.getById(req.params.id);

    if (!order) {
      return res.redirect('/staff/orders');
    }

    const currentStatus = String(order.status || '').toLowerCase();

    let nextStatus = null;

    // 🔥 FLOW CONTROL
    if (currentStatus === 'pending') {
      nextStatus = 'Preparing';
    }

    else if (currentStatus === 'preparing') {
      nextStatus = 'Completed';
    }

    else {
      return res.redirect('/staff/orders');
    }

    await Order.updateStatus(req.params.id, nextStatus);

    res.redirect('/staff/orders');

  } catch (error) {

    console.error(error);
    res.send('Error updating status');

  }
}

module.exports = {
  dashboard,
  getStats,
  getOrders,
  listOrders,
  updateOrderStatus
};