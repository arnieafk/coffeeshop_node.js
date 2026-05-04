USE coffee_shop;

-- bcrypt hash for password: password123
INSERT INTO users (name, role, email, password) VALUES
('Admin User', 'admin', 'admin@coffee.com', '$2b$10$7f89UZodmMUtH7HfVjA1CeQdKyyL7QfK1mrySvy4Nf9THX2f8M7qy'),
('Staff User', 'staff', 'staff@coffee.com', '$2b$10$7f89UZodmMUtH7HfVjA1CeQdKyyL7QfK1mrySvy4Nf9THX2f8M7qy'),
('Customer User', 'customer', 'customer@coffee.com', '$2b$10$7f89UZodmMUtH7HfVjA1CeQdKyyL7QfK1mrySvy4Nf9THX2f8M7qy');

INSERT INTO products (name, price, description) VALUES
('Espresso', 3.50, 'Strong and bold single-shot coffee.'),
('Cappuccino', 4.50, 'Espresso with steamed milk and foam.'),
('Latte', 4.80, 'Smooth espresso with creamy milk.'),
('Mocha', 5.20, 'Chocolate flavored coffee with milk.');
