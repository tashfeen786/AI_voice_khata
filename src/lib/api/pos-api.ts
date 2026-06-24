import { apiClient } from "./api-client";
import type {
  POSProductDto,
  POSCategoryDto,
  POSCustomerDto,
  CreatePOSSaleDto,
  POSSaleResultDto,
  POSSaleDto,
  POSSaleListDto,
  POSSaleFilterDto,
  PagedResultDto,
} from "./types";

// Search products by name, SKU, or Urdu name (POST request)
export const searchProducts = async (query: string) => {
  const response = await apiClient.post<PagedResultDto<POSProductDto>>("/api/app/p-os/search-products", { query });
  return response.data;
};

// Get product by SKU (for barcode scanning)
export const getProductBySku = async (sku: string) =>
  (await apiClient.get<POSProductDto>("/api/app/p-os/product-by-sku", { params: { sku } })).data;

// Get active categories
export const getPosCategories = async () =>
  (await apiClient.get<POSCategoryDto[]>("/api/app/p-os/categories")).data;

// Get quick customers (for POS customer selection)
export const getQuickCustomers = async (count = 10) =>
  (await apiClient.get<POSCustomerDto[]>("/api/app/p-os/quick-customers", { params: { count } })).data;

// Search customers (POST request)
export const searchPosCustomers = async (query: string) =>
  (await apiClient.post<POSCustomerDto[]>("/api/app/p-os/search-customers", { query })).data;

// Get next invoice number
export const getNextInvoiceNumber = async () =>
  (await apiClient.get<string>("/api/app/p-os/next-invoice-number")).data;

// Create a sale (main POS operation)
export const createSale = async (data: CreatePOSSaleDto) =>
  (await apiClient.post<POSSaleResultDto>("/api/app/p-os/sale", data)).data;

// Get sale by ID
export const getSale = async (id: string) =>
  (await apiClient.get<POSSaleDto>(`/api/app/p-os/${id}/sale`)).data;

// Get sales list with filters
export const getSales = async (params: POSSaleFilterDto) =>
  (await apiClient.get<PagedResultDto<POSSaleListDto>>("/api/app/p-os/sales", { params })).data;

// Cancel a sale
export const cancelSale = async (id: string) =>
  (await apiClient.post<POSSaleDto>(`/api/app/p-os/${id}/cancel-sale`)).data;

// Mark sale as paid
export const markSaleAsPaid = async (id: string, paidAmount: number) =>
  (await apiClient.post<POSSaleDto>(`/api/app/p-os/${id}/mark-sale-as-paid`, { paidAmount })).data;