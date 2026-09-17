const API_BASE = "https://paper-of-love-backend.fly.dev/api";
const TOKEN_KEY = "editorToken";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiRequest(path, options) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // no body
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const api = {
  async login(password) {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ role: "editor", password }),
    });
    setToken(result.token);
    return result;
  },

  async logout() {
    setToken(null);
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (e) {
      // token already cleared client-side; server call is best-effort
    }
  },

  me() {
    return apiRequest("/auth/me?role=editor");
  },

  listPosts(status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiRequest(`/posts${query}`);
  },

  getPost(id) {
    return apiRequest(`/posts/${id}`);
  },

  updatePost(id, { title, byline, image, body }) {
    return apiRequest(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, byline, image, body }),
    });
  },

  publishPost(id) {
    return apiRequest(`/posts/${id}/publish`, { method: "POST" });
  },

  unpublishPost(id) {
    return apiRequest(`/posts/${id}/unpublish`, { method: "POST" });
  },

  returnPost(id, comment) {
    return apiRequest(`/posts/${id}/return`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    });
  },
};
