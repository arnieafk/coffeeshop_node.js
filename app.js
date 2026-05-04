const express = require('express');
const session = require('express-session');
const path = require('path');
const dns = require('dns').promises;
require('dotenv').config();

dns.setServers(['1.1.1.1', '8.8.8.8']);

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const customerRoutes = require('./routes/customerRoutes');
const db = require('./config/db');

const app = express();

/* ======================
   VIEW ENGINE SETUP
====================== */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ======================
   MIDDLEWARES
====================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ======================
   SESSION CONFIG
====================== */
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours session
    },
  })
);

/* ======================
   GLOBAL USER ACCESS
====================== */
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

/* ======================
   HOME ROUTE (ROLE REDIRECT)
====================== */
app.get('/', (req, res) => {
  const user = req.session.user;

  if (!user) return res.redirect('/login');

  const roleHome = {
    admin: '/admin',
    staff: '/staff',
    customer: '/customer',
  };

  return res.redirect(roleHome[user.role] || '/login');
});

/* ======================
   ROUTES
====================== */
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/staff', staffRoutes);
app.use('/customer', customerRoutes);

/* ======================
   404 HANDLER
====================== */
app.use((req, res) => {
  res.status(404).render('partials/error', {
    message: 'Page not found.',
  });
});

/* ======================
   SERVER START
====================== */
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    console.log('DB host:', process.env.DB_HOST);
    console.log('DB port:', process.env.DB_PORT);
    console.log('App port:', PORT);

    await dns.lookup(process.env.DB_HOST);
    await db.testConnection();
    console.log('Aiven MySQL connection successful.');

    await db.initializeSchema();
    console.log('[DB] Schema initialization complete.');

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to Aiven MySQL.');
    console.error('Host:', process.env.DB_HOST);
    console.error('Port:', process.env.DB_PORT);
    console.error('Error:', error.message);
    process.exit(1);
  }
}

startServer();