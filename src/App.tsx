
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Clients } from "@/pages/Clients";
import { Employees } from "@/pages/Employees";
import { Processes } from "@/pages/Processes";
import { Tasks } from "@/pages/Tasks";
import { Templates } from "@/pages/Templates";
import { DocumentTemplates } from "@/pages/DocumentTemplates";
import { Documents } from "@/pages/Documents";
import { Calendar } from "@/pages/Calendar";
import { RegistosPrediais } from "@/pages/RegistosPrediais";
import { Caixa } from "@/pages/Caixa";
import NotFound from "./pages/NotFound";
import { MinimizeProvider } from "@/contexts/MinimizeContext";
import { MinimizeDock } from "@/components/MinimizeDock";
import { MinimizeRenderer } from "@/components/MinimizeRenderer";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (user?.role !== 'admin') {
    return <Navigate to="/clientes" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/clientes" replace /> : <LoginPage />}
      />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="funcionarios" element={<AdminRoute><Employees /></AdminRoute>} />
        <Route path="processos" element={<Processes />} />
        <Route path="tarefas" element={<Tasks />} />
        <Route path="registos-prediais" element={<RegistosPrediais />} />
        <Route path="templates" element={<AdminRoute><Templates /></AdminRoute>} />
        <Route path="document-templates" element={<AdminRoute><DocumentTemplates /></AdminRoute>} />
        <Route path="documentos" element={<Documents />} />
        <Route path="calendario" element={<Calendar />} />
        <Route path="caixa" element={<AdminRoute><Caixa /></AdminRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MinimizeProvider>
            <AppRoutes />
            <MinimizeDock />
            <MinimizeRenderer />
          </MinimizeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
