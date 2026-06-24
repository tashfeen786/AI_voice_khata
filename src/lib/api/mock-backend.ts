// Mock ABP/OpenIddict + Full Business APIs for SmartDukaan
// Supports: Auth, Dashboard, POS, Customers, Inventory, Reports, Settings, etc.

import type { AxiosRequestConfig } from "axios";

// ==================== Types ====================
export interface MockUser {
  id: string;
  userName: string;
  password: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
}

export interface MockTenant {
  id: string;
  name: string;
  features: string[];
}

// ==================== Data ====================
const tenants: MockTenant[] = [
  { id: "default", name: "Default", features: ["POS.Billing", "Ledger.Udhaar", "Inventory", "Reports", "WhatsApp", "App.DataExport", "App.AIInsights"] },
  { id: "kiryana-rashid", name: "Rashid Kiryana", features: ["POS.Billing", "Ledger.Udhaar", "Inventory"] },
  { id: "mobile-zone", name: "Mobile Zone", features: ["POS.Billing", "Inventory", "Reports"] },
];

const users: MockUser[] = [
  {
    id: "u-host",
    userName: "admin",
    password: "1q2w3E*",
    email: "admin@smartdukaan.app",
    name: "Host",
    surname: "Admin",
    phoneNumber: "+92 300 0000000",
    tenantId: null,
    roles: ["host-admin"],
    permissions: ["AbpIdentity.Users", "AbpTenantManagement.Tenants", "FeatureManagement.ManageHostFeatures", "Dashboard.View", "App.Settings.Edit", "Host.Tenants.Create"],
  },
  {
    id: "u-tenant-admin",
    userName: "shopkeeper",
    password: "1q2w3E*",
    email: "rashid@kiryana.pk",
    name: "Rashid",
    surname: "Ahmed",
    phoneNumber: "+92 321 1234567",
    tenantId: "default",
    roles: ["tenant-admin"],
    permissions: ["Dashboard.View", "POS.Create", "Customers.Manage", "Inventory.Manage", "Reports.View", "App.Settings", "App.MultiUser", "App.Sales.Create", "App.Sales.Cancel", "App.Products.Create", "App.Products.Edit", "App.Products.Delete", "App.Products.ManageStock", "App.Customers.Create", "App.Customers.ManagePayments", "App.Reports.Export"],
  },
  {
    id: "u-cashier",
    userName: "cashier",
    password: "1q2w3E*",
    email: "salman@kiryana.pk",
    name: "Salman",
    surname: "Ali",
    phoneNumber: "+92 333 7654321",
    tenantId: "default",
    roles: ["cashier"],
    permissions: ["POS.Create"],
  },
];

// Tokens
const accessTokens = new Map<string, string>();
const refreshTokens = new Map<string, string>();

// Mock data stores
let products: any[] = [
  { id: "p1", name: "Tapal Tea", urduName: "تپال چائے", sku: "TEA001", price: 450, stock: 25, lowStockThreshold: 10, categoryId: "cat1", categoryName: "Beverages", costPrice: 400, isActive: true, stockStatus: "InStock", stockValue: 11250, creationTime: new Date().toISOString() },
  { id: "p2", name: "Lays Chips", urduName: "لیز چپس", sku: "CHP002", price: 60, stock: 8, lowStockThreshold: 10, categoryId: "cat2", categoryName: "Snacks", costPrice: 45, isActive: true, stockStatus: "LowStock", stockValue: 480, creationTime: new Date().toISOString() },
  { id: "p3", name: "Dettol Soap", urduName: "ڈیٹول صابن", sku: "SOAP03", price: 120, stock: 0, lowStockThreshold: 5, categoryId: "cat3", categoryName: "Hygiene", costPrice: 100, isActive: true, stockStatus: "OutOfStock", stockValue: 0, creationTime: new Date().toISOString() },
];

