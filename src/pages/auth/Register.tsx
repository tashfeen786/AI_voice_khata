import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/api-client";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    shop_name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/register", form);
      const data = res.data;
      // Store token and user info (same as login)
      localStorage.setItem("access_token", data.access_token);
      toast.success("Registration successful! Welcome to Voice Khata");
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-primary grid place-items-center shadow-glow">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">Open Your Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">Start managing udhaar with voice</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Shop Name *</Label>
            <Input
              value={form.shop_name}
              onChange={e => setForm({ ...form, shop_name: e.target.value })}
              placeholder="e.g., Rashid Kiryana"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              placeholder="Your name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Phone (optional)</Label>
            <Input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+92 300 1234567"
            />
          </div>
          <div className="space-y-2">
            <Label>Password *</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Register & Start
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}