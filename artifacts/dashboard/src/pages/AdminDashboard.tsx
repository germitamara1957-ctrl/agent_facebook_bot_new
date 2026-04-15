import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ShieldCheck, Users, TrendingUp, CreditCard, LogOut, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Ban,
  AlertCircle, Loader2, Building2, Activity, Package2, Pencil, X as XIcon, Check as CheckIcon,
  Plug, Plus, Trash2, Play, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isAdminLoggedIn, removeAdminToken, adminFetch } from "@/lib/adminAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlatformStats {
  tenants:  { total: number; active: number; trial: number; suspended: number; cancelled: number; expired: number; newThisMonth: number };
  plans:    { free: number; trial: number; starter: number; pro: number; agency: number };
  usage:    { conversationsThisMonth: number };
  revenue:  { totalDzd: number; monthYear: string };
  growth:   { month: string; count: number }[];
}

interface Tenant {
  id: number; name: string; slug: string; ownerEmail: string;
  plan: string; status: string; trialEndsAt: string | null;
  maxConversations: number; maxProducts: number; maxProviders: number;
  maxBroadcasts: number; createdAt: string; conversationsUsed: number;
}

interface TenantsResponse {
  tenants: Tenant[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface Payment {
  id: number; tenantId: number; tenantName: string; tenantSlug: string;
  tenantEmail: string; plan: string; amountDzd: number;
  status: string; paidAt: string | null; createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLAN_LABELS: Record<string, string> = {
  free: "مجاني", trial: "تجربة", starter: "مبتدئ", pro: "احترافي", agency: "وكالة",
};
const STATUS_LABELS: Record<string, string> = {
  trial: "تجربة", active: "نشط", suspended: "موقوف", cancelled: "ملغي", expired: "منتهي",
};
const PLAN_OPTIONS  = ["free", "trial", "starter", "pro", "agency"] as const;
const STATUS_OPTIONS = ["trial", "active", "suspended", "cancelled", "expired"] as const;

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; icon: React.ReactNode }> = {
    active:    { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle className="w-3 h-3" /> },
    trial:     { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",            icon: <Clock className="w-3 h-3" /> },
    suspended: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",    icon: <Ban className="w-3 h-3" /> },
    cancelled: { color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",              icon: <XCircle className="w-3 h-3" /> },
    expired:   { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",               icon: <AlertCircle className="w-3 h-3" /> },
  };
  const cfg = configs[status] ?? configs["cancelled"]!;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}{STATUS_LABELS[status] ?? status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free:    "bg-gray-100 text-gray-600 dark:bg-gray-800",
    trial:   "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    starter: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    pro:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    agency:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[plan] ?? colors["free"]}`}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────
function StatsCards({ stats }: { stats: PlatformStats }) {
  const cards = [
    { label: "إجمالي المستأجرين",       value: stats.tenants.total,       sub: `+${stats.tenants.newThisMonth} هذا الشهر`, icon: <Building2 className="w-5 h-5" />, color: "from-violet-500 to-violet-600" },
    { label: "المستأجرون النشطون",       value: stats.tenants.active,      sub: `${stats.tenants.trial} في فترة تجربة`,    icon: <CheckCircle className="w-5 h-5" />, color: "from-emerald-500 to-emerald-600" },
    { label: "محادثات هذا الشهر",        value: stats.usage.conversationsThisMonth.toLocaleString("ar"), sub: stats.revenue.monthYear, icon: <Activity className="w-5 h-5" />, color: "from-blue-500 to-blue-600" },
    { label: "الإيرادات الإجمالية",      value: `${stats.revenue.totalDzd.toLocaleString("ar")} د.ج`, sub: "من المدفوعات المكتملة", icon: <CreditCard className="w-5 h-5" />, color: "from-amber-500 to-amber-600" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label} className="border-none shadow-md shadow-black/5 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Plans Distribution ───────────────────────────────────────────────────────
function PlansDistribution({ plans }: { plans: PlatformStats["plans"] }) {
  const total = Object.values(plans).reduce((a, b) => a + b, 0) || 1;
  const rows = [
    { key: "agency",  label: "وكالة",    color: "bg-rose-500"    },
    { key: "pro",     label: "احترافي",  color: "bg-amber-500"   },
    { key: "starter", label: "مبتدئ",    color: "bg-violet-500"  },
    { key: "trial",   label: "تجربة",    color: "bg-blue-500"    },
    { key: "free",    label: "مجاني",    color: "bg-gray-400"    },
  ] as const;

  return (
    <Card className="border-none shadow-md shadow-black/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">توزيع الخطط</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map(({ key, label, color }) => {
          const count = plans[key];
          const pct   = Math.round((count / total) * 100);
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{count} <span className="text-muted-foreground">({pct}%)</span></span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Tenant Detail Modal ──────────────────────────────────────────────────────
function TenantDetailModal({
  tenant, onClose, onUpdated,
}: {
  tenant: Tenant | null; onClose: () => void; onUpdated: () => void;
}) {
  const [newStatus, setNewStatus] = useState(tenant?.status ?? "");
  const [newPlan,   setNewPlan]   = useState(tenant?.plan   ?? "");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (tenant) { setNewStatus(tenant.status); setNewPlan(tenant.plan); setError(""); }
  }, [tenant]);

  if (!tenant) return null;

  const handleUpdateStatus = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminFetch(`/api/admin/tenants/${tenant.id}/status`, {
        method: "PUT", body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})) as { message?: string }; setError(d.message ?? "خطأ"); return; }
      onUpdated(); onClose();
    } catch { setError("فشل الاتصال"); } finally { setLoading(false); }
  };

  const handleUpdatePlan = async () => {
    setLoading(true); setError("");
    try {
      const res = await adminFetch(`/api/admin/tenants/${tenant.id}/plan`, {
        method: "PUT", body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})) as { message?: string }; setError(d.message ?? "خطأ"); return; }
      onUpdated(); onClose();
    } catch { setError("فشل الاتصال"); } finally { setLoading(false); }
  };

  return (
    <Dialog open={!!tenant} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-500" />
            {tenant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl">
            <div><p className="text-muted-foreground text-xs">Slug</p><p className="font-mono font-medium">{tenant.slug}</p></div>
            <div><p className="text-muted-foreground text-xs">البريد</p><p className="font-medium truncate">{tenant.ownerEmail}</p></div>
            <div><p className="text-muted-foreground text-xs">الحالة الحالية</p><StatusBadge status={tenant.status} /></div>
            <div><p className="text-muted-foreground text-xs">الخطة الحالية</p><PlanBadge plan={tenant.plan} /></div>
            <div><p className="text-muted-foreground text-xs">المحادثات المستخدمة</p><p className="font-medium">{tenant.conversationsUsed}</p></div>
            <div><p className="text-muted-foreground text-xs">تاريخ الإنشاء</p><p className="font-medium">{new Date(tenant.createdAt).toLocaleDateString("ar-DZ")}</p></div>
          </div>

          {error && <p className="text-destructive text-xs text-center">{error}</p>}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleUpdateStatus} disabled={loading || newStatus === tenant.status} size="sm" variant="outline">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "تحديث الحالة"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger className="flex-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{PLAN_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleUpdatePlan} disabled={loading || newPlan === tenant.plan} size="sm" className="bg-violet-600 hover:bg-violet-700">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "تغيير الخطة"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tenants Table ────────────────────────────────────────────────────────────
function TenantsTab({ onSelectTenant }: { onSelectTenant: (t: Tenant) => void }) {
  const [data,    setData]    = useState<TenantsResponse | null>(null);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q   = filter !== "all" ? `&status=${filter}` : "";
      const res = await adminFetch(`/api/admin/tenants?page=${page}&limit=15${q}`);
      if (res.ok) setData(await res.json() as TenantsResponse);
    } finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {["المستأجر", "الخطة", "الحالة", "المحادثات", "تاريخ الإنشاء", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {(data?.tenants ?? []).map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={t.plan} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{t.conversationsUsed}</span>
                    {t.maxConversations !== -1 && (
                      <span className="text-muted-foreground text-xs"> / {t.maxConversations}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("ar-DZ")}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onSelectTenant(t)}>
                      إدارة
                    </Button>
                  </td>
                </tr>
              ))}
              {(data?.tenants ?? []).length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>الإجمالي: {data.pagination.total} مستأجر</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span>{page} / {data.pagination.pages}</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={page >= data.pagination.pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payments Table ───────────────────────────────────────────────────────────
function PaymentsTab() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [page,     setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await adminFetch(`/api/admin/payments?page=${page}&limit=15`);
      if (res.ok) {
        const d = await res.json() as { payments: Payment[] };
        setPayments(d.payments);
      }
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const payStatusColors: Record<string, string> = {
    paid:    "text-emerald-600 dark:text-emerald-400",
    pending: "text-amber-600 dark:text-amber-400",
    failed:  "text-red-600 dark:text-red-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && payments.length === 0 ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {["المستأجر", "الخطة", "المبلغ", "الحالة", "تاريخ الدفع"].map((h) => (
                  <th key={h} className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.tenantName}</p>
                    <p className="text-xs text-muted-foreground">{p.tenantEmail}</p>
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={p.plan} /></td>
                  <td className="px-4 py-3 font-mono font-medium">{p.amountDzd.toLocaleString("ar")} د.ج</td>
                  <td className={`px-4 py-3 font-medium text-xs ${payStatusColors[p.status] ?? ""}`}>
                    {p.status === "paid" ? "مدفوع" : p.status === "pending" ? "بانتظار" : "فشل"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString("ar-DZ") : "—"}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد مدفوعات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center gap-2">
        <Button variant="ghost" size="sm" className="h-7" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground flex items-center">صفحة {page}</span>
        <Button variant="ghost" size="sm" className="h-7" disabled={payments.length < 15} onClick={() => setPage((p) => p + 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Plan Types ───────────────────────────────────────────────────────────────
interface SubscriptionPlan {
  id: number; name: string; displayName: string; priceDzd: number;
  aiConversationsLimit: number; productsLimit: number; providersLimit: number;
  broadcastLimit: number; appointmentsEnabled: number; leadsEnabled: number;
  analyticsAdvanced: number; multiPage: number; isActive: number;
}

// ─── Plans Tab ────────────────────────────────────────────────────────────────
function PlansTab() {
  const [plans,    setPlans]    = useState<SubscriptionPlan[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<SubscriptionPlan>>({});
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/plans");
      if (res.ok) setPlans(await res.json() as SubscriptionPlan[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const startEdit = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setEditData({ ...plan });
    setError(""); setSuccess("");
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (id: number) => {
    setSaving(id); setError(""); setSuccess("");
    try {
      const res = await adminFetch(`/api/admin/plans/${id}`, {
        method: "PUT",
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        setError(d.message ?? "خطأ في الحفظ"); return;
      }
      const updated = await res.json() as SubscriptionPlan;
      setPlans((prev) => prev.map((p) => p.id === id ? updated : p));
      setSuccess("تم حفظ الخطة بنجاح ✓");
      setEditingId(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("فشل الاتصال بالخادم"); }
    finally { setSaving(null); }
  };

  const toggleActive = async (plan: SubscriptionPlan) => {
    setSaving(plan.id);
    try {
      const res = await adminFetch(`/api/admin/plans/${plan.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: plan.isActive === 1 ? 0 : 1 }),
      });
      if (res.ok) {
        const updated = await res.json() as SubscriptionPlan;
        setPlans((prev) => prev.map((p) => p.id === plan.id ? updated : p));
      }
    } finally { setSaving(null); }
  };

  const PLAN_COLORS: Record<string, string> = {
    free:    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    trial:   "bg-sky-100 text-sky-700 dark:bg-sky-900/40",
    starter: "bg-violet-100 text-violet-700 dark:bg-violet-900/40",
    pro:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40",
    agency:  "bg-rose-100 text-rose-700 dark:bg-rose-900/40",
  };

  const fmt = (v: number) => v === -1 ? "∞" : v.toLocaleString("ar");

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">اضغط <span className="font-semibold text-foreground">تعديل</span> لتغيير سعر أو حدود أي خطة — التغييرات تنعكس فوراً على صفحة الهبوط</p>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error   && <p className="text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
      {success && <p className="text-emerald-600 text-xs bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-3 py-2">{success}</p>}

      <div className="space-y-3">
        {plans.map((plan) => {
          const isEditing = editingId === plan.id;
          const isSaving  = saving === plan.id;

          return (
            <Card key={plan.id} className={`border shadow-sm transition-all ${isEditing ? "border-violet-400/60 shadow-violet-100 dark:shadow-violet-950/20" : "border-border/50 hover:shadow-md"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${PLAN_COLORS[plan.name] ?? PLAN_COLORS["free"]}`}>
                      {plan.name.toUpperCase()}
                    </span>
                    {isEditing ? (
                      <Input
                        value={editData.displayName ?? plan.displayName}
                        onChange={(e) => setEditData((d) => ({ ...d, displayName: e.target.value }))}
                        className="h-7 text-sm w-52 border-violet-300"
                      />
                    ) : (
                      <span className="font-semibold text-sm">{plan.displayName}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {plan.isActive ? "نشط" : "معطل"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <>
                        <Button size="sm" className="h-7 px-3 text-xs bg-violet-600 hover:bg-violet-700" onClick={() => void saveEdit(plan.id)} disabled={isSaving}>
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckIcon className="w-3 h-3 mr-1" />حفظ</>}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={cancelEdit}>
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => startEdit(plan)}>
                          <Pencil className="w-3 h-3 mr-1" />تعديل
                        </Button>
                        <Button size="sm" variant="ghost" className={`h-7 px-2 text-xs ${plan.isActive ? "text-orange-500 hover:text-orange-700" : "text-emerald-600 hover:text-emerald-700"}`}
                          onClick={() => void toggleActive(plan)} disabled={isSaving}>
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : plan.isActive ? "تعطيل" : "تفعيل"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                  {/* Price */}
                  <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">السعر / شهر</p>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input type="number" min={0} value={editData.priceDzd ?? plan.priceDzd}
                          onChange={(e) => setEditData((d) => ({ ...d, priceDzd: Number(e.target.value) }))}
                          className="h-7 text-sm w-full border-violet-300 p-1" />
                        <span className="text-xs text-muted-foreground shrink-0">د.ج</span>
                      </div>
                    ) : (
                      <p className="text-sm font-bold">{plan.priceDzd === 0 ? "مجاني" : `${plan.priceDzd.toLocaleString("ar")} د.ج`}</p>
                    )}
                  </div>

                  {/* Conversations */}
                  <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">المحادثات</p>
                    {isEditing ? (
                      <Input type="number" min={-1} value={editData.aiConversationsLimit ?? plan.aiConversationsLimit}
                        onChange={(e) => setEditData((d) => ({ ...d, aiConversationsLimit: Number(e.target.value) }))}
                        className="h-7 text-sm w-full border-violet-300 p-1" />
                    ) : (
                      <p className="text-sm font-bold">{fmt(plan.aiConversationsLimit)}</p>
                    )}
                  </div>

                  {/* Products */}
                  <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">المنتجات</p>
                    {isEditing ? (
                      <Input type="number" min={-1} value={editData.productsLimit ?? plan.productsLimit}
                        onChange={(e) => setEditData((d) => ({ ...d, productsLimit: Number(e.target.value) }))}
                        className="h-7 text-sm w-full border-violet-300 p-1" />
                    ) : (
                      <p className="text-sm font-bold">{fmt(plan.productsLimit)}</p>
                    )}
                  </div>

                  {/* Providers */}
                  <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">المزودون</p>
                    {isEditing ? (
                      <Input type="number" min={1} value={editData.providersLimit ?? plan.providersLimit}
                        onChange={(e) => setEditData((d) => ({ ...d, providersLimit: Number(e.target.value) }))}
                        className="h-7 text-sm w-full border-violet-300 p-1" />
                    ) : (
                      <p className="text-sm font-bold">{fmt(plan.providersLimit)}</p>
                    )}
                  </div>

                  {/* Broadcast */}
                  <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground font-medium">البث</p>
                    {isEditing ? (
                      <Input type="number" min={-1} value={editData.broadcastLimit ?? plan.broadcastLimit}
                        onChange={(e) => setEditData((d) => ({ ...d, broadcastLimit: Number(e.target.value) }))}
                        className="h-7 text-sm w-full border-violet-300 p-1" />
                    ) : (
                      <p className="text-sm font-bold">{fmt(plan.broadcastLimit)}</p>
                    )}
                  </div>

                  {/* Feature toggles */}
                  <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
                    <p className="text-[10px] text-muted-foreground font-medium">المميزات</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { key: "appointmentsEnabled" as const, label: "مواعيد" },
                        { key: "leadsEnabled" as const,        label: "عملاء" },
                        { key: "analyticsAdvanced" as const,   label: "تحليل" },
                        { key: "multiPage" as const,           label: "متعدد" },
                      ].map(({ key, label }) => {
                        const val = isEditing ? (editData[key] ?? plan[key]) : plan[key];
                        return isEditing ? (
                          <button key={key} type="button"
                            onClick={() => setEditData((d) => ({ ...d, [key]: val === 1 ? 0 : 1 }))}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${val === 1 ? "bg-violet-100 border-violet-300 text-violet-700" : "bg-muted border-border text-muted-foreground"}`}>
                            {label}
                          </button>
                        ) : (
                          <span key={key} className={`text-[10px] px-2 py-0.5 rounded-full ${val === 1 ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground line-through"}`}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground text-center pt-2">
        💡 القيمة <strong>-1</strong> تعني غير محدود. التغييرات تظهر فوراً في صفحة الهبوط العامة.
      </p>
    </div>
  );
}

// ─── Provider Types ───────────────────────────────────────────────────────────
interface AdminProvider {
  id: number; tenantId: number; name: string; providerType: string;
  apiKey: string; baseUrl: string | null; modelName: string;
  isActive: number; isEnabled: number; priority: number | null;
  failCount: number | null; lastUsedAt: string | null;
}

const PROVIDER_TYPES_LIST = [
  "Anthropic", "OpenAI", "Google Gemini", "Vertex AI", "DeepSeek",
  "Groq", "OpenRouter", "Orbit", "AgentRouter", "Custom",
];
const PROVIDER_DEFAULTS: Record<string, { url: string; model: string }> = {
  Anthropic:      { url: "https://api.anthropic.com",                              model: "claude-haiku-4-5"       },
  OpenAI:         { url: "https://api.openai.com",                                 model: "gpt-4o-mini"            },
  "Google Gemini":{ url: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.0-flash"      },
  DeepSeek:       { url: "https://api.deepseek.com",                               model: "deepseek-chat"          },
  Groq:           { url: "https://api.groq.com/openai",                            model: "llama-3.3-70b-versatile"},
  OpenRouter:     { url: "https://openrouter.ai/api",                              model: "openai/gpt-4o-mini"     },
  Orbit:          { url: "https://api.orbit-provider.com/api/provider/agy",        model: "claude-sonnet-4-6"      },
  AgentRouter:    { url: "https://agentrouter.org",                                model: "claude-sonnet-4-5-20250514" },
  Custom:         { url: "",                                                        model: ""                       },
};

// ─── Providers Tab ────────────────────────────────────────────────────────────
function ProvidersTab() {
  const [tenants,    setTenants]    = useState<{ id: number; name: string; slug: string }[]>([]);
  const [tenantId,   setTenantId]   = useState<number | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [providers,  setProviders]  = useState<AdminProvider[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing,    setEditing]    = useState<AdminProvider | null>(null);
  const [testResult, setTestResult] = useState<Record<number, { ok: boolean; msg: string }>>({});
  const [testing,    setTesting]    = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", providerType: "Anthropic", apiKey: "", baseUrl: "", modelName: "",
  });

  const loadTenants = useCallback(async () => {
    const res = await adminFetch("/api/admin/tenants?limit=100");
    if (res.ok) {
      const d = await res.json() as { tenants: { id: number; name: string; slug: string }[] };
      setTenants(d.tenants);
    }
  }, []);

  useEffect(() => { void loadTenants(); }, [loadTenants]);

  const loadProviders = useCallback(async (tid: number) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/providers?tenantId=${tid}`);
      if (res.ok) {
        const d = await res.json() as { tenant: { name: string }; providers: AdminProvider[] };
        setProviders(d.providers);
        setTenantName(d.tenant.name);
      }
    } finally { setLoading(false); }
  }, []);

  const handleSelectTenant = (id: number) => {
    setTenantId(id); setProviders([]); setTestResult({});
    void loadProviders(id);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "Anthropic", providerType: "Anthropic", apiKey: "", baseUrl: PROVIDER_DEFAULTS["Anthropic"]!.url, modelName: PROVIDER_DEFAULTS["Anthropic"]!.model });
    setDialogOpen(true);
  };

  const openEdit = (p: AdminProvider) => {
    setEditing(p);
    setForm({ name: p.name, providerType: p.providerType, apiKey: "", baseUrl: p.baseUrl ?? "", modelName: p.modelName });
    setDialogOpen(true);
  };

  const handleTypeChange = (val: string) => {
    const def = PROVIDER_DEFAULTS[val];
    setForm((f) => ({ ...f, providerType: val, name: val, baseUrl: def?.url ?? f.baseUrl, modelName: def?.model ?? f.modelName }));
  };

  const handleSave = async () => {
    if (!tenantId) return;
    const body = editing
      ? { ...form }
      : { tenantId, ...form };
    const url    = editing ? `/api/admin/providers/${editing.id}` : "/api/admin/providers";
    const method = editing ? "PUT" : "POST";
    const res = await adminFetch(url, { method, body: JSON.stringify(body) });
    if (res.ok) { setDialogOpen(false); void loadProviders(tenantId); }
  };

  const handleDelete = async (id: number) => {
    if (!tenantId) return;
    if (!confirm("هل أنت متأكد من حذف هذا المزود؟")) return;
    await adminFetch(`/api/admin/providers/${id}`, { method: "DELETE" });
    void loadProviders(tenantId);
  };

  const handleActivate = async (id: number) => {
    if (!tenantId) return;
    await adminFetch(`/api/admin/providers/${id}/activate`, { method: "POST" });
    void loadProviders(tenantId);
  };

  const handleTest = async (p: AdminProvider) => {
    setTesting(p.id);
    try {
      const res = await adminFetch(`/api/admin/providers/${p.id}/test`, { method: "POST" });
      const d = await res.json() as { success: boolean; response: string; latencyMs: number };
      setTestResult((prev) => ({ ...prev, [p.id]: { ok: d.success, msg: d.success ? `✅ ${d.response} (${d.latencyMs}ms)` : `❌ ${d.response}` } }));
    } finally { setTesting(null); }
  };

  const handleToggleEnabled = async (p: AdminProvider) => {
    if (!tenantId) return;
    await adminFetch(`/api/admin/providers/${p.id}`, {
      method: "PUT", body: JSON.stringify({ isEnabled: p.isEnabled === 1 ? 0 : 1 }),
    });
    void loadProviders(tenantId);
  };

  return (
    <div className="space-y-4">
      {/* Tenant selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Plug className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            className="flex-1 h-9 text-sm rounded-lg border border-border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={tenantId ?? ""}
            onChange={(e) => { const v = Number(e.target.value); if (v) handleSelectTenant(v); }}
          >
            <option value="">— اختر مستأجراً —</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
            ))}
          </select>
        </div>
        {tenantId && (
          <Button size="sm" className="gap-1.5 h-9" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5" /> إضافة مزود
          </Button>
        )}
      </div>

      {!tenantId && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          اختر مستأجراً من القائمة لعرض وإدارة مزودي الذكاء الاصطناعي
        </div>
      )}

      {tenantId && loading && (
        <div className="flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      )}

      {tenantId && !loading && providers.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          لا يوجد مزودون لـ <strong>{tenantName}</strong> — أضف مزوداً أولاً
        </div>
      )}

      {providers.length > 0 && (
        <div className="space-y-3">
          {providers.map((p) => (
            <Card key={p.id} className={`border border-border/60 shadow-sm ${p.isActive === 1 ? "ring-2 ring-primary border-transparent" : ""} ${p.isEnabled === 0 ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{p.name}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5">{p.providerType}</Badge>
                      {p.isActive === 1 && <Badge className="text-[10px] px-1.5 bg-primary">نشط</Badge>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>النموذج: <span className="font-mono text-foreground">{p.modelName}</span></span>
                      {p.baseUrl && <span className="truncate max-w-[200px]">URL: {p.baseUrl}</span>}
                    </div>
                    {testResult[p.id] && (
                      <p className={`text-xs mt-1.5 px-2 py-1 rounded ${testResult[p.id]!.ok ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                        {testResult[p.id]!.msg}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    <button onClick={() => void handleToggleEnabled(p)} title={p.isEnabled === 1 ? "مفعّل" : "معطّل"} className="p-1">
                      {p.isEnabled === 1
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => void handleTest(p)} disabled={testing === p.id}>
                      {testing === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} اختبار
                    </Button>
                    {p.isActive !== 1 && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10" onClick={() => void handleActivate(p.id)}>
                        <CheckCircle className="w-3 h-3" /> تفعيل
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(p)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => void handleDelete(p.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-primary" />
              {editing ? "تعديل المزود" : `إضافة مزود — ${tenantName}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">نوع المزود</label>
              <select
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.providerType}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                {PROVIDER_TYPES_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">الاسم</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9 text-sm" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                مفتاح API {editing && <span className="text-muted-foreground">(اتركه فارغاً للإبقاء على المفتاح الحالي)</span>}
              </label>
              <Input type="password" value={form.apiKey} onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))} className="h-9 text-sm font-mono" placeholder="sk-..." />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Base URL</label>
              <Input value={form.baseUrl} onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))} className="h-9 text-sm font-mono" dir="ltr" />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">اسم الموديل</label>
              <Input value={form.modelName} onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))} className="h-9 text-sm font-mono" dir="ltr" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button size="sm" className="bg-primary" onClick={() => void handleSave()}
              disabled={!form.name || !form.modelName || (!editing && !form.apiKey)}>
              {editing ? "حفظ التعديلات" : "إضافة المزود"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [, navigate]      = useLocation();
  const [stats,   setStats]   = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantKey, setTenantKey] = useState(0); // force TenantsTab refresh

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate("/admin/login", { replace: true }); return; }
    void loadStats();
  }, [navigate]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/stats");
      if (res.ok) setStats(await res.json() as PlatformStats);
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    removeAdminToken();
    navigate("/admin/login", { replace: true });
  };

  const handleTenantUpdated = () => {
    setTenantKey((k) => k + 1);
    void loadStats();
  };

  if (!isAdminLoggedIn()) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none">لوحة الإدارة العليا</h1>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => void loadStats()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-1.5">
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        {loading && !stats ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : stats ? (
          <StatsCards stats={stats} />
        ) : null}

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Plans dist */}
          <div className="lg:col-span-1">
            {stats && <PlansDistribution plans={stats.plans} />}
          </div>

          {/* Main Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="tenants">
              <TabsList className="mb-4 bg-muted/50 p-1 rounded-xl h-auto flex-wrap gap-0.5">
                <TabsTrigger value="tenants"   className="rounded-lg gap-1.5 text-xs data-[state=active]:shadow-sm">
                  <Users className="w-3.5 h-3.5" />المستأجرون
                </TabsTrigger>
                <TabsTrigger value="providers" className="rounded-lg gap-1.5 text-xs data-[state=active]:shadow-sm">
                  <Plug className="w-3.5 h-3.5" />المزودون
                </TabsTrigger>
                <TabsTrigger value="payments"  className="rounded-lg gap-1.5 text-xs data-[state=active]:shadow-sm">
                  <CreditCard className="w-3.5 h-3.5" />المدفوعات
                </TabsTrigger>
                <TabsTrigger value="plans"     className="rounded-lg gap-1.5 text-xs data-[state=active]:shadow-sm">
                  <Package2 className="w-3.5 h-3.5" />خطط الاشتراك
                </TabsTrigger>
                <TabsTrigger value="growth"    className="rounded-lg gap-1.5 text-xs data-[state=active]:shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5" />النمو
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tenants">
                <TenantsTab key={tenantKey} onSelectTenant={setSelectedTenant} />
              </TabsContent>

              <TabsContent value="providers">
                <ProvidersTab />
              </TabsContent>

              <TabsContent value="payments">
                <PaymentsTab />
              </TabsContent>

              <TabsContent value="plans">
                <PlansTab />
              </TabsContent>

              <TabsContent value="growth">
                {stats ? (
                  <Card className="border-none shadow-md shadow-black/5">
                    <CardHeader><CardTitle className="text-sm font-semibold">نمو المستأجرين — آخر 6 أشهر</CardTitle></CardHeader>
                    <CardContent>
                      {stats.growth.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm py-8">لا توجد بيانات بعد</p>
                      ) : (
                        <div className="space-y-3">
                          {stats.growth.map(({ month, count }) => (
                            <div key={month} className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-20 shrink-0">{month}</span>
                              <div className="flex-1 h-6 bg-muted/40 rounded-lg overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-lg flex items-center px-2 transition-all"
                                  style={{ width: `${Math.min(100, (count / Math.max(...stats.growth.map((g) => g.count))) * 100)}%` }}
                                >
                                  <span className="text-xs text-white font-medium">{count}</span>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs shrink-0">{count} مستأجر</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Tenant Detail Modal */}
      <TenantDetailModal
        tenant={selectedTenant}
        onClose={() => setSelectedTenant(null)}
        onUpdated={handleTenantUpdated}
      />
    </div>
  );
}
