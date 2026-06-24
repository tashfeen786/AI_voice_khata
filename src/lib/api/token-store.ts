const ACCESS_KEY = "smartdukaan.access_token";
const REFRESH_KEY = "smartdukaan.refresh_token";
const TENANT_KEY = "smartdukaan.tenant";
const REMEMBER_KEY = "smartdukaan.remember_username";

export const tokenStore = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  setAccessToken(token: string | null, expiresInSeconds = 3600): void {
    if (token) {
      localStorage.setItem(ACCESS_KEY, token);
      localStorage.setItem("smartdukaan.access_token_expires", String(Date.now() + expiresInSeconds * 1000));
    } else {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem("smartdukaan.access_token_expires");
    }
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  setRefreshToken(token: string | null): void {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  },
  getTenant(): string | null {
    return localStorage.getItem(TENANT_KEY);
  },
  setTenant(tenant: string | null): void {
    if (tenant) localStorage.setItem(TENANT_KEY, tenant);
    else localStorage.removeItem(TENANT_KEY);
  },
  getRememberedUsername(): string | null {
    return localStorage.getItem(REMEMBER_KEY);
  },
  setRememberedUsername(username: string | null): void {
    if (username) localStorage.setItem(REMEMBER_KEY, username);
    else localStorage.removeItem(REMEMBER_KEY);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem("smartdukaan.access_token_expires");
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  },
};