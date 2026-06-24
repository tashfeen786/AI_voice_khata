import { apiClient } from "./api-client";
import { hostConfig } from "./host-context";

export interface FeatureDto {
  name: string;
  displayName: string;
  value: string | null;
  provider?: { name: string; key: string };
  description?: string;
  valueType?: {
    name: string;
    properties?: Record<string, unknown>;
    validator?: { name: string; properties?: Record<string, unknown> };
  };
  depth?: number;
  parentName?: string | null;
}

export interface FeatureGroupDto {
  name: string;
  displayName: string;
  features: FeatureDto[];
}

export interface FeatureListResultDto {
  groups: FeatureGroupDto[];
}

export interface UpdateFeatureDto {
  name: string;
  value: string | null;
}

// ABP Feature Management uses short provider codes: E=Edition, T=Tenant, D=Default
export async function getFeaturesFor(providerName: "E" | "T" | "D", providerKey: string) {
  const res = await apiClient.get<FeatureListResultDto>("/api/feature-management/features", hostConfig({
    params: { providerName, providerKey },
  }));
  return res.data;
}

export async function updateFeaturesFor(
  providerName: "E" | "T" | "D",
  providerKey: string,
  features: UpdateFeatureDto[],
) {
  await apiClient.put("/api/feature-management/features", { features }, hostConfig({
    params: { providerName, providerKey },
  }));
}

export async function resetFeaturesFor(providerName: "E" | "T" | "D", providerKey: string) {
  await apiClient.delete("/api/feature-management/features", hostConfig({
    params: { providerName, providerKey },
  }));
}
