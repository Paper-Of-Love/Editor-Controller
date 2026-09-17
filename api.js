const API_BASE = "http://localhost:4000/api";

async function apiRequest(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
  login(password) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ role: "editor", password }),
    });
  },

  logout() {
    return apiRequest("/auth/logout", { method: "POST" });
  },

  me() {
    return apiRequest("/auth/me");
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
