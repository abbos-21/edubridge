/** Thin client for the EduBridge API: JSON in and out, cookie session, CSRF header on writes. */
const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api/v1';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const csrf = () => {
  const m = document.cookie.match(/(?:^|; )eb_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
};

export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (method !== 'GET') headers['x-csrf-token'] = csrf();
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, credentials: 'include', body: body === undefined ? undefined : JSON.stringify(body), signal });
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    throw new ApiError(0, 'network', 'The server could not be reached');
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) throw new ApiError(res.status, data?.error?.code ?? 'error', data?.error?.message ?? `HTTP ${res.status}`, data?.error?.details);
  return data;
}

export const apiUrl = (path) => BASE + path;
