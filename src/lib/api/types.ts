// Shared DTOs for Phase 2 API integration.
// These mirror the ABP backend module DTOs (Dashboard, POS, Inventory, Customer, Reports, Settings).

// ==================== Common ====================
export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export interface PagedFilterDto {
  searchQuery?: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

// ==================== Dashboard ====================
export interface DashboardKpisDto {
  todaySales: number;
  todayProfit: number;
  todayOrders: number;
  pendingUdhaar: number;
  todaySalesChangePct?: number;
  todayProfitChangePct?: number;
  newCustomersToday?: number;
  pendingUdhaarCustomerCount?: number;
}

export interface HourlyTrendPointDto { hour: string; value: number; }
export interface DailyTrendPointDto { day: string; value: number; }

export interface LowStockProductDto {
  id: string;
  name: string;
  urduName?: string | null;
  stock: number;
  isOutOfStock?: boolean;
}

// Inventory DTOs matching backend
export interface LowStockItemDto {
  id: string;
  name: string;
  urduName?: string | null;
  stock: number;
  threshold: number;
  categoryName: string;
}

export interface OutOfStockItemDto {
  id: string;
  name: string;
  urduName?: string | null;
  sku: string;
  categoryName: string;
}

export interface TopDebtorDto {
  id: string;
  name: string;
  phone: string;
  due: number;
  lastPaid?: string | null;
}

export interface RecentSaleDto {
  id: string;
  invoiceNumber: string;
  customerName: string;
  itemCount: number;
  total: number;
  paymentType: "cash" | "udhaar";
  saleTime: string;
}

// ==================== POS ====================
export interface POSProductDto {
  id: string;
  name: string;
  urduName?: string | null;
  sku: string;
  price: number;
  stock: number;
  category?: string | null;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

export interface POSCategoryDto {
  id: string;
  name: string;
  urduName?: string | null;
}

export interface POSCustomerDto {
  id: string;
  name: string;
  phone?: string | null;
  outstandingBalance: number;
}

export interface POSCartItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePOSSaleDto {
  customerId?: string | null;
  customerName?: string | null;
  paymentType: "cash" | "udhaar";
  discountAmount: number;
  notes?: string | null;
  items: POSCartItemDto[];
}

export interface POSSaleResultDto {
  saleId: string;
  invoiceNumber: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentType: "cash" | "udhaar";
  saleDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export interface POSSaleDto {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName?: string | null;
  paymentType: string;
  paymentTypeDisplay: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  statusDisplay: string;
  notes?: string | null;
  saleDate: string;
  itemCount: number;
  creationTime: string;
  items: Array<{
    id: string;
    saleId: string;
    productId: string;
    productName: string;
    productSku?: string | null;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
}

export interface POSSaleListDto {
  id: string;
  invoiceNumber: string;
  customerName?: string | null;
  paymentType: string;
  paymentTypeDisplay: string;
  totalAmount: number;
  status: string;
  statusDisplay: string;
  itemCount: number;
  saleDate: string;
  timeDisplay: string;
}

export interface POSSaleFilterDto extends PagedFilterDto {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentType?: "cash" | "udhaar";
  status?: string;
}

// ==================== Inventory ====================
export interface InventoryProductDto {
  id: string;
  name: string;
  urduName?: string | null;
  sku: string;
  price: number;
  stock: number;
  stockStatus: "InStock" | "LowStock" | "OutOfStock";
  categoryId: string;
  categoryName: string;
  stockValue: number;
}

export interface CreateInventoryProductDto {
  name: string;
  urduName?: string | null;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string;
  costPrice?: number | null;
  isActive?: boolean;
}

export interface UpdateInventoryProductDto {
  name: string;
  urduName?: string | null;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryId: string;
  costPrice?: number | null;
  isActive: boolean;
}

export interface InventoryFilterDto extends PagedFilterDto {
  filter?: string;
  categoryId?: string;
  stockStatus?: "all" | "low" | "out" | "instock";
}

export interface InventoryStatsDto {
  totalSkus: number;
  stockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCategories: number;
}

export interface StockTakeDto {
  productId: string;
  newStockQuantity: number;
  reason?: string;
}

export interface StockAdjustmentDto {
  productId: string;
  quantity: number; // positive = add, negative = remove
  reason?: string;
}

export interface InventoryCategoryDto {
  id: string;
  name: string;
  urduName?: string | null;
  productCount: number;
}

// ==================== Customers ====================
export interface CustomerDto {
  id: string;
  name: string;
  urduName?: string | null;
  phone?: string | null;
  address?: string | null;
  outstandingBalance: number;
  lastPaymentDate?: string | null;
  lastPaidDisplay?: string;
  isActive: boolean;
  notes?: string | null;
  lifetimeValue?: number;
  creationTime?: string;
}

export interface CustomerListDto {
  id: string;
  name: string;
  urduName?: string | null;
  phone?: string | null;
  outstandingBalance: number;
  lastPaymentDate?: string | null;
  lastPaidDisplay?: string;
}

export interface CreateCustomerDto {
  name: string;
  urduName?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  name: string;
  urduName?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface CustomerFilterDto extends PagedFilterDto {
  filter?: string;
  hasOutstandingBalance?: boolean;
}

export interface CustomerStatsDto {
  totalCustomers: number;
  totalOutstanding: number;
  customersWithDue: number;
  paidToday: number;
  averageOutstanding: number;
}

export interface LedgerEntryItemDto {
  id: string;
  date: string;
  description: string;
  urduDescription?: string | null;
  amount: number;
  type: "credit" | "debit"; // credit = udhaar added, debit = payment
  runningBalance: number;
  referenceNumber?: string | null;
}

export interface PaymentDto {
  customerId: string;
  amount: number;
  description?: string | null;
  referenceNumber?: string | null;
}

// ==================== Reports ====================
export interface MonthlyReportDto {
  month: string;
  sales: number;
  profit: number;
}

export interface CategoryReportDto {
  name: string;
  sales: number;
  percentage: number;
  color: string;
}

export interface PendingCustomerDto {
  id: string;
  name: string;
  phone?: string | null;
  due: number;
  lastPaid: string;
}

export interface PendingPaymentsDto {
  totalPending: number;
  customerCount: number;
  customers: PendingCustomerDto[];
}

export interface DailySaleDto {
  day: string;
  sales: number;
}

export interface DailySalesReportDto {
  totalBills: number;
  averageBill: number;
  cashPercentage: number;
  dailyData: DailySaleDto[];
}

export interface ReportKpiDto {
  monthlySales: number;
  monthlyProfit: number;
  pendingPayments: number;
  pendingCustomers: number;
  averageDailySales: number;
  monthlySalesChange: number;
  monthlyProfitChange: number;
  dailySalesChange: number;
}

export interface SalesTrendDto {
  label: string;
  value: number;
}

export interface ExportResultDto {
  fileName: string;
  contentType: string;
  data: number[]; // byte[] as number[]
}

export interface LowStockReportItemDto {
  id: string;
  name: string;
  urduName?: string | null;
  sku: string;
  currentStock: number;
  threshold: number;
  category: string;
}

export interface CustomerPaymentDto {
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  type: "payment" | "udhaar";
}

// ==================== SaaS / Editions ====================
export interface EditionDto {
  id: string;
  name: string;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  isActive: boolean;
  description?: string | null;
  displayOrder: number;
  tenantCount?: number; // Computed field from backend
  concurrencyStamp?: string;
  creationTime: string;
  lastModificationTime?: string | null;
}

export interface CreateEditionDto {
  name: string;
  displayName: string;
  monthlyPrice?: number;
  annualPrice?: number;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  featureValues?: string | null;
}

export interface UpdateEditionDto {
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  featureValues?: string | null;
  concurrencyStamp?: string;
}

export interface EditionFilterDto extends PagedFilterDto {
  isActive?: boolean;
}

// ==================== Settings ====================
export interface GeneralSettingsDto {
  storeName: string;
  storeNameUrdu: string | null;
  storeAddress: string | null;
  storePhone: string | null;
  currency: string;
  timeZone: string;
}

export interface PosSettingsDto {
  defaultPaymentType: "cash" | "udhaar";
  autoPrintReceipt: boolean;
  receiptFooter: string | null;
  lowStockThreshold: number;
}

export interface InvoiceSettingsDto {
  invoicePrefix: string;
  taxRate: number;
  showCostPrice: boolean;
}

export interface ThemeSettingsDto {
  primaryColor: string;
  darkModeDefault: boolean;
  logoUrl: string | null;
}

export interface AllSettingsDto {
  general: GeneralSettingsDto;
  pos: PosSettingsDto;
  invoice: InvoiceSettingsDto;
  theme: ThemeSettingsDto;
}

export type UpdateGeneralSettingsDto = Partial<Omit<GeneralSettingsDto, "currency">> & { storeName: string };
export type UpdatePosSettingsDto = PosSettingsDto;
export type UpdateInvoiceSettingsDto = InvoiceSettingsDto;
export type UpdateThemeSettingsDto = ThemeSettingsDto;