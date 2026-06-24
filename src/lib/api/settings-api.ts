import { apiClient } from "./api-client";

export interface GeneralSettingsDto {
  storeName: string;
  storeNameUrdu?: string | null;
  storeAddress?: string | null;
  storePhone?: string | null;
  currency?: string;
  timeZone?: string;
}

export interface PosSettingsDto {
  defaultPaymentType: "cash" | "udhaar";
  autoPrintReceipt: boolean;
  receiptFooter?: string | null;
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
  logoUrl?: string | null;
}

export interface AllSettingsDto {
  general: GeneralSettingsDto;
  pos: PosSettingsDto;
  invoice: InvoiceSettingsDto;
  theme: ThemeSettingsDto;
}

export async function getAllSettings() {
  const res = await apiClient.get<AllSettingsDto>("/api/app/settings");
  return res.data;
}

export async function getGeneralSettings() {
  const res = await apiClient.get<GeneralSettingsDto>("/api/app/settings/general");
  return res.data;
}
export async function updateGeneralSettings(body: GeneralSettingsDto) {
  await apiClient.put("/api/app/settings/general", body);
}

export async function getPosSettings() {
  const res = await apiClient.get<PosSettingsDto>("/api/app/settings/pos");
  return res.data;
}
export async function updatePosSettings(body: PosSettingsDto) {
  await apiClient.put("/api/app/settings/pos", body);
}

export async function getInvoiceSettings() {
  const res = await apiClient.get<InvoiceSettingsDto>("/api/app/settings/invoice");
  return res.data;
}
export async function updateInvoiceSettings(body: InvoiceSettingsDto) {
  await apiClient.put("/api/app/settings/invoice", body);
}

export async function getThemeSettings() {
  const res = await apiClient.get<ThemeSettingsDto>("/api/app/settings/theme");
  return res.data;
}
export async function updateThemeSettings(body: ThemeSettingsDto) {
  await apiClient.put("/api/app/settings/theme", body);
}