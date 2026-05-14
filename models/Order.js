const db = require('../config/db');

/* =========================
   MANILA TIMESTAMP
========================= */
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
   ADMIN: GET ALL ORDERS
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

  return rows || [];
}

/* =========================
   STAFF: GET ORDERS (WITH ITEMS)
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

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);

  // SAFE GUARD
  if (orderIds.length === 0) return orders;

  const [items] = await db.query(`
    SELECT
      oi.order_id,
      oi.quantity,
      p.name,
      p.price
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})
  `, orderIds);

  const grouped = {};

  for (const item of items || []) {
    if (!grouped[item.order_id]) grouped[item.order_id] = [];
    grouped[item.order_id].push(item);
  }

  for (const order of orders) {
    order.items = grouped[order.id] || [];
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

  if (!orders || orders.length === 0) return null;

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

  order.items = items || [];

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

  return rows || [];
}

/* =========================
   CREATE ORDER (FIXED STATUS CONSISTENCY)
========================= */
async function createOrder(userId, cartItems) {
  const createdAt = getManilaTimestamp();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let total = 0;

    for (const item of cartItems || []) {
      total += Number(item.price || 0) * Number(item.quantity || 0);
    }

    const [result] = await conn.query(`
      INSERT INTO orders (user_id, status, total, created_at)
      VALUES (?, ?, ?, ?)
    `, [userId, 'Pending', total, createdAt]); // FIXED HERE

    const orderId = result.insertId;

    for (const item of cartItems || []) {
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

  } catch (err) {
    await conn.rollback();
    throw err;

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

  return rows || [];
}

module.exports = {
  getAllWithUser,
  getAllForStaff,
  getById,
  getByUserId,
  createOrder,
  updateStatus,
  getOrderItems
};