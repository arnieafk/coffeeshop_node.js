const db = require('../config/db');

/* =========================
   GET ALL PRODUCTS
========================= */
async function getAll() {
  try {
    const [rows] = await db.query(`
      SELECT * FROM products
      ORDER BY id DESC
    `);
    return rows;
  } catch (error) {
    console.error('[PRODUCT ERROR] Failed to fetch products:', error.message);
    return [];
  }
}

/* =========================
   GET PRODUCT BY ID
========================= */
async function getById(id) {
  try {
    const [rows] = await db.query(`
      SELECT * FROM products
      WHERE id = ?
    `, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error('[PRODUCT ERROR] Failed to fetch product by ID:', error.message);
    return null;
  }
}

/* =========================
   CREATE PRODUCT
========================= */
async function create(product) {
  const name = String(product.name || '').trim();
  const price = Number(product.price);
  const stock = product.stock != null ? Number(product.stock) : 0;
  const description = String(product.description || '').trim();

  const [result] = await db.query(`
    INSERT INTO products (name, price, stock, description)
    VALUES (?, ?, ?, ?)
  `, [name, price, stock, description]);

  return result.insertId;
}

/* =========================
   UPDATE PRODUCT
========================= */
async function update(id, product) {
  const name = String(product.name || '').trim();
  const price = Number(product.price);
  const stock = product.stock != null ? Number(product.stock) : 0;
  const description = String(product.description || '').trim();

  await db.query(`
    UPDATE products
    SET name = ?, price = ?, stock = ?, description = ?
    WHERE id = ?
  `, [name, price, stock, description, id]);
}

/* =========================
   REMOVE PRODUCT
========================= */
async function remove(id) {
  await db.query(`
    DELETE FROM products
    WHERE id = ?
  `, [id]);
}

/* =========================
   🔥 RESTOCK FUNCTION (ADMIN FEATURE)
========================= */
async function restock(id, qty, userId = null) {
  const quantity = Number(qty || 0);

  if (quantity <= 0) return;

  await db.query(`
    UPDATE products
    SET stock = stock + ?
    WHERE id = ?
  `, [quantity, id]);

  // 🔥 LOG RESTOCK
  await db.query(`
    INSERT INTO stock_logs (product_id, user_id, quantity, action, created_at)
    VALUES (?, ?, ?, 'restock', NOW())
  `, [id, userId, quantity]);
}

/* =========================
   🔥 LOW STOCK CHECK (OPTIONAL USE IN UI)
========================= */
async function getLowStock(threshold = 5) {
  const [rows] = await db.query(`
    SELECT * FROM products
    WHERE stock <= ?
    ORDER BY stock ASC
  `, [threshold]);

  return rows;
}

/* =========================
    🔥 STOCK LOGGING (OPTIONAL FOR AUDIT TRAIL)
========================= */
async function logRestock(productId, userId, qty) {
  await db.query(`
    INSERT INTO stock_logs (product_id, user_id, quantity, action, created_at)
    VALUES (?, ?, ?, 'restock', NOW())
  `, [productId, userId, qty]);
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  restock,
  getLowStock
};