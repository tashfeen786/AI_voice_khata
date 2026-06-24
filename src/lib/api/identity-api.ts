import { apiClient } from "./api-client";
import { hostConfig } from "./host-context";
import type { PagedFilterDto, PagedResultDto } from "./types";

/** Pass `host: true` for HOST identity calls (no __tenant header). */
interface CtxOpts { host?: boolean }
function ctx(opts?: CtxOpts) {
  return opts?.host ? hostConfig() : undefined;
}

// ============== Users ==============
export interface IdentityUserDto {
  id: string;
  userName: string;
  name?: string;
  surname?: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  lockoutEnabled: boolean;
  lastPasswordChangeTime?: string;
  creationTime?: string;
  concurrencyStamp?: string;
  roleNames?: string[];
}

export interface IdentityUserCreateDto {
  userName: string;
  name?: string;
  surname?: string;
  email: string;
  phoneNumber?: string;
  password: string;
  isActive: boolean;
  lockoutEnabled: boolean;
  roleNames?: string[];
}

export interface IdentityUserUpdateDto {
  userName: string;
  name?: string;
  surname?: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  isActive: boolean;
  lockoutEnabled: boolean;
  roleNames?: string[];
  concurrencyStamp?: string;
}

export async function getUsers(filter: PagedFilterDto = {}, opts?: CtxOpts) {
  const res = await apiClient.get<PagedResultDto<IdentityUserDto>>("/api/identity/users", {
    ...(ctx(opts) ?? {}),
    params: {
      Filter: filter.searchQuery,
      Sorting: filter.sorting,
      SkipCount: filter.skipCount ?? 0,
      MaxResultCount: filter.maxResultCount ?? 10,
    },
  });
  return res.data;
}

export async function getUser(id: string, opts?: CtxOpts) {
  const res = await apiClient.get<IdentityUserDto>(`/api/identity/users/${id}`, ctx(opts));
  return res.data;
}

export async function createUser(input: IdentityUserCreateDto, opts?: CtxOpts) {
  const res = await apiClient.post<IdentityUserDto>("/api/identity/users", input, ctx(opts));
  return res.data;
}

export async function updateUser(id: string, input: IdentityUserUpdateDto, opts?: CtxOpts) {
  const res = await apiClient.put<IdentityUserDto>(`/api/identity/users/${id}`, input, ctx(opts));
  return res.data;
}

export async function deleteUser(id: string, opts?: CtxOpts) {
  await apiClient.delete(`/api/identity/users/${id}`, ctx(opts));
}

export async function getUserRoles(id: string, opts?: CtxOpts) {
  const res = await apiClient.get<PagedResultDto<IdentityRoleDto>>(`/api/identity/users/${id}/roles`, ctx(opts));
  return res.data.items;
}

export async function setUserRoles(id: string, roleNames: string[], opts?: CtxOpts) {
  await apiClient.put(`/api/identity/users/${id}/roles`, { roleNames }, ctx(opts));
}

// ============== Roles ==============
export interface IdentityRoleDto {
  id: string;
  name: string;
  isDefault: boolean;
  isStatic: boolean;
  isPublic: boolean;
  concurrencyStamp?: string;
}

export interface IdentityRoleCreateDto {
  name: string;
  isDefault: boolean;
  isPublic: boolean;
}

export interface IdentityRoleUpdateDto extends IdentityRoleCreateDto {
  concurrencyStamp?: string;
}

export async function getRoles(filter: PagedFilterDto = {}, opts?: CtxOpts) {
  const res = await apiClient.get<PagedResultDto<IdentityRoleDto>>("/api/identity/roles", {
    ...(ctx(opts) ?? {}),
    params: {
      Filter: filter.searchQuery,
      Sorting: filter.sorting,
      SkipCount: filter.skipCount ?? 0,
      MaxResultCount: filter.maxResultCount ?? 10,
    },
  });
  return res.data;
}

export async function getAllRoles(opts?: CtxOpts) {
  const res = await apiClient.get<PagedResultDto<IdentityRoleDto>>("/api/identity/roles/all", ctx(opts));
  return res.data.items;
}

export async function createRole(input: IdentityRoleCreateDto, opts?: CtxOpts) {
  const res = await apiClient.post<IdentityRoleDto>("/api/identity/roles", input, ctx(opts));
  return res.data;
}

export async function updateRole(id: string, input: IdentityRoleUpdateDto, opts?: CtxOpts) {
  const res = await apiClient.put<IdentityRoleDto>(`/api/identity/roles/${id}`, input, ctx(opts));
  return res.data;
}

export async function deleteRole(id: string, opts?: CtxOpts) {
  await apiClient.delete(`/api/identity/roles/${id}`, ctx(opts));
}
