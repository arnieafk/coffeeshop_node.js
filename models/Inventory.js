const db = require('../config/db');

/* =========================
   GET ALL INVENTORY
========================= */
async function getAll() {
  const [rows] = await db.query(`
    SELECT *
    FROM inventory
    ORDER BY id DESC
  `);

  return rows || [];
}

/* =========================
   GET INVENTORY BY ID
========================= */
async function getById(id) {
  const [rows] = await db.query(`
    SELECT *
    FROM inventory
    WHERE id = ?
  `, [id]);

  return rows[0];
}

/* =========================
   CREATE INVENTORY
========================= */
async function create(data) {
  const {
    product_name,
    stock,
    unit
  } = data;

  await db.query(`
    INSERT INTO inventory (
      product_name,
      stock,
      unit
    )
    VALUES (?, ?, ?)
  `, [
    product_name,
    stock,
    unit
  ]);
}

/* =========================
   UPDATE INVENTORY
========================= */
async function update(id, data) {
  const {
    product_name,
    stock,
    unit
  } = data;

  await db.query(`
    UPDATE inventory
    SET
      product_name = ?,
      stock = ?,
      unit = ?
    WHERE id = ?
  `, [
    product_name,
    stock,
    unit,
    id
  ]);
}

/* =========================
   DELETE INVENTORY
========================= */
async function remove(id) {
  await db.query(`
    DELETE FROM inventory
    WHERE id = ?
  `, [id]);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};