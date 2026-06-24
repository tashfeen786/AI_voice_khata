import type { AxiosRequestConfig } from "axios";

/**
 * Merge into an axios config to force HOST context (strip __tenant header).
 * Use for endpoints under /api/multi-tenancy/*, /api/feature-management/editions,
 * and host-level identity / permission management.
 */
export function hostConfig(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  const headers = { ...(config.headers as Record<string, string> | undefined) };
  // Setting to empty string AND deleting — ABP treats missing header as host
  delete headers["__tenant"];
  // Axios will still serialize headers; signal interceptor to skip injection
  (headers as any)["X-Skip-Tenant"] = "1";
  return { ...config, headers };
}
