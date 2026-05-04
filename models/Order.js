const db = require('../config/db');

/* =========================
   GET ALL ORDERS (ADMIN)
========================= */
async function getAllWithUser() {
  const [rows] = await db.query(`
    SELECT 
      o.*,
      u.name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
  `);

  return rows;
}

/* =========================
   GET ALL ORDERS (STAFF SAFE)
========================= */
async function getAllForStaff() {
  const [orders] = await db.query(`
    SELECT
      o.id,
      o.status,
      IFNULL(o.total, 0) AS total,
      o.created_at,
      u.name AS customer_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.id DESC
  `);

  for (let order of orders) {
    const [items] = await db.query(`
      SELECT 
        oi.quantity,
        p.name,
        p.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `, [order.id]);

    order.items = items;
  }

  return orders;
}

/* =========================
   GET SINGLE ORDER
========================= */
async function getById(orderId) {
  const [orders] = await db.query(`
    SELECT
      o.*,
      u.name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = ?
  `, [orderId]);

  if (!orders.length) return null;

  const order = orders[0];

  const [items] = await db.query(`
    SELECT
      oi.quantity,
      p.name,
      p.price
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `, [orderId]);

  order.items = items;

  return order;
}

/* =========================
   GET CUSTOMER ORDERS
========================= */
async function getByUserId(userId) {
  const [rows] = await db.query(`
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
  `, [userId]);

  return rows;
}

/* =========================
   CREATE ORDER (TRANSACTION SAFE)
========================= */
async function createOrder(userId, cartItems) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let total = 0;

    for (const item of cartItems) {
      total += Number(item.price) * Number(item.quantity);
    }

    const [orderResult] = await conn.query(`
      INSERT INTO orders (user_id, status, total)
      VALUES (?, ?, ?)
    `, [userId, 'Pending', total]);

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await conn.query(`
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [orderId, item.id, item.quantity]);
    }

    await conn.query(`
      INSERT INTO payments (order_id, status)
      VALUES (?, ?)
    `, [orderId, 'Waiting Verification']);

    await conn.commit();
    return orderId;

  } catch (error) {
    await conn.rollback();
    throw error;

  } finally {
    conn.release();
  }
}

/* =========================
   UPDATE ORDER STATUS
========================= */
async function updateStatus(orderId, status) {
  await db.query(`
    UPDATE orders
    SET status = ?
    WHERE id = ?
  `, [status, orderId]);
}

/* =========================
   GET ORDER ITEMS
========================= */
async function getOrderItems(orderId) {
  const [rows] = await db.query(`
    SELECT
      oi.quantity,
      p.name,
      p.price
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `, [orderId]);

  return rows;
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  getAllWithUser,
  getAllForStaff,
  getById,
  getByUserId,
  createOrder,
  updateStatus,
  getOrderItems
};