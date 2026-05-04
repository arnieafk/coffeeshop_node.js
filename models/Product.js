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
    return []; // Return empty array to prevent crash
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
   EXPORTS
========================= */
module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};