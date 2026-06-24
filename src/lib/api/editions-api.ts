import { apiClient } from "./api-client";
import { hostConfig } from "./host-context";
import type { PagedResultDto, EditionDto, CreateEditionDto, UpdateEditionDto, EditionFilterDto } from "./types";

export type { EditionDto, CreateEditionDto, UpdateEditionDto, EditionFilterDto };

// ABP auto-generates these routes from EditionAppService
const BASE_URL = "/api/app/edition";

export async function getEditions(filter: EditionFilterDto = {}): Promise<PagedResultDto<EditionDto>> {
  // Use the /list endpoint which is confirmed working via cURL
  // Client-side filtering and pagination for now
  const res = await apiClient.get<EditionDto[]>(`${BASE_URL}/list`, hostConfig());
  let items = res.data;
  
  // Client-side filtering
  if (filter.searchQuery) {
    const q = filter.searchQuery.toLowerCase();
    items = items.filter(e => 
      e.name.toLowerCase().includes(q) || 
      e.displayName.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false)
    );
  }
  
  if (filter.isActive !== undefined) {
    items = items.filter(e => e.isActive === filter.isActive);
  }
  
  // Client-side sorting
  if (filter.sorting) {
    const [field, dir] = filter.sorting.split(' ');
    const mult = dir === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      let va: unknown, vb: unknown;
      switch (field) {
        case 'name': va = a.name; vb = b.name; break;
        case 'displayName': va = a.displayName; vb = b.displayName; break;
        case 'monthlyPrice': va = a.monthlyPrice; vb = b.monthlyPrice; break;
        case 'annualPrice': va = a.annualPrice; vb = b.annualPrice; break;
        case 'displayOrder': va = a.displayOrder; vb = b.displayOrder; break;
        case 'isActive': va = a.isActive ? 1 : 0; vb = b.isActive ? 1 : 0; break;
        default: va = a.displayOrder; vb = b.displayOrder;
      }
      if (va === undefined || va === null) return -1 * mult;
      if (vb === undefined || vb === null) return 1 * mult;
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * mult;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mult;
      return 0;
    });
  }
  
  const totalCount = items.length;
  const skipCount = filter.skipCount ?? 0;
  const maxResultCount = filter.maxResultCount ?? 100;
  const pagedItems = items.slice(skipCount, skipCount + maxResultCount);
  
  return {
    items: pagedItems,
    totalCount,
  };
}

export async function getAllEditions(): Promise<EditionDto[]> {
  // Use the list endpoint which returns all items
  try {
    const res = await apiClient.get<EditionDto[]>(
      `${BASE_URL}/list`,
      hostConfig(),
    );
    return res.data;
  } catch {
    // Fallback to paged endpoint with large page size
    const paged = await getEditions({ maxResultCount: 1000 });
    return paged.items;
  }
}

export async function getActiveEditions(): Promise<EditionDto[]> {
  const res = await apiClient.get<EditionDto[]>(`${BASE_URL}/active-list`, hostConfig());
  return res.data;
}

export async function getEditionById(id: string): Promise<EditionDto> {
  const res = await apiClient.get<EditionDto>(`${BASE_URL}/${id}`, hostConfig());
  return res.data;
}

export async function createEdition(input: CreateEditionDto) {
  const res = await apiClient.post<EditionDto>(BASE_URL, input, hostConfig());
  return res.data;
}

export async function updateEdition(id: string, input: UpdateEditionDto) {
  const res = await apiClient.put<EditionDto>(`${BASE_URL}/${id}`, input, hostConfig());
  return res.data;
}

export async function deleteEdition(id: string) {
  await apiClient.delete(`${BASE_URL}/${id}`, hostConfig());
}
