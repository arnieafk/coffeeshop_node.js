const db = require('../config/db'); // IMPORTANT: correct path 

const User = {

  findByEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  create: async ({ name, email, password, role = 'staff', status = 'active' }) => {

    // ✅ ONLY admin or staff allowed
    const allowedRoles = ['admin', 'staff'];

    const safeRole = allowedRoles.includes(role)
      ? role
      : 'staff';

    const [result] = await db.query(
      'INSERT INTO users (name, role, email, password, status) VALUES (?, ?, ?, ?, ?)',
      [name, safeRole, email, password, status]
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
       WHERE role IN ('staff', 'admin')
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

    // ✅ ONLY admin or staff allowed
    const allowedRoles = ['admin', 'staff'];

    const safeRole = allowedRoles.includes(role)
      ? role
      : 'staff';

    await db.query(
      `UPDATE users
       SET name = ?, email = ?, role = ?, status = ?
       WHERE id = ?`,
      [name, email, safeRole, status, id]
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