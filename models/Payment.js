const db = require('../config/db');

/* =========================
   GET ALL PAYMENTS (ADMIN)
========================= */
async function getAll() {
  try {
    const [rows] = await db.query(
      `SELECT 
         p.*,
         o.id AS order_id,
         o.status AS order_status,
         u.name AS customer_name
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       JOIN users u ON u.id = o.user_id
       ORDER BY p.id DESC`
    );

    return rows || [];
  } catch (error) {
    console.error('[PAYMENT ERROR] Failed to fetch payments:', error.message);
    return [];
  }
}

/* =========================
   MARK PAYMENT AS PAID
========================= */
async function markAsPaid(orderId) {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // update payment
    await conn.query(
      `UPDATE payments
       SET status = 'Paid'
       WHERE order_id = ?`,
      [orderId]
    );

    // optional but IMPORTANT: also update order status
    await conn.query(
      `UPDATE orders
       SET status = 'Completed'
       WHERE id = ?`,
      [orderId]
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    console.error('[PAYMENT ERROR] Failed to mark as paid:', error.message);
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  getAll,
  markAsPaid
};