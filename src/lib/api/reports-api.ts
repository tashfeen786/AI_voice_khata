import { apiClient } from "./api-client";
import type {
  MonthlyReportDto,
  CategoryReportDto,
  PendingPaymentsDto,
  DailySalesReportDto,
  ReportKpiDto,
  SalesTrendDto,
  LowStockReportItemDto,
  CustomerPaymentDto,
  ExportResultDto,
} from "./types";

// Get monthly sales report (default 6 months)
export const getMonthlySales = async (months = 6) => {
  const res = await apiClient.get<MonthlyReportDto[]>("/api/app/reports/monthly-sales", {
    params: { months },
  });
  return res.data;
};

// Get category sales breakdown
export const getCategorySales = async (date?: string) => {
  const res = await apiClient.get<CategoryReportDto[]>("/api/app/reports/category-sales", {
    params: date ? { date } : undefined,
  });
  return res.data;
};

// Get pending payments summary
export const getPendingPayments = async () => {
  const res = await apiClient.get<PendingPaymentsDto>("/api/app/reports/pending-payments");
  return res.data;
};

// Get daily sales report
export const getDailySalesReport = async () => {
  const res = await apiClient.get<DailySalesReportDto>("/api/app/reports/daily-sales-report");
  return res.data;
};

// Get report KPIs
export const getReportKpis = async () => {
  const res = await apiClient.get<ReportKpiDto>("/api/app/reports/kpis");
  return res.data;
};

// Get sales trend (today, week, month)
export const getSalesTrend = async (period = "today") => {
  const res = await apiClient.get<SalesTrendDto[]>("/api/app/reports/sales-trend", {
    params: { period },
  });
  return res.data;
};

// Export sales report
export const exportSalesReport = async (input: { startDate: string; endDate: string; format: "pdf" | "xlsx" }) => {
  const res = await apiClient.post<ExportResultDto>("/api/app/reports/export", input);
  return res.data;
};

// Export sales (binary download) - Phase 4 DataExport feature
export const exportSalesDownload = async (input: { startDate: string; endDate: string; format: "xlsx" | "csv" }) => {
  const res = await apiClient.post("/api/app/reports/export-sales-report", input, {
    responseType: "blob",
  });
  return res.data as Blob;
};

// Get low stock report
export const getLowStockReport = async () => {
  const res = await apiClient.get<LowStockReportItemDto[]>("/api/app/reports/low-stock");
  return res.data;
};

// Get customer payments (recent)
export const getCustomerPayments = async (days = 30) => {
  const res = await apiClient.get<CustomerPaymentDto[]>("/api/app/reports/customer-payments", {
    params: { days },
  });
  return res.data;
};
