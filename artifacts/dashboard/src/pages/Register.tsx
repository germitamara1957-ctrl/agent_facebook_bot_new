import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Bot, Loader2, UserPlus, Building2, Mail, Lock, AtSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setToken } from "@/lib/auth";

export default function Register() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", slug: "", ownerEmail: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = k === "slug"
      ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
      : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { token?: string; message?: string };
      if (!res.ok) { setError(data.message || "حدث خطأ أثناء التسجيل"); return; }
      setToken(data.token!);
      navigate("/", { replace: true });
    } catch {
      setError("فشل الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4" dir="rtl">
      <Card className="w-full max-w-md border-none shadow-xl shadow-black/10">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-9 h-9 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">إنشاء حساب مجاني</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">ابدأ تجربتك المجانية الآن — لا يلزم بطاقة</p>
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
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                اسم نشاطك التجاري
              </label>
              <Input
                value={form.name}
                onChange={set("name")}
                placeholder="مثال: متجر الأزياء"
                className="h-11 bg-muted/30"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-muted-foreground" />
                معرّف الحساب (Slug)
              </label>
              <Input
                value={form.slug}
                onChange={set("slug")}
                placeholder="metzar-el-azya"
                className="h-11 bg-muted/30 font-mono"
                required
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">حروف إنجليزية صغيرة وأرقام وشرطات فقط</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={form.ownerEmail}
                onChange={set("ownerEmail")}
                placeholder="you@example.com"
                className="h-11 bg-muted/30"
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                كلمة المرور
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="8 أحرف على الأقل"
                className="h-11 bg-muted/30"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !form.name || !form.slug || !form.ownerEmail || !form.password}
              className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              إنشاء الحساب مجاناً
            </Button>

            <p className="text-center text-sm text-muted-foreground pt-1">
              لديك حساب بالفعل؟{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
