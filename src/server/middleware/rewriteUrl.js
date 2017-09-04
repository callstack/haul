function rewriteUrl(req, res, next) {
  req.url = req.url.replace(/\.bundle/, '.bundle.js');
  next();
}

module.exports = rewriteUrl;
