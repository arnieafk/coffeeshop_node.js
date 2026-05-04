const db = require('../config/db'); // IMPORTANT: correct path

const User = {

  findByEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  create: async ({ name, email, password, role = 'customer' }) => {
    const [result] = await db.query(
      'INSERT INTO users (name, role, email, password) VALUES (?, ?, ?, ?)',
      [name, role, email, password]
    );
    return result.insertId;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

};

module.exports = User;