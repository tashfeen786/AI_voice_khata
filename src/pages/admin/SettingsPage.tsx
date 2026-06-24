import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllSettings,
  updateGeneralSettings, updatePosSettings, updateInvoiceSettings, updateThemeSettings,
  type GeneralSettingsDto, type PosSettingsDto, type InvoiceSettingsDto, type ThemeSettingsDto,
} from "@/lib/api/settings-api";
import { Loader2, Save, Mic } from "lucide-react";
import { FeatureGuard } from "@/components/auth/FeatureGuard";
import { WhatsAppSettingsDialog } from "@/components/dukaan/WhatsAppSettingsDialog";
import { MessageCircle } from "lucide-react";

const TIMEZONES = ["Asia/Karachi", "Asia/Dubai", "UTC"];

export default function SettingsPage() {
  const { hasPermission, isHost } = useAuth();
  const canEdit = hasPermission("App.Settings.Edit") || isHost;

  const [loading, setLoading] = useState(true);
  const [general, setGeneral] = useState<GeneralSettingsDto | null>(null);
  const [pos, setPos] = useState<PosSettingsDto | null>(null);
  const [invoice, setInvoice] = useState<InvoiceSettingsDto | null>(null);  // ✅ Fixed
  const [theme, setTheme] = useState<ThemeSettingsDto | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getAllSettings()
      .then(data => {
        if (!mounted) return;
        setGeneral(data.general ?? { storeName: "", currency: "PKR", timeZone: "Asia/Karachi" });
        setPos(data.pos ?? { defaultPaymentType: "cash", autoPrintReceipt: false, lowStockThreshold: 5 });
        setInvoice(data.invoice ?? { invoicePrefix: "INV-", taxRate: 0, showCostPrice: false });
        setTheme(data.theme ?? { primaryColor: "#6366f1", darkModeDefault: false });
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function handleSave<T>(key: string, body: T, fn: (b: T) => Promise<void>) {
    setSaving(key);
    try {
      await fn(body);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your voice ledger preferences
          </p>
        </div>
        {isHost ? (
          <Badge variant="secondary">Host (Global)</Badge>
        ) : (
          <Badge variant="outline">Shop Settings</Badge>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="voice">Voice Ledger</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          {general && (
            <Card>
              <CardHeader>
                <CardTitle>General</CardTitle>
                <CardDescription>Store identity and locale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Shop name</Label>
                    <Input id="storeName" value={general.storeName ?? ""}
                      onChange={e => setGeneral({ ...general, storeName: e.target.value })}
                      maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeNameUrdu">Shop name (Urdu)</Label>
                    <Input id="storeNameUrdu" dir="rtl" className="font-urdu"
                      value={general.storeNameUrdu ?? ""}
                      onChange={e => setGeneral({ ...general, storeNameUrdu: e.target.value })}
                      maxLength={100} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Shop address</Label>
                  <Textarea id="storeAddress" value={general.storeAddress ?? ""}
                    onChange={e => setGeneral({ ...general, storeAddress: e.target.value })}
                    maxLength={500} />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Phone</Label>
                    <Input id="storePhone" value={general.storePhone ?? ""}
                      onChange={e => setGeneral({ ...general, storePhone: e.target.value })}
                      maxLength={30} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">
                      Currency {!isHost && <span className="text-xs text-muted-foreground">(Set by Host)</span>}
                    </Label>
                    <Input id="currency" value={general.currency ?? "PKR"}
                      disabled={!isHost}
                      onChange={e => setGeneral({ ...general, currency: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time zone</Label>
                    <Select value={general.timeZone ?? "Asia/Karachi"}
                      onValueChange={v => setGeneral({ ...general, timeZone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button disabled={!canEdit || saving === "general"}
                    onClick={() => handleSave("general", general, updateGeneralSettings)}>
                    {saving === "general" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save General
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Voice Ledger Settings */}
        <TabsContent value="voice">
          {pos && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" /> Voice Ledger
                </CardTitle>
                <CardDescription>Default behavior for voice entries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default entry type</Label>
                    <Select value={pos.defaultPaymentType}
                      onValueChange={(v: "cash" | "udhaar") => setPos({ ...pos, defaultPaymentType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash Payment</SelectItem>
                        <SelectItem value="udhaar">Udhaar (Debit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="autoPrint" className="text-sm font-medium">Auto-print receipt after entry</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Print receipt for each voice transaction</p>
                  </div>
                  <Switch id="autoPrint" checked={pos.autoPrintReceipt}
                    onCheckedChange={v => setPos({ ...pos, autoPrintReceipt: v })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiptFooter">Receipt footer message</Label>
                  <Textarea id="receiptFooter" value={pos.receiptFooter ?? ""}
                    onChange={e => setPos({ ...pos, receiptFooter: e.target.value })}
                    maxLength={200} placeholder="Shukriya for using Voice Khata!" />
                </div>
                <div className="flex justify-end pt-2">
                  <Button disabled={!canEdit || saving === "pos"}
                    onClick={() => handleSave("pos", pos, updatePosSettings)}>
                    {saving === "pos" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Voice Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invoice */}
        <TabsContent value="invoice">
          {invoice && (
            <Card>
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
                <CardDescription>Invoice numbering and tax</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prefix">Invoice prefix</Label>
                    <Input id="prefix" value={invoice.invoicePrefix}
                      onChange={e => setInvoice({ ...invoice, invoicePrefix: e.target.value })}
                      maxLength={10} />
                    <p className="text-xs text-muted-foreground">Example: {invoice.invoicePrefix || "INV-"}0001</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax rate (%)</Label>
                    <Input id="taxRate" type="number" min={0} max={100} step="0.01"
                      value={invoice.taxRate}
                      onChange={e => setInvoice({ ...invoice, taxRate: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="showCost" className="text-sm font-medium">Show cost price on reports</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Display cost values in printable reports</p>
                  </div>
                  <Switch id="showCost" checked={invoice.showCostPrice}
                    onCheckedChange={v => setInvoice({ ...invoice, showCostPrice: v })} />
                </div>
                <div className="flex justify-end pt-2">
                  <Button disabled={!canEdit || saving === "invoice"}
                    onClick={() => handleSave("invoice", invoice, updateInvoiceSettings)}>
                    {saving === "invoice" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Theme */}
        <TabsContent value="theme">
          {theme && (
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Brand color and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={theme.primaryColor}
                      onChange={e => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="h-10 w-14 rounded-md border border-input bg-background cursor-pointer" />
                    <Input value={theme.primaryColor}
                      onChange={e => setTheme({ ...theme, primaryColor: e.target.value })}
                      placeholder="#6366f1" maxLength={7} className="max-w-[160px] font-mono" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="darkMode" className="text-sm font-medium">Dark mode by default</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">New users start in dark mode</p>
                  </div>
                  <Switch id="darkMode" checked={theme.darkModeDefault}
                    onCheckedChange={v => setTheme({ ...theme, darkModeDefault: v })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" value={theme.logoUrl ?? ""}
                    onChange={e => setTheme({ ...theme, logoUrl: e.target.value })}
                    placeholder="https://..." />
                  {theme.logoUrl && (
                    <div className="mt-2 rounded-lg border p-3 bg-muted/30 inline-block">
                      <img src={theme.logoUrl} alt="Logo preview" className="h-16 w-auto object-contain" />
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button disabled={!canEdit || saving === "theme"}
                    onClick={() => handleSave("theme", theme, updateThemeSettings)}>
                    {saving === "theme" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Theme
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp">
          <FeatureGuard feature="App.WhatsAppNotifications" fallback={
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
              WhatsApp notifications are not enabled for this shop.
            </CardContent></Card>
          }>
            <WhatsAppSettingsCard />
          </FeatureGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WhatsAppSettingsCard() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-success" /> WhatsApp Business Integration
        </CardTitle>
        <CardDescription>
          Connect WhatsApp to receive voice notes and send automated reminders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setOpen(true)} className="bg-gradient-primary text-primary-foreground gap-2">
          <MessageCircle className="h-4 w-4" /> Configure WhatsApp
        </Button>
        <WhatsAppSettingsDialog open={open} onOpenChange={setOpen} />
      </CardContent>
    </Card>
  );
}