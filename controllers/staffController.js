const Order = require('../models/Order');


async function listOrders(req, res) {

  try {

    const orders = await Order.getAllForStaff();

    res.render('staff/orders', {
      orders,
      user: req.session.user
    });

  } catch (error) {
    console.error(error);
    res.send('Error loading staff orders');
  }
}


async function updateOrderStatus(req, res) {
  try {

    let { status } = req.body;

    // 🔥 FORCE STANDARD FORMAT
    const map = {
      pending: 'Pending',
      preparing: 'Preparing',
      completed: 'Completed',
      Pending: 'Pending',
      Preparing: 'Preparing',
      Completed: 'Completed'
    };

    status = map[status];

    if (!status) {
      return res.redirect('/staff/orders');
    }

    await Order.updateStatus(req.params.id, status);

    res.redirect('/staff/orders');

  } catch (error) {
    console.error(error);
    res.send('Error updating status');
  }
}


module.exports = {
  listOrders,
  updateOrderStatus
};