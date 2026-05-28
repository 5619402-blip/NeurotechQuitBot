let _url = null;

module.exports = {
  set(url) { _url = url; },
  get() { return _url || process.env.BOTHOST_API_URL || null; },
};
