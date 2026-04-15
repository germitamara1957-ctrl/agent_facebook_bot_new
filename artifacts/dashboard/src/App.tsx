import "./lib/fetchWithAuth";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AppLayout } from "@/components/AppLayout";
import { isLoggedIn } from "@/lib/auth";
import { isAdminLoggedIn } from "@/lib/adminAuth";
import Dashboard from "@/pages/Dashboard";
import AiSettings from "@/pages/AiSettings";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import PreOrders from "@/pages/PreOrders";
import Conversations from "@/pages/Conversations";
import Comments from "@/pages/Comments";
import FbConnect from "@/pages/FbConnect";
import Appointments from "@/pages/Appointments";
import Faq from "@/pages/Faq";
import Broadcasts from "@/pages/Broadcasts";
import Leads from "@/pages/Leads";
import Reliability from "@/pages/Reliability";
import DeliveryPrices from "@/pages/DeliveryPrices";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }
  return <Component />;
}

function AdminPrivateRoute({ component: Component }: { component: React.ComponentType }) {
  if (!isAdminLoggedIn()) {
    return <Redirect to="/admin/login" />;
  }
  return <Component />;
}

function AppRouter() {
  return (
    <Switch>
      {/* ── Admin Routes (بدون AppLayout) ──────────────────────────── */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">{() => <AdminPrivateRoute component={AdminDashboard} />}</Route>

      {/* ── Tenant Auth ─────────────────────────────────────────────── */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* ── Tenant Dashboard Routes ─────────────────────────────────── */}
      <Route>
        {() => (
          <AppLayout>
            <Switch>
              <Route path="/">{() => <PrivateRoute component={Dashboard} />}</Route>
              <Route path="/settings">{() => <PrivateRoute component={AiSettings} />}</Route>
              <Route path="/products">{() => <PrivateRoute component={Products} />}</Route>
              <Route path="/orders">{() => <PrivateRoute component={Orders} />}</Route>
              <Route path="/pre-orders">{() => <PrivateRoute component={PreOrders} />}</Route>
              <Route path="/conversations">{() => <PrivateRoute component={Conversations} />}</Route>
              <Route path="/comments">{() => <PrivateRoute component={Comments} />}</Route>
              <Route path="/fb-connect">{() => <PrivateRoute component={FbConnect} />}</Route>
              <Route path="/appointments">{() => <PrivateRoute component={Appointments} />}</Route>
              <Route path="/faq">{() => <PrivateRoute component={Faq} />}</Route>
              <Route path="/broadcast">{() => <PrivateRoute component={Broadcasts} />}</Route>
              <Route path="/leads">{() => <PrivateRoute component={Leads} />}</Route>
              <Route path="/reliability">{() => <PrivateRoute component={Reliability} />}</Route>
              <Route path="/delivery-prices">{() => <PrivateRoute component={DeliveryPrices} />}</Route>
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