let customers: any[] = [
  { id: "c1", name: "Ahmed Raza", urduName: "احمد رضا", phone: "03001234567", address: "Main Bazar, Lahore", outstandingBalance: 4500, lastPaymentDate: "2026-06-05T10:00:00Z", lastPaidDisplay: "Jun 5", isActive: true, notes: "", lifetimeValue: 12500, creationTime: new Date().toISOString() },
  { id: "c2", name: "Fatima Khan", urduName: "فاطمہ خان", phone: "03007654321", address: "Model Town, Karachi", outstandingBalance: 1200, lastPaymentDate: "2026-06-02T15:30:00Z", lastPaidDisplay: "Jun 2", isActive: true, notes: "", lifetimeValue: 5600, creationTime: new Date().toISOString() },
];

let ledgerEntries: any[] = [
  { id: "l1", customerId: "c1", date: "2026-06-05T10:00:00Z", description: "Payment received", urduDescription: "ادائیگی موصول", amount: 2000, type: "debit", runningBalance: 4500, referenceNumber: "PAY001" },
  { id: "l2", customerId: "c1", date: "2026-06-01T12:00:00Z", description: "Udhaar purchase", urduDescription: "ادھار خریداری", amount: 6500, type: "credit", runningBalance: 6500, referenceNumber: "SALE001" },
  { id: "l3", customerId: "c2", date: "2026-06-02T15:30:00Z", description: "Payment received", urduDescription: "ادائیگی موصول", amount: 500, type: "debit", runningBalance: 1200, referenceNumber: "PAY002" },
];

let sales: any[] = [
  { id: "s1", invoiceNumber: "INV-001", customerId: "c1", customerName: "Ahmed Raza", paymentType: "udhaar", subTotal: 4500, discountAmount: 0, totalAmount: 4500, paidAmount: 0, balanceAmount: 4500, status: "Completed", notes: null, saleDate: new Date().toISOString(), itemCount: 3, creationTime: new Date().toISOString(), items: [] },
  { id: "s2", invoiceNumber: "INV-002", customerId: null, customerName: "Walk-in", paymentType: "cash", subTotal: 1200, discountAmount: 0, totalAmount: 1200, paidAmount: 1200, balanceAmount: 0, status: "Completed", notes: null, saleDate: new Date().toISOString(), itemCount: 2, creationTime: new Date().toISOString(), items: [] },
];

let categories = [
  { id: "cat1", name: "Beverages", urduName: "مشروبات", productCount: 1 },
  { id: "cat2", name: "Snacks", urduName: "اسنیکس", productCount: 1 },
  { id: "cat3", name: "Hygiene", urduName: "صفائی", productCount: 1 },
];

// Helper functions
function makeToken(prefix: string) {
  return `${prefix}.${Math.random().toString(36).slice(2)}.${Date.now().toString(36)}`;
}

function readBody(data: any): Record<string, string> {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return Object.fromEntries(new URLSearchParams(data));
    }
  }
  if (data instanceof URLSearchParams) {
    return Object.fromEntries(data);
  }
  if (typeof data === "object") return data;
  return {};
}

function jsonResponse(config: AxiosRequestConfig, status: number, data: any) {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "content-type": "application/json" },
    config: config as any,
  };
}

async function delay(ms = 200) {
  return new Promise(res => setTimeout(res, ms));
}

function getUserFromAuth(config: AxiosRequestConfig): MockUser | null {
  const auth = (config.headers?.Authorization || config.headers?.authorization) as string | undefined;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const userId = accessTokens.get(token);
  return users.find(u => u.id === userId) ?? null;
}

