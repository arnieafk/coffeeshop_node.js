const db = require('../config/db');
const bcrypt = require('bcryptjs');

const Staff = {

  // READ STAFF (from users table)
  async getAll() {
    const [rows] = await db.query(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE role = 'staff'
      ORDER BY id DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await db.query(`
      SELECT id, name, email, role
      FROM users
      WHERE id = ? AND role = 'staff'
    `, [id]);

    return rows[0];
  },

  // CREATE STAFF → USERS TABLE (IMPORTANT FIX)
  async create(data) {
    const { name, role, status, email, password } = data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'staff')
    `, [
      name,
      email,
      hashedPassword
    ]);

    return result.insertId;
  },

  // UPDATE STAFF
  async update(id, data) {
    const { name, email } = data;

    await db.query(`
      UPDATE users
      SET name = ?, email = ?
      WHERE id = ? AND role = 'staff'
    `, [name, email, id]);
  },

  // DELETE STAFF
  async remove(id) {
    await db.query(`
      DELETE FROM users
      WHERE id = ? AND role = 'staff'
    `, [id]);
  }

};

module.exports = Staff;