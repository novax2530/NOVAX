const FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Session token lives in memory only (never localStorage). The app re-runs
// `auth` with Telegram initData each time it opens, so nothing needs persisting.
let sessionToken = null;
let reauth = null; // set by App: () => Promise<void> that refreshes the token

export function setToken(token) {
  sessionToken = token;
}

export function clearToken() {
  sessionToken = null;
}

export function setReauthHandler(fn) {
  reauth = fn;
}

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(action, payload) {
  let res;
  try {
    res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, "NETWORK");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
  }
  return data;
}

export async function callApi(action, payload = {}) {
  try {
    return await request(action, payload);
  } catch (e) {
    // Token expired: refresh once and retry (never for `auth` itself).
    if (e.status === 401 && action !== "auth" && reauth) {
      await reauth();
      return request(action, payload);
    }
    throw e;
  }
}
