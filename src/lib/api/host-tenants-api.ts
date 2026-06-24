import { apiClient } from "./api-client";
import { hostConfig } from "./host-context";
import type { PagedFilterDto, PagedResultDto } from "./types";

export interface TenantListItemDto {
  id: string;
  name: string;
  editionId?: string | null;
  editionName?: string | null;
  isActive?: boolean;
  creationTime?: string;
  concurrencyStamp?: string;
}

export interface CreateTenantDto {
  name: string;
  adminEmailAddress: string;
  adminPassword: string;
  editionId?: string | null;
  activationState?: number; // 0 = active
}

export interface UpdateTenantDto {
  name: string;
  concurrencyStamp?: string;
}

export async function getTenants(filter: PagedFilterDto = {}) {
  const res = await apiClient.get<PagedResultDto<TenantListItemDto>>(
    "/api/multi-tenancy/tenants",
    hostConfig({
      params: {
        Filter: filter.searchQuery,
        Sorting: filter.sorting,
        SkipCount: filter.skipCount ?? 0,
        MaxResultCount: filter.maxResultCount ?? 10,
      },
    }),
  );
  return res.data;
}

export async function getTenant(id: string) {
  const res = await apiClient.get<TenantListItemDto>(`/api/multi-tenancy/tenants/${id}`, hostConfig());
  return res.data;
}

export async function createTenant(input: CreateTenantDto) {
  const res = await apiClient.post<TenantListItemDto>("/api/multi-tenancy/tenants", input, hostConfig());
  return res.data;
}

export async function updateTenant(id: string, input: UpdateTenantDto) {
  const res = await apiClient.put<TenantListItemDto>(`/api/multi-tenancy/tenants/${id}`, input, hostConfig());
  return res.data;
}

export async function deleteTenant(id: string) {
  await apiClient.delete(`/api/multi-tenancy/tenants/${id}`, hostConfig());
}

export async function setTenantEdition(tenantId: string, editionId: string | null) {
  await apiClient.put(`/api/multi-tenancy/tenants/${tenantId}/default-connection-string`, null, hostConfig({
    params: { editionId },
  }));
}
