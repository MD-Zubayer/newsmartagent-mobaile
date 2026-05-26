// /home/md-zubayer/newsmartagent/newsmartagent-mobaile/src/lib/api.js
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "https://newsmartagent.com/api").replace(/\/$/, "");

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && (data.error || data.detail)) ||
      (typeof data === "string" ? data : "Request failed");
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
