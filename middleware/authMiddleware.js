function ensureAuthenticated(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  return next();
}

function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user || !roles.includes(req.session.user.role)) {
      return res.status(403).render('partials/error', { message: 'Access denied.' });
    }
    return next();
  };
}

module.exports = { ensureAuthenticated, authorizeRole };
