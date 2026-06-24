import { FormEvent, useEffect, useState } from "react";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { profile, currentUser, refreshProfile, updateProfile, changePassword, isLoading } = useAuth();

  const [form, setForm] = useState({ name: "", surname: "", phoneNumber: "", email: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (!profile) refreshProfile().catch(() => {});
  }, [profile, refreshProfile]);

  useEffect(() => {
    if (profile) setForm({
      name: profile.name ?? "",
      surname: profile.surname ?? "",
      phoneNumber: profile.phoneNumber ?? "",
      email: profile.email ?? "",
    });
  }, [profile]);

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try { await updateProfile(form); }
    catch { toast.error("Could not save profile"); }
    finally { setSavingProfile(false); }
  };

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwd.next.length < 6) return toast.error("Password must be at least 6 characters");
    if (pwd.next !== pwd.confirm) return toast.error("New passwords do not match");
    setSavingPwd(true);
    try {
      await changePassword(pwd.current, pwd.next);
      setPwd({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? "Could not change password");
    } finally { setSavingPwd(false); }
  };

  const initials = `${form.name?.[0] ?? ""}${form.surname?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">My Account</h1>
        <p className="font-urdu text-sm text-muted-foreground mt-1">میرا کھاتہ</p>
      </div>

      <Card className="rounded-3xl border-border/60 shadow-soft overflow-hidden">
        <div className="h-24" style={{ background: "var(--gradient-primary)" }} />
        <CardContent className="-mt-12 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-card shadow-elevated">
              <AvatarFallback className="bg-primary text-primary-foreground font-display font-bold text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 sm:pb-2">
              {isLoading && !profile ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                <>
                  <div className="font-display text-xl font-bold">{form.name} {form.surname}</div>
                  <div className="text-sm text-muted-foreground">@{profile?.userName ?? currentUser?.preferred_username}</div>
                </>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentUser?.role?.map(r => (
                  <Badge key={r} variant="secondary" className="rounded-full bg-primary/10 text-primary border-0">
                    <ShieldCheck className="h-3 w-3 mr-1" /> {r}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="rounded-xl bg-secondary p-1">
          <TabsTrigger value="info" className="rounded-lg">Personal info</TabsTrigger>
          <TabsTrigger value="password" className="rounded-lg">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="rounded-3xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /> Personal information</CardTitle>
              <CardDescription>Update your name and contact details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSaveProfile} className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First name</Label>
                  <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Last name</Label>
                  <Input id="surname" value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })}
                    className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="+92 ..." className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={savingProfile}
                    className="h-11 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card className="rounded-3xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display">Change password</CardTitle>
              <CardDescription>Use a strong password you don't reuse anywhere else.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current">Current password</Label>
                  <Input id="current" type="password" value={pwd.current} required
                    onChange={e => setPwd({ ...pwd, current: e.target.value })}
                    className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">New password</Label>
                  <Input id="next" type="password" value={pwd.next} required
                    onChange={e => setPwd({ ...pwd, next: e.target.value })}
                    className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input id="confirm" type="password" value={pwd.confirm} required
                    onChange={e => setPwd({ ...pwd, confirm: e.target.value })}
                    className="h-11 rounded-xl bg-secondary border-0" />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingPwd}
                    className="h-11 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    {savingPwd ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating…</> : "Update password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}