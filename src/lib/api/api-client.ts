import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { tokenStore } from "./token-store";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccessToken();
  const tenant = tokenStore.getTenant();

  if (token) config.headers.Authorization = `Bearer ${token}`;

  const isAuthEndpoint = config.url?.includes("/connect/token");
  if (isAuthEndpoint) return config;

  const skipTenant = (config.headers as any)?.["X-Skip-Tenant"];
  if (skipTenant) {
    delete (config.headers as any)["__tenant"];
    delete (config.headers as any)["X-Skip-Tenant"];
  } else if (tenant) {
    config.headers["__tenant"] = tenant;
  }

  return config;
});

apiClient.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as AxiosRequestConfig;

    if (status === 401 && !original.url?.includes("/connect/token")) {
      tokenStore.clear();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        toast.warning("Session expired. Please sign in again.");
        window.location.href = "/login";
      }
    }

    if (status === 403) {
      toast.error("Permission denied");
    }

    return Promise.reject(error);
  }
);