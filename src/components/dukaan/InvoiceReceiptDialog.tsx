import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, MessageCircle, Receipt } from "lucide-react";
import type { POSSaleResultDto } from "@/lib/api/types";
import { buildWhatsAppUrl, templates } from "@/lib/api/whatsapp-api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sale: POSSaleResultDto | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shopName?: string;
}

const fmt = (n: number) => "Rs " + n.toLocaleString("en-PK");

export function InvoiceReceiptDialog({ open, onOpenChange, sale, customerName, customerPhone, shopName = "DukaanPro" }: Props) {
  if (!sale) return null;

  const handlePrint = () => window.print();
  const handleWhatsApp = () => {
    if (!customerPhone) return;
    const msg = templates.saleConfirmation({
      name: customerName || "Customer",
      amount: sale.totalAmount,
      shop: shopName,
      invoice: sale.invoiceNumber,
    });
    window.open(buildWhatsAppUrl(customerPhone, msg), "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md print:shadow-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-success" /> Invoice {sale.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <div id="invoice-print" className="rounded-xl border border-border p-4 space-y-3 text-sm">
          <div className="text-center">
            <div className="font-display font-bold text-lg">{shopName}</div>
            <div className="text-[11px] text-muted-foreground">{new Date(sale.saleDate).toLocaleString("en-PK")}</div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground border-y border-border py-2">
            <span>Customer: {customerName || "Walk-in"}</span>
            <span className="capitalize">{sale.paymentType}</span>
          </div>
          <div className="space-y-1">
            {sale.items.map((it, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="truncate">{it.productName} × {it.quantity}</span>
                <span className="tabular-nums">{fmt(it.totalPrice)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2 space-y-1">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{fmt(sale.subTotal)}</span></div>
            {sale.discountAmount > 0 && <div className="flex justify-between text-danger"><span>Discount</span><span className="tabular-nums">- {fmt(sale.discountAmount)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span className="tabular-nums">{fmt(sale.totalAmount)}</span></div>
          </div>
          <div className="text-center text-[11px] text-muted-foreground pt-1">Shukriya · شکریہ</div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 print:hidden">
          {customerPhone && (
            <Button variant="outline" onClick={handleWhatsApp} className="border-success/40 text-success hover:bg-success/5 gap-2">
              <MessageCircle className="h-4 w-4" /> Send via WhatsApp
            </Button>
          )}
          <Button onClick={handlePrint} className="bg-gradient-primary text-primary-foreground gap-2">
            <Printer className="h-4 w-4" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}