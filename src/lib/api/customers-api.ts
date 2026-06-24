import { apiClient } from "./api-client";
import type {
  CustomerDto,
  CustomerListDto,
  CustomerFilterDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  PaymentDto,
  CustomerStatsDto,
  LedgerEntryItemDto,
  PagedResultDto,
} from "./types";

// Get customer list with optional filter
export const getCustomers = async (filter?: CustomerFilterDto) => {
  const res = await apiClient.get<PagedResultDto<CustomerListDto>>("/api/app/customer", {
    params: filter,
  });
  return res.data;
};

// Get single customer by ID
export const getCustomer = async (id: string) => {
  const res = await apiClient.get<CustomerDto>(`/api/app/customer/${id}`);
  return res.data;
};

// Get customer by phone
export const getCustomerByPhone = async (phone: string) => {
  const res = await apiClient.get<CustomerDto>("/api/app/customer/by-phone", {
    params: { phone },
  });
  return res.data;
};

// Create new customer
export const createCustomer = async (input: CreateCustomerDto) => {
  const res = await apiClient.post<CustomerDto>("/api/app/customer", input);
  return res.data;
};

// Update customer
export const updateCustomer = async (id: string, input: UpdateCustomerDto) => {
  const res = await apiClient.put<CustomerDto>(`/api/app/customer/${id}`, input);
  return res.data;
};

// Delete customer
export const deleteCustomer = async (id: string) => {
  await apiClient.delete(`/api/app/customer/${id}`);
};

// Search customers
export const searchCustomers = async (query: string) => {
  const res = await apiClient.get<CustomerListDto[]>("/api/app/customer/search", {
    params: { query },
  });
  return res.data;
};

// Get top debtors
export const getTopDebtors = async (count = 10) => {
  const res = await apiClient.get<CustomerListDto[]>("/api/app/customer/top-debtors", {
    params: { count },
  });
  return res.data;
};

// Get customer stats
export const getCustomerStats = async () => {
  const res = await apiClient.get<CustomerStatsDto>("/api/app/customer/stats");
  return res.data;
};

// Add payment for customer
export const addPayment = async (input: PaymentDto) => {
  const res = await apiClient.post<CustomerDto>("/api/app/customer/add-payment", input);
  return res.data;
};

// Get customer ledger
export const getCustomerLedger = async (customerId: string, maxCount = 50) => {
  const res = await apiClient.get<LedgerEntryItemDto[]>(`/api/app/customer/customer-ledger/${customerId}`, {
    params: { maxCount },
  });
  return res.data;
};

// Add udhaar entry
export const addUdhaarEntry = async (customerId: string, amount: number, description: string, urduDescription?: string) => {
  const res = await apiClient.post<LedgerEntryItemDto>(`/api/app/customer/${customerId}/add-udhaar`, {
    amount,
    description,
    urduDescription,
  });
  return res.data;
};
