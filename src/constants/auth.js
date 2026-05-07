export const AUTH_STORAGE_KEY = "sw_logged_in";
export const TOKEN_STORAGE_KEY = "sw_token";

// Set auth flag (true/false) into localStorage if `remember` is true,
// otherwise into sessionStorage. Also remove the flag from the other
// storage to keep state consistent.
export function setAuth(isLoggedIn, remember = false) {
  if (isLoggedIn) {
    if (remember) {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } else {
    // clear from both
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getAuth() {
  return (
    localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    sessionStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem("sw_userName");
  sessionStorage.removeItem("sw_userName");
}

export function setToken(token, remember = false) {
  if (!token) return;
  if (remember) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getToken() {
  return (
    localStorage.getItem(TOKEN_STORAGE_KEY) ||
    sessionStorage.getItem(TOKEN_STORAGE_KEY) ||
    null
  );
}

export function setUserName(name, remember = false) {
  if (!name) return;
  if (remember) {
    localStorage.setItem("sw_userName", name);
    sessionStorage.removeItem("sw_userName");
  } else {
    sessionStorage.setItem("sw_userName", name);
    localStorage.removeItem("sw_userName");
  }
}

export function getUserName() {
  return (
    localStorage.getItem("sw_userName") ||
    sessionStorage.getItem("sw_userName") ||
    null
  );
}