// ==================== Mock Adapter ====================
export async function mockAdapter(config: AxiosRequestConfig) {
  await delay();
  const url = (config.url || "").replace(/^https?:\/\/[^/]+/, "");
  const method = (config.method || "get").toLowerCase();

  // ========== AUTH ==========
  if (url.startsWith("/connect/token") && method === "post") {
    const body = readBody(config.data);
    const tenantHeader = (config.headers?.["__tenant"] as string | undefined) ?? null;

    if (body.grant_type === "refresh_token") {
      const userId = refreshTokens.get(body.refresh_token);
      if (!userId) return Promise.reject({ response: jsonResponse(config, 400, { error: "invalid_grant" }) });
      const user = users.find(u => u.id === userId)!;
      const access = makeToken("at");
      const refresh = makeToken("rt");
      accessTokens.set(access, user.id);
      refreshTokens.delete(body.refresh_token);
      refreshTokens.set(refresh, user.id);
      return jsonResponse(config, 200, {
        access_token: access,
        refresh_token: refresh,
        expires_in: 3600,
        token_type: "Bearer",
      });
    }

    if (body.grant_type === "password") {
      const user = users.find(u => u.userName === body.username && u.password === body.password);
      if (!user) {
        return Promise.reject({ response: jsonResponse(config, 400, { error: "invalid_grant", error_description: "Invalid username or password" }) });
      }

      // Case-insensitive tenant matching
      if (user.tenantId) {
        const tenantObj = tenants.find(t => t.id === user.tenantId);
        if (!tenantObj) {
          return Promise.reject({ response: jsonResponse(config, 500, { error: "internal_error" }) });
        }
        if (!tenantHeader) {
          return Promise.reject({ response: jsonResponse(config, 400, { error: "invalid_grant", error_description: "Tenant is required for this user" }) });
        }
        const normalizedHeader = tenantHeader.toLowerCase().trim();
        const matchesTenantId = normalizedHeader === tenantObj.id.toLowerCase();
        const matchesTenantName = normalizedHeader === tenantObj.name.toLowerCase();
        if (!matchesTenantId && !matchesTenantName) {
          return Promise.reject({ response: jsonResponse(config, 400, { error: "invalid_grant", error_description: "Wrong tenant for this user" }) });
        }
      } else {
        if (tenantHeader) {
          return Promise.reject({ response: jsonResponse(config, 400, { error: "invalid_grant", error_description: "Host users must not select a tenant" }) });
        }
      }

      const access = makeToken("at");
      const refresh = makeToken("rt");
      accessTokens.set(access, user.id);
      refreshTokens.set(refresh, user.id);
      return jsonResponse(config, 200, {
        access_token: access,
        refresh_token: refresh,
        expires_in: 3600,
        token_type: "Bearer",
      });
    }

    return Promise.reject({ response: jsonResponse(config, 400, { error: "unsupported_grant_type" }) });
  }

  if (url.startsWith("/connect/userinfo") && method === "get") {
    const user = getUserFromAuth(config);
    if (!user) return Promise.reject({ response: jsonResponse(config, 401, { error: "unauthorized" }) });
    return jsonResponse(config, 200, {
      sub: user.id,
      name: user.name,
      family_name: user.surname,
      preferred_username: user.userName,
      email: user.email,
      phone_number: user.phoneNumber,
      tenantid: user.tenantId,
      role: user.roles,
    });
  }

  if (url.startsWith("/connect/logout")) {
    const auth = config.headers?.Authorization as string | undefined;
    if (auth?.startsWith("Bearer ")) accessTokens.delete(auth.slice(7));
    return jsonResponse(config, 200, {});
  }

  // ========== TENANTS LIST ==========
  if (url === "/api/abp/multi-tenancy/tenants" && method === "get") {
    return jsonResponse(config, 200, { items: tenants, totalCount: tenants.length });
  }

  // ========== SESSION & PROFILE ==========
  if (url === "/api/app/session" && method === "get") {
    const user = getUserFromAuth(config);
    if (!user) return Promise.reject({ response: jsonResponse(config, 401, { error: "unauthorized" }) });
    const tenant = tenants.find(t => t.id === user.tenantId) ?? null;
    const enabledFeatures = tenant?.features ?? ["POS.Billing", "Ledger.Udhaar", "Inventory", "Reports", "WhatsApp"];
    return jsonResponse(config, 200, {
      id: user.id,
      userName: user.userName,
      email: user.email,
      name: user.name,
      surname: user.surname,
      phoneNumber: user.phoneNumber ?? null,
      tenantId: user.tenantId,
      isHost: user.tenantId === null,
      enabledFeatures,
      permissions: user.permissions,
    });
  }

  if (url === "/api/app/profile" && method === "get") {
    const user = getUserFromAuth(config);
    if (!user) return Promise.reject({ response: jsonResponse(config, 401, { error: "unauthorized" }) });
    return jsonResponse(config, 200, {
      userName: user.userName,
      email: user.email,
      name: user.name,
      surname: user.surname,
      phoneNumber: user.phoneNumber,
    });
  }

  if (url === "/api/app/profile" && method === "put") {
    const user = getUserFromAuth(config);
    if (!user) return Promise.reject({ response: jsonResponse(config, 401, { error: "unauthorized" }) });
    const body = readBody(config.data);
    Object.assign(user, {
      name: body.name ?? user.name,
      surname: body.surname ?? user.surname,
      phoneNumber: body.phoneNumber ?? user.phoneNumber,
      email: body.email ?? user.email,
    });
    return jsonResponse(config, 200, {
      userName: user.userName,
      email: user.email,
      name: user.name,
      surname: user.surname,
      phoneNumber: user.phoneNumber,
    });
  }

  if (url === "/api/app/profile/change-password" && method === "post") {
    const user = getUserFromAuth(config);
    if (!user) return Promise.reject({ response: jsonResponse(config, 401, { error: "unauthorized" }) });
    const body = readBody(config.data);
    if (body.currentPassword !== user.password) {
      return Promise.reject({ response: jsonResponse(config, 400, { error: { message: "Current password is incorrect" } }) });
    }
    user.password = body.newPassword;
    return jsonResponse(config, 204, null);
  }

  // ========== DASHBOARD ==========
  if (url === "/api/app/dashboard/kpis" && method === "get") {
    return jsonResponse(config, 200, {
      todaySales: 12500,
      todayProfit: 3500,
      todayOrders: 24,
      pendingUdhaar: 5700,
      todaySalesChangePct: 12.5,
      todayProfitChangePct: 8.2,
      newCustomersToday: 2,
      pendingUdhaarCustomerCount: 2,
    });
  }
  if (url === "/api/app/dashboard/today-sales-trend" && method === "get") {
    return jsonResponse(config, 200, [
      { hour: "10AM", value: 1200 }, { hour: "11AM", value: 2100 }, { hour: "12PM", value: 3200 },
      { hour: "1PM", value: 2800 }, { hour: "2PM", value: 1500 }, { hour: "3PM", value: 900 },
    ]);
  }
  if (url === "/api/app/dashboard/weekly-sales" && method === "get") {
    return jsonResponse(config, 200, [
      { day: "Mon", value: 8000 }, { day: "Tue", value: 9500 }, { day: "Wed", value: 11000 },
      { day: "Thu", value: 10500 }, { day: "Fri", value: 13500 }, { day: "Sat", value: 9800 }, { day: "Sun", value: 7200 },
    ]);
  }
  if (url === "/api/app/dashboard/low-stock-alerts" && method === "get") {
    return jsonResponse(config, 200, products.filter(p => p.stock <= p.lowStockThreshold).map(p => ({
      id: p.id,
      name: p.name,
      urduName: p.urduName,
      stock: p.stock,
      isOutOfStock: p.stock === 0,
    })));
  }
  if (url === "/api/app/dashboard/top-debtors" && method === "get") {
    return jsonResponse(config, 200, customers.filter(c => c.outstandingBalance > 0).map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      due: c.outstandingBalance,
      lastPaid: c.lastPaidDisplay,
    })));
  }
  if (url === "/api/app/dashboard/recent-sales" && method === "get") {
    return jsonResponse(config, 200, sales.slice(0, 5).map(s => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName || "Walk-in",
      itemCount: s.itemCount,
      total: s.totalAmount,
      paymentType: s.paymentType,
      saleTime: s.saleDate,
    })));
  }

  // ========== CUSTOMERS ==========
  if (url.startsWith("/api/app/customer") && method === "get") {
    const urlObj = new URL(url, "http://mock");
    const filter = urlObj.searchParams.get("filter") || "";
    let filtered = customers;
    if (filter) filtered = customers.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()));
    const totalCount = filtered.length;
    return jsonResponse(config, 200, { items: filtered, totalCount });
  }
  if (url.match(/\/api\/app\/customer\/[^/]+$/) && method === "get") {
    const id = url.split("/").pop();
    const customer = customers.find(c => c.id === id);
    if (!customer) return jsonResponse(config, 404, { error: "not_found" });
    return jsonResponse(config, 200, customer);
  }
  if (url === "/api/app/customer/stats" && method === "get") {
    return jsonResponse(config, 200, {
      totalCustomers: customers.length,
      totalOutstanding: customers.reduce((s, c) => s + c.outstandingBalance, 0),
      customersWithDue: customers.filter(c => c.outstandingBalance > 0).length,
      paidToday: 2500,
      averageOutstanding: customers.reduce((s, c) => s + c.outstandingBalance, 0) / customers.length,
    });
  }
  if (url === "/api/app/customer/add-payment" && method === "post") {
    const body = readBody(config.data);
    const customer = customers.find(c => c.id === body.customerId);
    if (customer) {
      customer.outstandingBalance -= body.amount;
      ledgerEntries.unshift({
        id: `l${Date.now()}`,
        customerId: body.customerId,
        date: new Date().toISOString(),
        description: body.description || "Payment",
        amount: body.amount,
        type: "debit",
        runningBalance: customer.outstandingBalance,
      });
    }
    return jsonResponse(config, 200, customer);
  }
  if (url.match(/\/api\/app\/customer\/customer-ledger\/[^/]+/) && method === "get") {
    const customerId = url.split("/").pop();
    const entries = ledgerEntries.filter(e => e.customerId === customerId).slice(0, 10);
    return jsonResponse(config, 200, entries);
  }
  if (url.match(/\/api\/app\/customer\/[^/]+\/add-udhaar/) && method === "post") {
    const body = readBody(config.data);
    const customer = customers.find(c => c.id === url.split("/")[4]);
    if (customer) {
      customer.outstandingBalance += body.amount;
      ledgerEntries.unshift({
        id: `l${Date.now()}`,
        customerId: customer.id,
        date: new Date().toISOString(),
        description: body.description,
        amount: body.amount,
        type: "credit",
        runningBalance: customer.outstandingBalance,
      });
    }
    return jsonResponse(config, 200, {});
  }

  // ========== INVENTORY ==========
  if (url === "/api/app/inventory/products" && method === "get") {
    const urlObj = new URL(url, "http://mock");
    const q = urlObj.searchParams.get("searchQuery") || "";
    let filtered = products;
    if (q) filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.includes(q));
    return jsonResponse(config, 200, { items: filtered, totalCount: filtered.length });
  }
  if (url === "/api/app/inventory/stats" && method === "get") {
    return jsonResponse(config, 200, {
      totalSkus: products.length,
      stockValue: products.reduce((s, p) => s + p.stockValue, 0),
      lowStockCount: products.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length,
      outOfStockCount: products.filter(p => p.stock === 0).length,
      totalCategories: categories.length,
    });
  }
  if (url === "/api/app/inventory/categories" && method === "get") {
    return jsonResponse(config, 200, categories);
  }

  // ========== POS ==========
  if (url === "/api/app/p-os/search-products" && method === "post") {
    const body = readBody(config.data);
    const query = body.query || "";
    let filtered = products;
    if (query) filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.includes(query));
    return jsonResponse(config, 200, { items: filtered, totalCount: filtered.length });
  }
  if (url === "/api/app/p-os/product-by-sku" && method === "get") {
    const sku = new URL(url, "http://mock").searchParams.get("sku");
    const product = products.find(p => p.sku === sku);
    if (!product) return jsonResponse(config, 404, { error: "not_found" });
    return jsonResponse(config, 200, product);
  }
  if (url === "/api/app/p-os/categories" && method === "get") {
    return jsonResponse(config, 200, categories.map(c => ({ id: c.id, name: c.name, urduName: c.urduName })));
  }
  if (url === "/api/app/p-os/quick-customers" && method === "get") {
    return jsonResponse(config, 200, customers.map(c => ({ id: c.id, name: c.name, phone: c.phone, outstandingBalance: c.outstandingBalance })));
  }
  if (url === "/api/app/p-os/sale" && method === "post") {
    const body = readBody(config.data);
    const invoiceNumber = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale = {
      id: `s${Date.now()}`,
      invoiceNumber,
      customerId: body.customerId,
      customerName: body.customerName || (customers.find(c => c.id === body.customerId)?.name),
      paymentType: body.paymentType,
      subTotal: body.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      discountAmount: body.discountAmount,
      totalAmount: body.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) - body.discountAmount,
      paidAmount: body.paymentType === "cash" ? (body.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) - body.discountAmount) : 0,
      balanceAmount: body.paymentType === "udhaar" ? (body.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) - body.discountAmount) : 0,
      status: "Completed",
      saleDate: new Date().toISOString(),
      items: body.items.map((it: any, idx: number) => ({
        id: `si${idx}`,
        productName: products.find(p => p.id === it.productId)?.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.unitPrice * it.quantity,
      })),
    };
    sales.unshift(newSale);
    if (body.paymentType === "udhaar" && body.customerId) {
      const cust = customers.find(c => c.id === body.customerId);
      if (cust) cust.outstandingBalance += newSale.totalAmount;
    }
    for (const it of body.items) {
      const prod = products.find(p => p.id === it.productId);
      if (prod) prod.stock -= it.quantity;
    }
    return jsonResponse(config, 200, newSale);
  }
  if (url === "/api/app/p-os/sales" && method === "get") {
    return jsonResponse(config, 200, { items: sales, totalCount: sales.length });
  }

  // ========== REPORTS ==========
  if (url === "/api/app/reports/kpis" && method === "get") {
    return jsonResponse(config, 200, {
      monthlySales: 125000,
      monthlyProfit: 35000,
      pendingPayments: 5700,
      pendingCustomers: 2,
      averageDailySales: 12500,
      monthlySalesChange: 8.2,
      monthlyProfitChange: 5.6,
      dailySalesChange: 3.2,
    });
  }
  if (url === "/api/app/reports/monthly-sales" && method === "get") {
    return jsonResponse(config, 200, [
      { month: "Jan", sales: 95000, profit: 28000 },
      { month: "Feb", sales: 102000, profit: 31000 },
      { month: "Mar", sales: 125000, profit: 35000 },
    ]);
  }
  if (url === "/api/app/reports/category-sales" && method === "get") {
    return jsonResponse(config, 200, categories.map((c, i) => ({
      name: c.name,
      sales: [15000, 8000, 5000][i],
      percentage: [45, 30, 25][i],
      color: ["#6366f1", "#f59e0b", "#10b981"][i],
    })));
  }
  if (url === "/api/app/reports/pending-payments" && method === "get") {
    return jsonResponse(config, 200, {
      totalPending: 5700,
      customerCount: 2,
      customers: customers.filter(c => c.outstandingBalance > 0).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        due: c.outstandingBalance,
        lastPaid: c.lastPaidDisplay,
      })),
    });
  }
  if (url === "/api/app/reports/daily-sales-report" && method === "get") {
    return jsonResponse(config, 200, {
      totalBills: 24,
      averageBill: 520,
      cashPercentage: 65,
      dailyData: [{ day: "Mon", sales: 8000 }, { day: "Tue", sales: 9500 }, { day: "Wed", sales: 11000 }],
    });
  }

  // ========== SETTINGS ==========
  if (url === "/api/app/settings" && method === "get") {
    return jsonResponse(config, 200, {
      general: { storeName: "Smart Dukaan", storeNameUrdu: "سمارٹ دوکان", storeAddress: "Main Bazar, Karachi", storePhone: "+92 300 1234567", currency: "PKR", timeZone: "Asia/Karachi" },
      pos: { defaultPaymentType: "cash", autoPrintReceipt: false, receiptFooter: "Thank you!", lowStockThreshold: 5 },
      invoice: { invoicePrefix: "INV-", taxRate: 0, showCostPrice: false },
      theme: { primaryColor: "#6366f1", darkModeDefault: false, logoUrl: null },
    });
  }

  // ========== HOST TENANTS & EDITIONS (basic mock) ==========
  if (url === "/api/multi-tenancy/tenants" && method === "get") {
    return jsonResponse(config, 200, { items: tenants, totalCount: tenants.length });
  }

  // Fallback 404
  return Promise.reject({ response: jsonResponse(config, 404, { error: "not_found", path: url }) });
}

export const mockMeta = { tenants };