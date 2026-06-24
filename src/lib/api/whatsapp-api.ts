import { apiClient } from "./api-client";

export interface WhatsAppStatusDto {
  connected: boolean;
  phoneNumber?: string | null;
  businessAccountId?: string | null;
}

export interface WhatsAppSettingsDto {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  notifyOnSale: boolean;
  notifyOnUdhaarReminder: boolean;
  notifyOnLowStock: boolean;
  notifyDailySummary: boolean;
}

export interface SendWhatsAppRequest {
  to: string;
  template?: string;
  message: string;
}

// Backend (best-effort; falls back to wa.me deep link if API not available)
export const getWhatsAppStatus = async () =>
  (await apiClient.get<WhatsAppStatusDto>("/api/app/whatsapp/status")).data;

export const updateWhatsAppSettings = async (input: WhatsAppSettingsDto) =>
  (await apiClient.put<WhatsAppSettingsDto>("/api/app/whatsapp/settings", input)).data;

export const sendWhatsAppMessage = async (req: SendWhatsAppRequest) =>
  (await apiClient.post("/api/app/whatsapp/send-message", req)).data;

export const testWhatsAppConnection = async () =>
  (await apiClient.post<{ ok: boolean }>("/api/app/whatsapp/test")).data;

/**
 * Compose a wa.me URL for a one-tap WhatsApp send from the user's phone.
 * Works on every device without backend setup.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = (phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${text}`;
}

export const templates = {
  saleConfirmation: (p: { name: string; amount: number; shop: string; invoice: string }) =>
    `Dear ${p.name}, your purchase of Rs. ${p.amount.toLocaleString("en-PK")} at ${p.shop} is confirmed. Invoice #${p.invoice}. Shukriya!`,
  paymentReminder: (p: { name: string; balance: number; shop: string }) =>
    `Assalam-o-Alaikum ${p.name}, you have pending dues of Rs. ${p.balance.toLocaleString("en-PK")} at ${p.shop}. Kindly settle at your earliest convenience. Shukriya.`,
  lowStock: (p: { product: string; stock: number }) =>
    `⚠️ Stock Alert: ${p.product} is low (${p.stock} remaining). Please restock.`,
  dailySummary: (p: { shop: string; total: number; cash: number; udhaar: number }) =>
    `📊 Daily Summary for ${p.shop}: Sales Rs. ${p.total.toLocaleString("en-PK")}, Cash Rs. ${p.cash.toLocaleString("en-PK")}, Udhaar Rs. ${p.udhaar.toLocaleString("en-PK")}.`,
};