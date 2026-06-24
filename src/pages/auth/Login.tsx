import { FormEvent, useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api/api-client";
import { tokenStore } from "@/lib/api/token-store";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [username, setUsername] = useState(tokenStore.getRememberedUsername() ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(!!tokenStore.getRememberedUsername());
  const [tenantName, setTenantName] = useState<string>(tokenStore.getTenant() ?? "");
  const [submitting, setSubmitting] = useState(false);

  const hasToken = !!tokenStore.getAccessToken();
  if (hasToken) {
    return <Navigate to={location.state?.from ?? "/"} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tenantValue = tenantName.trim() || null;

      const formData = new URLSearchParams();
      formData.append("grant_type", "password");
      formData.append("username", username.trim());
      formData.append("password", password);
      formData.append("client_id", "App_App");

      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
      };
      if (tenantValue) headers["__tenant"] = tenantValue;

      const tokenRes = await apiClient.post("/connect/token", formData, { headers });
      const tokenData = tokenRes.data;
      tokenStore.setAccessToken(tokenData.access_token, tokenData.expires_in);
      tokenStore.setRefreshToken(tokenData.refresh_token);
      if (remember) tokenStore.setRememberedUsername(username.trim());

      // ✅ Store the tenant NAME (exactly as typed, not the session ID)
      if (tenantValue) {
        tokenStore.setTenant(tenantValue);
      } else {
        tokenStore.setTenant(null);
      }

      // Fetch session just for user info (name, role, etc.)
      const sessionRes = await apiClient.get("/api/app/session");
      const session = sessionRes.data;

      // ✅ Do NOT overwrite tenant – keep the name the user typed

      toast.success(`Welcome back, ${session.name || session.userName}`);
      const dest = session.tenantId == null ? "/host" : "/";
      window.location.href = location.state?.from ?? dest;

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.error_description || err?.response?.data?.detail || "Invalid username or password";
      toast.error(typeof msg === "string" ? msg : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel – keep as original */}
      <div className="hidden lg:flex relative overflow-hidden bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-80" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
              <Mic className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-white leading-none">Voice Khata</div>
              <div className="text-xs text-sidebar-foreground/70 mt-1">AI · WhatsApp Ledger</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-4 max-w-sm">
          <h2 className="font-display text-3xl font-bold text-white leading-tight">Apna udhaar, aawaz se.</h2>
          <p className="font-urdu text-2xl text-white/90 leading-snug">واٹس ایپ پر آواز بھیجیں، کھاتہ اپڈیٹ ہو جائے گا۔</p>
          <ul className="text-sm text-sidebar-foreground/80 space-y-2 pt-4">
            <li>• Voice notes become ledger entries</li>
            <li>• WhatsApp-native workflow</li>
            <li>• Automatic debit/credit extraction</li>
          </ul>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">© Voice Khata {new Date().getFullYear()}</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
              <Mic className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-display font-bold text-lg">Voice Khata</div>
          </div>

          <h1 className="font-display text-3xl font-bold mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-1">Back to your ledger.</p>
          <p className="font-urdu text-sm text-muted-foreground mb-8">اپنے کھاتے میں داخل ہوں</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tenant">Shop / Tenant Name</Label>
              <Input
                id="tenant"
                value={tenantName}
                onChange={e => setTenantName(e.target.value)}
                className="h-11 rounded-xl bg-secondary border-0"
                placeholder="Enter your shop name exactly as registered"
              />
              <p className="text-xs text-muted-foreground">
                For <strong>tashfeen247@gmail.com</strong>, use: <strong>Test Shop 1781550128</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Email / Username</Label>
              <Input id="username" autoComplete="username" required value={username}
                onChange={e => setUsername(e.target.value)}
                className="h-11 rounded-xl bg-secondary border-0" placeholder="your@email.com" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline" onClick={() => toast.info("Password reset coming soon")}>
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="h-11 rounded-xl bg-secondary border-0 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none cursor-pointer">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Remember my username
            </label>

            <Button type="submit" disabled={submitting}
              className="w-full h-11 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-glow font-semibold">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</> : "Sign in"}
            </Button>

            <div className="text-center text-sm">
              <Link to="/register" className="text-primary hover:underline">Don't have a shop? Register now</Link>
            </div>

            <div className="rounded-xl bg-secondary/60 border border-border/60 p-3 text-xs text-muted-foreground space-y-1">
              <div className="font-medium text-foreground">Demo accounts</div>
              <div>Host: <code className="text-foreground">admin@example.com</code> / <code>1q2w3E*</code> (no tenant)</div>
              <div>Shopkeeper: use your own registered email and exact tenant name.</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}