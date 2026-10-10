// Gọi máy chủ. Token đăng nhập được lưu trong trình duyệt.
(function () {
  const KEY = 'nneko_token';
  let token = '';
  try { token = localStorage.getItem(KEY) || ''; } catch (_) {}

  async function call(method, url, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (e) {
      const err = new Error('Không kết nối được máy chủ. Hãy kiểm tra cửa sổ đang chạy "npm start".');
      err.network = true;
      throw err;
    }
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const err = new Error(data.error || 'Có lỗi xảy ra.');
      err.status = res.status; err.data = data;
      if (res.status === 401 && data.needLogin && window.App) window.App.onSessionExpired();
      throw err;
    }
    return data;
  }

  window.API = {
    get: url => call('GET', url),
    post: (url, body) => call('POST', url, body || {}),
    setToken(t) {
      token = t || '';
      try { token ? localStorage.setItem(KEY, token) : localStorage.removeItem(KEY); } catch (_) {}
    },
    hasToken() { return !!token; }
  };
})();
