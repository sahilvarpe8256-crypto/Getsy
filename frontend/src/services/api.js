const API_BASE = '/api/v1';

export async function fetchApi(path, options = {}) {
  const token = localStorage.getItem('getsy_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle Token Expiry Auto-Refresh
  if (response.status === 401 && token && !options._isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetchApi(path, { ...options, _isRetry: true });
    } else {
      localStorage.removeItem('getsy_token');
      localStorage.removeItem('getsy_refresh');
      localStorage.removeItem('getsy_user');
      window.dispatchEvent(new Event('getsy-logout'));
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('getsy_refresh');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('getsy_token', data.accessToken);
    return true;
  } catch {
    return false;
  }
}
