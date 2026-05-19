module.exports = function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server xatosi' });
};
