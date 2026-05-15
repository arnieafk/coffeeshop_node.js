const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { redirectIfLoggedIn } = require('../middleware/authMiddleware');

/* =========================
   AUTH PAGES
========================= */

// if logged in → redirect dashboard automatically
router.get('/login', redirectIfLoggedIn, authController.showLogin);
router.get('/register', redirectIfLoggedIn, authController.showRegister);

/* =========================
   AUTH ACTIONS
========================= */
router.post('/login', authController.login);
router.post('/register', authController.register);

/* =========================
   LOGOUT
========================= */
router.get('/logout', authController.logout);

module.exports = router;