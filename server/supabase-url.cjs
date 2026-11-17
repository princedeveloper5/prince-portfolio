function getProjectUrl(value) {
  const url = new URL(String(value));
  url.pathname = url.pathname.replace(/\/(?:rest\/v1|storage\/v1)\/?$/i, '').replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

module.exports = { getProjectUrl };
