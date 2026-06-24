import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/dukaan/AppShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";          // <-- IMPORT
import Profile from "./pages/account/Profile";
import Dashboard from "./pages/dukaan/Dashboard";
import POS from "./pages/dukaan/POS";
import Customers from "./pages/dukaan/Customers";
import Inventory from "./pages/dukaan/Inventory";
import Reports from "./pages/dukaan/Reports";
import VoiceInbox from "./pages/dukaan/VoiceInbox";
import NotFound from "./pages/NotFound";
import { HostGuard } from "@/components/auth/HostGuard";
import HostDashboard from "./pages/host/HostDashboard";
import HostTenants from "./pages/host/HostTenants";
import HostEditions from "./pages/host/HostEditions";
import HostUsers from "./pages/host/HostUsers";
import HostRoles from "./pages/host/HostRoles";
import HostSettings from "./pages/host/HostSettings";
import SettingsPage from "./pages/admin/SettingsPage";
import FeatureStatusPage from "./pages/admin/FeatureStatusPage";
import { UsersListPage } from "./pages/admin/UsersListPage";
import { RolesListPage } from "./pages/admin/RolesListPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />        {/* <-- NEW ROUTE */}
              <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pos" element={<ProtectedRoute requiredPermission="App.Sales.Create"><POS /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute requiredPermission="App.Customers"><Customers /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute requiredPermission="App.Products"><Inventory /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute requiredPermission="App.Reports"><Reports /></ProtectedRoute>} />
                <Route path="/voice-inbox" element={<ProtectedRoute requiredPermission="App.Sales.Create"><VoiceInbox /></ProtectedRoute>} />
                <Route path="/account/profile" element={<Profile />} />
                {/* Host / SaaS management */}
                <Route path="/host" element={<HostGuard><HostDashboard /></HostGuard>} />
                <Route path="/host/tenants" element={<HostGuard><HostTenants /></HostGuard>} />
                <Route path="/host/editions" element={<HostGuard><HostEditions /></HostGuard>} />
                <Route path="/host/users" element={<HostGuard><HostUsers /></HostGuard>} />
                <Route path="/host/roles" element={<HostGuard><HostRoles /></HostGuard>} />
                <Route path="/host/settings" element={<HostGuard requiredPermission="Host.Settings.View"><HostSettings /></HostGuard>} />
                {/* Tenant admin: settings & features */}
                <Route path="/admin/settings" element={<ProtectedRoute requiredPermission="App.Settings"><SettingsPage /></ProtectedRoute>} />
                <Route path="/admin/features" element={<ProtectedRoute><FeatureStatusPage /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute requiredPermission="App.MultiUser"><UsersListPage title="Users" subtitle="Manage tenant users" /></ProtectedRoute>} />
                <Route path="/admin/roles" element={<ProtectedRoute requiredPermission="App.MultiUser"><RolesListPage title="Roles" subtitle="Manage tenant roles" /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;