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
      u.email AS customer_email,
      s.name AS assigned_staff_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN users s ON s.id = o.assigned_staff_id
    ORDER BY o.id DESC
  `);

  return rows || [];
}

/* =========================
   STAFF: GET ASSIGNED ORDERS
========================= */
async function getAllForStaff(staffId) {

  const [orders] = await db.query(`
    SELECT
      o.id,
      o.status,
      IFNULL(o.total, 0) AS total,
      o.created_at,
      o.assigned_staff_id,
      u.name AS customer_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.assigned_staff_id = ?
    ORDER BY o.id DESC
  `, [staffId]);

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);

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
      p.price,
      p.id AS product_id
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
   CREATE ORDER (FINAL SAFE INVENTORY FIX)
========================= */
async function createOrder(userId, cartItems) {
  const createdAt = getManilaTimestamp();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    let total = 0;

    /* =========================
       STEP 1: VALIDATE STOCK FIRST
    ========================= */
    for (const item of cartItems || []) {
      const [product] = await conn.query(
        'SELECT stock FROM products WHERE id = ? FOR UPDATE',
        [item.id]
      );

      if (!product[0]) {
        throw new Error(`Product not found (ID ${item.id})`);
      }

      if (product[0].stock < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.id}`);
      }

      total += Number(item.price || 0) * Number(item.quantity || 0);
    }

    /* =========================
       STEP 2: CREATE ORDER
    ========================= */
    const [result] = await conn.query(`
      INSERT INTO orders (
        user_id,
        status,
        total,
        created_at,
        assigned_staff_id
      )
      VALUES (?, ?, ?, ?, NULL)
    `, [userId, 'Pending', total, createdAt]);

    const orderId = result.insertId;

    /* =========================
       STEP 3: INSERT ITEMS + DEDUCT STOCK SAFELY
    ========================= */
    for (const item of cartItems || []) {

      await conn.query(`
        INSERT INTO order_items (order_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [orderId, item.id, item.quantity]);

      await conn.query(`
        UPDATE products
        SET stock = stock - ?
        WHERE id = ?
      `, [item.quantity, item.id]);
    }

    /* =========================
       STEP 4: PAYMENT INIT
    ========================= */
    await conn.query(`
      INSERT INTO payments (order_id, status, created_at)
      VALUES (?, ?, ?)
    `, [orderId, 'Pending', createdAt]);

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

  const allowedFlow = ['Pending', 'Preparing', 'Completed'];

  if (!allowedFlow.includes(status)) {
    throw new Error('Invalid status');
  }

  const [rows] = await db.query(
    'SELECT status FROM orders WHERE id = ?',
    [orderId]
  );

  const current = rows[0]?.status;

  if (current === 'Pending' && status === 'Completed') {
    throw new Error('Cannot skip Preparing stage');
  }

  await db.query(`
    UPDATE orders
    SET status = ?
    WHERE id = ?
  `, [status, orderId]);
}

/* =========================
   ASSIGN STAFF
========================= */
async function assignStaff(orderId, staffId) {
  await db.query(`
    UPDATE orders
    SET assigned_staff_id = ?
    WHERE id = ?
  `, [staffId, orderId]);
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
  getOrderItems,
  assignStaff
};