import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Loader2, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isAdminLoggedIn, setAdminToken } from "@/lib/adminAuth";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) navigate("/admin", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { message?: string };
        setError(data.message ?? "خطأ في تسجيل الدخول");
        return;
      }
      const data = await res.json() as { token: string };
      setAdminToken(data.token);
      navigate("/admin", { replace: true });
    } catch {
      setError("فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  if (isAdminLoggedIn()) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-xl shadow-black/10">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">لوحة الإدارة العليا</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Super Admin Dashboard</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم المستخدم</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                className="h-11 bg-muted/30"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-muted/30"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 hover:shadow-xl transition-all gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              تسجيل الدخول
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
