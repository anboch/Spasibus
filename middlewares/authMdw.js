function notLogin(req, res, next) {
  if (req.session.userId) {
    res.redirect('/');
  }
  next();
}

function isLogin(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/');
}

module.exports = { isLogin, notLogin };
