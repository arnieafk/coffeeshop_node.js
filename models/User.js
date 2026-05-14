const db = require('../config/db'); // IMPORTANT: correct path

const User = {

  findByEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  create: async ({ name, email, password, role = 'customer', status = 'active' }) => {
    const [result] = await db.query(
      'INSERT INTO users (name, role, email, password, status) VALUES (?, ?, ?, ?, ?)',
      [name, role, email, password, status]
    );
    return result.insertId;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  getAllStaff: async () => {
    const [rows] = await db.query(
      `SELECT * FROM users
       WHERE role IN ('staff', 'barista', 'cashier')
       ORDER BY id DESC`
    );

    return rows;
  },

  update: async (id, data) => {
    const {
      name,
      email,
      role,
      status = 'active'
    } = data;

    await db.query(
      `UPDATE users
       SET name = ?, email = ?, role = ?, status = ?
       WHERE id = ?`,
      [name, email, role, status, id]
    );
  },

  remove: async (id) => {
    await db.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
  }

};

module.exports = User;