const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // First check existing users
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`[DB] Current users in database: ${existing[0].count}`);

    // Generate bcrypt hash for password123
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`[BCRYPT] Hash for "${password}": ${hashedPassword}`);

    // Clear existing users (optional - comment out if you want to keep them)
    // await connection.query('DELETE FROM users WHERE email IN ("admin@coffee.com", "staff@coffee.com", "customer@coffee.com")');

    // Insert test users with proper bcrypt hash
    const testUsers = [
      { name: 'Admin User', email: 'admin@coffee.com', password: hashedPassword, role: 'admin' },
      { name: 'Staff User', email: 'staff@coffee.com', password: hashedPassword, role: 'staff' },
      { name: 'Customer User', email: 'customer@coffee.com', password: hashedPassword, role: 'customer' }
    ];

    for (const user of testUsers) {
      try {
        await connection.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [user.name, user.email, user.password, user.role]
        );
        console.log(`[✓] Inserted: ${user.email}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`[!] Already exists: ${user.email}`);
        } else {
          throw error;
        }
      }
    }

    // Verify
    const [users] = await connection.query('SELECT id, name, email, role FROM users');
    console.log('\n[DB] Users in database:');
    console.table(users);

    console.log('\n[✓] Seed complete! You can now login with:');
    console.log(`  Email: admin@coffee.com | Password: ${password}`);
    console.log(`  Email: staff@coffee.com | Password: ${password}`);
    console.log(`  Email: customer@coffee.com | Password: ${password}`);

  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    await connection.end();
  }
})();
