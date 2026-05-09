const db = require('../config/db');

function getManilaTimestamp() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const normalized = {};
  parts.forEach(({ type, value }) => {
    if (type !== 'literal') normalized[type] = value;
  });

  return `${normalized.year}-${normalized.month}-${normalized.day} ${normalized.hour}:${normalized.minute}:${normalized.second}`;
}

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
   GET ALL ORDERS (STAFF OPTIMIZED)
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

  if (!orders.length) {
    return [];
  }

  const orderIds = orders.map(order => order.id);

  const [items] = await db.query(`
    SELECT
      oi.order_id,
      oi.quantity,
      p.name,
      p.price
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id IN (?)
  `, [orderIds]);

  const groupedItems = {};

  items.forEach(item => {

    if (!groupedItems[item.order_id]) {
      groupedItems[item.order_id] = [];
    }

    groupedItems[item.order_id].push(item);

  });

  orders.forEach(order => {
    order.items = groupedItems[order.id] || [];
  });

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

  if (!orders.length) {
    return null;
  }

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
    SELECT *
    FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
  `, [userId]);

  return rows;
}

/* =========================
   CREATE ORDER (TRANSACTION SAFE)
========================= */
async function createOrder(userId, cartItems) {

  const createdAt = getManilaTimestamp();
  const conn = await db.getConnection();

  try {

    await conn.beginTransaction();

    let total = 0;

    for (const item of cartItems) {
      total += Number(item.price) * Number(item.quantity);
    }

    const [orderResult] = await conn.query(`
      INSERT INTO orders (user_id, status, total, created_at)
      VALUES (?, ?, ?, ?)
    `, [userId, 'pending', total, createdAt]);

    const orderId = orderResult.insertId;

    for (const item of cartItems) {

      await conn.query(`
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [orderId, item.id, item.quantity]);

    }

    await conn.query(`
      INSERT INTO payments (order_id, status, created_at)
      VALUES (?, ?, ?)
    `, [orderId, 'Waiting Verification', createdAt]);

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