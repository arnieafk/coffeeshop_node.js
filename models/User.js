const db = require('../config/db'); // IMPORTANT: correct path 

const User = {

  /* =========================
     FIND USER BY EMAIL
  ========================= */
  findByEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  /* =========================
     CREATE USER (FIXED ROLE SYSTEM)
  ========================= */
  create: async ({ name, email, password, role = 'customer', status = 'active' }) => {

    // 🔥 FIX: allow all 3 roles
    const allowedRoles = ['admin', 'staff', 'customer'];

    const safeRole = allowedRoles.includes(role)
      ? role
      : 'customer';

    const [result] = await db.query(
      'INSERT INTO users (name, role, email, password, status) VALUES (?, ?, ?, ?, ?)',
      [name, safeRole, email, password, status]
    );

    // IMPORTANT: return insertId for session login
    return result.insertId;
  },

  /* =========================
     GET USER BY ID
  ========================= */
  getById: async (id) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  /* =========================
     GET ALL STAFF + ADMIN
  ========================= */
  getAllStaff: async () => {
    const [rows] = await db.query(
      `SELECT * FROM users
       WHERE role IN ('staff', 'admin')
       ORDER BY id DESC`
    );

    return rows;
  },

  /* =========================
     UPDATE USER
  ========================= */
  update: async (id, data) => {

  const {
    name,
    email,
    role,
    status
  } = data;

  const allowedRoles = ['admin', 'staff', 'customer'];
  const safeRole = allowedRoles.includes(role) ? role : 'customer';

  const safeName = name || '';
  const safeEmail = email || '';
  const safeStatus = status || 'active';

  await db.query(
    `UPDATE users
     SET name = ?, email = ?, role = ?, status = ?
     WHERE id = ?`,
    [safeName, safeEmail, safeRole, safeStatus, id]
  );
},

  /* =========================
     DELETE USER
  ========================= */
  remove: async (id) => {
    await db.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
  }

};

module.exports = User;