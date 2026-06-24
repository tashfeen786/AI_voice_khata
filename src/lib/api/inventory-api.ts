import { apiClient } from "./api-client";
import type {
  InventoryProductDto,
  InventoryCategoryDto,
  InventoryStatsDto,
  InventoryFilterDto,
  CreateInventoryProductDto,
  UpdateInventoryProductDto,
  StockTakeDto,
  StockAdjustmentDto,
  LowStockItemDto,
  OutOfStockItemDto,
  PagedResultDto,
} from "./types";

// Get paginated products
export const getProducts = async (filter?: InventoryFilterDto) => {
  const res = await apiClient.get<PagedResultDto<InventoryProductDto>>("/api/app/inventory/products", {
    params: filter,
  });
  return res.data;
};

// Get single product by ID
export const getProduct = async (id: string) => {
  const res = await apiClient.get<InventoryProductDto>(`/api/app/inventory/product/${id}`);
  return res.data;
};

// Get product by SKU
export const getProductBySku = async (sku: string) => {
  const res = await apiClient.get<InventoryProductDto>("/api/app/inventory/product-by-sku", {
    params: { sku },
  });
  return res.data;
};

// Create new product
export const createProduct = async (input: CreateInventoryProductDto) => {
  const res = await apiClient.post<InventoryProductDto>("/api/app/inventory/product", input);
  return res.data;
};

// Update product
export const updateProduct = async (id: string, input: UpdateInventoryProductDto) => {
  const res = await apiClient.put<InventoryProductDto>(`/api/app/inventory/product/${id}`, input);
  return res.data;
};

// Delete product
export const deleteProduct = async (id: string) => {
  await apiClient.delete(`/api/app/inventory/product/${id}`);
};

// Get inventory stats
export const getInventoryStats = async () => {
  const res = await apiClient.get<InventoryStatsDto>("/api/app/inventory/stats");
  return res.data;
};

// Get low stock products
export const getLowStockProducts = async (maxCount = 10) => {
  const res = await apiClient.get<LowStockItemDto[]>("/api/app/inventory/low-stock", {
    params: { maxCount },
  });
  return res.data;
};

// Get out of stock products
export const getOutOfStockProducts = async (maxCount = 10) => {
  const res = await apiClient.get<OutOfStockItemDto[]>("/api/app/inventory/out-of-stock", {
    params: { maxCount },
  });
  return res.data;
};

// Stock take (set exact stock quantity)
export const stockTake = async (input: StockTakeDto) => {
  await apiClient.post("/api/app/inventory/stock-take", input);
};

// Adjust stock (add/remove quantity)
export const adjustStock = async (input: StockAdjustmentDto) => {
  await apiClient.post("/api/app/inventory/adjust-stock", input);
};

// Get categories
export const getCategories = async () => {
  const res = await apiClient.get<InventoryCategoryDto[]>("/api/app/inventory/categories");
  return res.data;
};
