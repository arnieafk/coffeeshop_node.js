-- ============================================
-- AIVEN MYSQL SCHEMA (defaultdb)
-- Fully compatible with mysql2/promise
-- ============================================

-- USERS TABLE (REQUIRED)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('Pending', 'Preparing', 'Completed') DEFAULT 'Pending',
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  status VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- SAMPLE DATA (IMPORTANT)
-- =========================

-- USERS (password: password123 -> bcrypt hash)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@coffee.com', '$2b$10$7f89UZodmMUtH7HfVjA1CeQdKyyL7QfK1mrySvy4Nf9THX2f8M7qy', 'admin'),
('Staff User', 'staff@coffee.com', '$2b$10$7f89UZodmMUtH7HfVjA1CeQdKyyL7QfK1mrySvy4Nf9THX2f8M7qy', 'staff'),
('Customer User', 'customer@coffee.com', '$2b$10$7f89UZodmMUtH7HfVjA1CeQdKyyL7QfK1mrySvy4Nf9THX2f8M7qy', 'customer');

-- PRODUCTS
INSERT INTO products (name, price, description) VALUES
('Espresso', 3.50, 'Strong and bold single-shot coffee.'),
('Cappuccino', 4.50, 'Espresso with steamed milk and foam.'),
('Latte', 4.80, 'Smooth espresso with creamy milk.'),
('Mocha', 5.20, 'Chocolate flavored coffee with milk.');

-- SAMPLE ORDER
INSERT INTO orders (user_id, status, total) VALUES
(3, 'Pending', 230.00);

-- ORDER ITEMS
INSERT INTO order_items (order_id, product_id, quantity) VALUES
(1, 1, 1),
(1, 2, 1);

-- PAYMENT
INSERT INTO payments (order_id, status) VALUES
(1, 'Unverified');