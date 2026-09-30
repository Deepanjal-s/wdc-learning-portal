const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload.message || 'The request could not be completed.', response.status);
  return payload;
}
