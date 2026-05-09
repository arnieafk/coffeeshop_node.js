const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: '+08:00',
  dateStrings: true,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

pool.testConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
};

pool.initializeSchema = async () => {
  const connection = await pool.getConnection();
  try {
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createUsersTable);
    console.log('[DB] Users table initialized.');

    // Create products table
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createProductsTable);
    console.log('[DB] Products table initialized.');

    // Ensure description column exists (for backward compatibility)
    try {
      await connection.execute(`ALTER TABLE products ADD COLUMN description TEXT`);
      console.log('[DB] Products table description column added.');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('[DB] Description column already exists.');
      } else {
        console.log('[DB] Info: ', error.message);
      }
    }

    // Create orders table
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        status ENUM('Pending', 'Preparing', 'Completed') DEFAULT 'Pending',
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createOrdersTable);
    console.log('[DB] Orders table initialized.');

    // Ensure total column exists (for backward compatibility)
    try {
      await connection.execute(`ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) DEFAULT 0`);
      console.log('[DB] Orders table total column added.');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('[DB] Total column already exists.');
      } else {
        console.log('[DB] Error adding total column:', error.message);
      }
    }

    // Ensure status column has correct enum values
    try {
      await connection.execute(`ALTER TABLE orders MODIFY status ENUM('Pending', 'Preparing', 'Completed') DEFAULT 'Pending'`);
      console.log('[DB] Orders table status enum updated.');
    } catch (error) {
      console.log('[DB] Error updating status enum:', error.message);
    }

    // Create order_items table
    const createOrderItemsTable = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createOrderItemsTable);
    console.log('[DB] Order items table initialized.');

    // Create payments table
    const createPaymentsTable = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createPaymentsTable);
    console.log('[DB] Payments table initialized.');

    // Seed products if empty
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const productCount = countResult[0].count;

    if (productCount === 0) {
      const seedProducts = [
        ['Coffee', 3.50, 100],
        ['Latte', 4.50, 50],
        ['Cappuccino', 4.00, 75]
      ];

      for (const [name, price, stock] of seedProducts) {
        await connection.execute(
          'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)',
          [name, price, stock]
        );
      }
      console.log('[DB] Sample products seeded.');
    }

    return true;
  } catch (error) {
    console.error('[DB ERROR] Failed to initialize schema:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = pool;