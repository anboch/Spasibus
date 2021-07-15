module.exports = function (app) { // обрабатывает 404 и 500 ошибки
  app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error);
  });

  app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.render('error', { error });
  });

  return app;
};
