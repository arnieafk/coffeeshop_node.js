function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  return next();
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    const user = req.session.user;

    if (!user) {
      return res.redirect('/login');
    }

    if (!roles.includes(user.role)) {
      return res.status(403).render('partials/error', {
        message: 'Access denied. You do not have permission to access this page.'
      });
    }

    return next();
  };
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) {
    const role = req.session.user.role;

    if (role === 'admin') return res.redirect('/admin');
    if (role === 'staff') return res.redirect('/staff');
    return res.redirect('/customer');
  }

  return next();
}

module.exports = {
  ensureAuthenticated,
  authorizeRole,
  redirectIfLoggedIn
};