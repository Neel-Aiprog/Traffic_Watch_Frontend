// Vite environment variable for backend URL - falls back to localhost for development
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

/**
 * Calls POST /predict with the given event payload and session token.
 * Throws a SessionExpiredError if the backend returns 401, so callers
 * can distinguish "session expired, bounce to login" from other failures.
 */
export class SessionExpiredError extends Error {}

export async function predictSeverity(eventPayload, sessionToken) {
  const response = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionToken}`,
    },
    body: JSON.stringify(eventPayload),
  });

  if (response.status === 401) {
    throw new SessionExpiredError("Session expired or invalid.");
  }

  if (!response.ok) {
    // try to surface the backend's detail message if present
    let detail = `Request failed (${response.status})`;
    try {
      const errorBody = await response.json();
      if (errorBody.detail) detail = errorBody.detail;
    } catch {
      // response wasn't JSON -- keep the generic message
    }
    throw new Error(detail);
  }

  return response.json();
}

/**
 * Calls POST /logout with the given session token to invalidate the session.
 */
export async function logout(sessionToken) {
  const response = await fetch(`${BASE_URL}/logout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
    },
  });

  // Logout should always succeed (200) or fail silently - we don't throw on 401
  // as the session is already considered invalid
  if (!response.ok) {
    console.warn("Logout request failed:", response.status, await response.text());
  }
  // Return parsed JSON if available, otherwise empty object
  try {
    return await response.json();
  } catch {
    return {};
  }
}