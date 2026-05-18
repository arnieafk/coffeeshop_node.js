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

  const db = require('../config/db');

  await db.query(`
    UPDATE payments
    SET status = 'Paid'
    WHERE order_id = ?
  `, [orderId]);

  await db.query(`
    UPDATE orders
    SET status = 'Pending'
    WHERE id = ?
  `, [orderId]);

}

module.exports = {
  getAll,
  markAsPaid
};