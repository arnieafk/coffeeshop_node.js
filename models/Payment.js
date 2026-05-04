const db = require('../config/db');

async function getAll() {
  try {
    const [rows] = await db.query(
      `SELECT p.*, o.id AS order_id, u.name AS customer_name
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       JOIN users u ON u.id = o.user_id
       ORDER BY p.id DESC`
    );
    return rows;
  } catch (error) {
    console.error('[PAYMENT ERROR] Failed to fetch payments:', error.message);
    return []; // Return empty array to prevent crash
  }
}

module.exports = { getAll };
