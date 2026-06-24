import { apiClient } from "./api-client";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
}

export interface UserInfo {
  sub: string;
  name: string;
  family_name: string;
  preferred_username: string;
  email: string;
  phone_number?: string;
  tenantid: string | null;
  role: string[];
  enabled_features?: string;
}

export interface ProfileDto {
  userName: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber?: string;
}

export interface TenantDto {
  id: string;
  name: string;
  features?: string[];
}

export interface SessionDto {
  id: string;
  userName?: string;
  email?: string;
  name?: string;
  surname?: string;
  phoneNumber?: string;
  tenantId?: string;
  isHost: boolean;
  enabledFeatures: string[];
  permissions: string[];
}

export async function loginWithPassword(
  username: string,
  password: string,
  tenant: string | null
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "App_App",
    username,
    password,
    scope: "offline_access openid profile email phone roles App",
  });

  // __tenant is set here only when explicitly provided (tenant login).
  // For host login (tenant = null) we send NO __tenant header at all.
  // The request interceptor in api-client.ts is skipped for /connect/token
  // so tokenStore can never inject a stale tenant value here.
  const res = await apiClient.post<TokenResponse>("/connect/token", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(tenant ? { "__tenant": tenant } : {}),
    },
  });

  return res.data;
}

export async function getUserInfo(): Promise<UserInfo> {
  const res = await apiClient.get<UserInfo>("/connect/userinfo");
  return res.data;
}

// Server-side logout is not required for JWT — tokens expire naturally.
// Caller is responsible for clearing tokenStore.
export async function logoutApi(): Promise<void> {
  return Promise.resolve();
}

export async function getProfile(): Promise<ProfileDto> {
  const res = await apiClient.get<ProfileDto>("/api/app/profile");
  return res.data;
}

export async function updateProfile(profile: Partial<ProfileDto>): Promise<ProfileDto> {
  const res = await apiClient.put<ProfileDto>("/api/app/profile", profile);
  return res.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiClient.post("/api/app/profile/change-password", {
    currentPassword,
    newPassword,
  });
}

export async function getPermissions(
  userId: string,
  roles: string[] = []
): Promise<string[]> {
  const grantedPerms = new Set<string>();

  try {
    const userRes = await apiClient.get("/api/permission-management/permissions", {
      params: { providerName: "U", providerKey: userId },
    });
    (userRes.data?.groups ?? [])
      .flatMap((g: any) => g.permissions ?? [])
      .filter((p: any) => p.isGranted)
      .forEach((p: any) => grantedPerms.add(p.name));
  } catch (err: any) {
    console.warn("Failed to fetch user permissions", err.response?.status);
  }

  for (const role of roles) {
    try {
      const roleRes = await apiClient.get("/api/permission-management/permissions", {
        params: { providerName: "R", providerKey: role },
      });
      (roleRes.data?.groups ?? [])
        .flatMap((g: any) => g.permissions ?? [])
        .filter((p: any) => p.isGranted)
        .forEach((p: any) => grantedPerms.add(p.name));
    } catch (err: any) {
      console.warn(`Failed to fetch permissions for role ${role}`, err.response?.status);
    }
  }

  return Array.from(grantedPerms);
}

export async function getSession(): Promise<SessionDto> {
  const res = await apiClient.get<SessionDto>("/api/app/session");
  return res.data;
}

export async function listTenants(): Promise<TenantDto[]> {
  // FIX 3: Correct ABP endpoint is /api/abp/multi-tenancy/tenants.
  // Previous path /api/multi-tenancy/tenants hit the mock's 404 handler.
  const res = await apiClient.get("/api/abp/multi-tenancy/tenants", {
    params: { MaxResultCount: 100 },
  });
  return res.data?.items ?? [];
}