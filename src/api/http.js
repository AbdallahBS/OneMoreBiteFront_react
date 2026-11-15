const DEFAULT_API_BASE_URL = 'http://localhost:8081';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Small fetch wrapper around the Java API.
 * The backend returns `{ "erreur": "..." }` on failures.
 */
export async function apiRequest(path, { method = 'GET', body, token, signal } = {}) {
  const headers = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(
      `Impossible de joindre le serveur One More Bite (${API_BASE_URL}). Vérifiez que le backend Java est démarré.`,
      0,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.erreur || payload.message)) ||
      (typeof payload === 'string' && payload) ||
      `Erreur HTTP ${response.status}.`;

    throw new ApiError(message, response.status, payload);
  }

  return payload;
}
