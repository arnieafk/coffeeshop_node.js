const bcrypt = require('bcryptjs');
const User = require('../models/User');

function showLogin(req, res) {
  if (req.session.user) {
    return res.redirect(getDashboard(req.session.user.role));
  }
  return res.render('auth/login', { error: null });
}

function showRegister(req, res) {
  if (req.session.user) {
    return res.redirect(getDashboard(req.session.user.role));
  }
  return res.render('auth/register', { error: null });
}

/* =========================
   REGISTER
========================= */
async function register(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.render('auth/register', {
        error: 'All fields are required.'
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        error: 'Passwords do not match.'
      });
    }

    const existingUser = await User.findByEmail(email.trim().toLowerCase());
    if (existingUser) {
      return res.render('auth/register', {
        error: 'Email is already registered.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: 'customer' // DEFAULT ROLE
    });

    return res.redirect('/login');

  } catch (error) {
    console.error('[REGISTER ERROR]', error.message);
    return res.render('auth/register', {
      error: 'Registration failed. Please try again.'
    });
  }
}

/* =========================
   LOGIN
========================= */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        error: 'Email and password are required.'
      });
    }

    const user = await User.findByEmail(email.trim().toLowerCase());

    if (!user) {
      return res.render('auth/login', {
        error: 'Invalid email or password.'
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.render('auth/login', {
        error: 'Invalid email or password.'
      });
    }

    // SESSION
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'customer'
    };

    req.session.save(() => {
      return res.redirect(getDashboard(user.role));
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error.message);
    return res.render('auth/login', {
      error: 'Login failed. Try again.'
    });
  }
}

/* =========================
   LOGOUT
========================= */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.redirect('/');

    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
}

/* =========================
   ROLE REDIRECT HELPER
========================= */
function getDashboard(role) {
  if (role === 'admin') return '/admin';
  if (role === 'staff') return '/staff';
  return '/customer';
}

module.exports = {
  showLogin,
  showRegister,
  register,
  login,
  logout
};