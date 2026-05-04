# Coffee Shop Management System (Node.js + Express + MySQL)

## Project Structure

```
coffeeshop_node.js/
+-- app.js
+-- .env
+-- config/
¦   +-- db.js
+-- controllers/
¦   +-- adminController.js
¦   +-- authController.js
¦   +-- customerController.js
¦   +-- staffController.js
+-- middleware/
¦   +-- authMiddleware.js
+-- models/
¦   +-- Order.js
¦   +-- Payment.js
¦   +-- Product.js
¦   +-- User.js
+-- public/
¦   +-- css/
¦       +-- style.css
+-- routes/
¦   +-- adminRoutes.js
¦   +-- authRoutes.js
¦   +-- customerRoutes.js
¦   +-- staffRoutes.js
+-- sql/
¦   +-- schema.sql
¦   +-- seed.sql
+-- views/
    +-- admin/
    +-- auth/
    +-- customer/
    +-- staff/
    +-- partials/
```

## Features Included

- MVC architecture with clean separation
- Session-based login/logout
- Role-based access for admin, staff, customer
- Admin:
  - Manage products (CRUD)
  - View all orders
  - View payment verification list
- Staff:
  - View all orders
  - Update order status (Pending, Preparing, Completed)
- Customer:
  - View menu
  - Add/remove cart items
  - Place orders
  - Track own order statuses

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create MySQL database and tables:

```bash
mysql -u root -p < sql/schema.sql
```

3. Insert seed data:

```bash
mysql -u root -p < sql/seed.sql
```

4. Configure `.env` values for your MySQL credentials.

5. Run the app:

```bash
npm run dev
```

or

```bash
npm start
```

6. Open:

- http://localhost:3000/login

## Test Accounts

All accounts use password: `password123`

- Admin: `admin@coffee.com`
- Staff: `staff@coffee.com`
- Customer: `customer@coffee.com`
