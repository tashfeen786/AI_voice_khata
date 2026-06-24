import { apiClient } from "./api-client";
import type {
  DashboardKpisDto,
  HourlyTrendPointDto,
  DailyTrendPointDto,
  LowStockProductDto,
  TopDebtorDto,
  RecentSaleDto,
} from "./types";

export const getKpis = async () =>
  (await apiClient.get<DashboardKpisDto>("/api/app/dashboard/kpis")).data;

export const getHourlySalesTrend = async () =>
  (await apiClient.get<HourlyTrendPointDto[]>("/api/app/dashboard/today-sales-trend")).data;

export const getDailySalesTrend = async () =>
  (await apiClient.get<DailyTrendPointDto[]>("/api/app/dashboard/weekly-sales")).data;

export const getLowStockAlerts = async () =>
  (await apiClient.get<LowStockProductDto[]>("/api/app/dashboard/low-stock-alerts")).data;

export const getTopDebtors = async () =>
  (await apiClient.get<TopDebtorDto[]>("/api/app/dashboard/top-debtors")).data;

export const getRecentSales = async () =>
  (await apiClient.get<RecentSaleDto[]>("/api/app/dashboard/recent-sales")).data;