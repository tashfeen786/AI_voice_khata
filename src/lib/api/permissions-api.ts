import { apiClient } from "./api-client";
import { hostConfig } from "./host-context";

export interface PermissionGrantInfoDto {
  name: string;
  displayName: string;
  parentName?: string | null;
  isGranted: boolean;
  allowedProviders?: string[];
  grantedProviders?: { providerName: string; providerKey: string }[];
}

export interface PermissionGroupDto {
  name: string;
  displayName: string;
  permissions: PermissionGrantInfoDto[];
}

export interface PermissionListResultDto {
  entityDisplayName: string;
  groups: PermissionGroupDto[];
}

export interface UpdatePermissionDto {
  name: string;
  isGranted: boolean;
}

interface CtxOpts { host?: boolean }
const ctx = (o?: CtxOpts) => (o?.host ? hostConfig() : undefined);

export async function getPermissionsFor(
  providerName: "R" | "U" | "Role" | "User",
  providerKey: string,
  opts?: CtxOpts,
) {
  const res = await apiClient.get<PermissionListResultDto>("/api/permission-management/permissions", {
    ...(ctx(opts) ?? {}),
    params: { providerName, providerKey },
  });
  return res.data;
}

export async function updatePermissionsFor(
  providerName: "R" | "U" | "Role" | "User",
  providerKey: string,
  permissions: UpdatePermissionDto[],
  opts?: CtxOpts,
) {
  await apiClient.put(
    "/api/permission-management/permissions",
    { permissions },
    {
      ...(ctx(opts) ?? {}),
      params: { providerName, providerKey },
    },
  );
}
