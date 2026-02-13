
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
// import { Caixa } from "@/pages/Caixa";
import { Dossies } from "@/pages/Dossies";
import { IRS } from "@/pages/IRS";
import NotFound from "./pages/NotFound";
import { MinimizeProvider } from "@/contexts/MinimizeContext";
import { MinimizeDock } from "@/components/MinimizeDock";
import { MinimizeRenderer } from "@/components/MinimizeRenderer";
import { AdminImport } from "@/pages/AdminImport";
import { ServicosExternos } from "@/pages/ServicosExternos";
// import { ContaCorrente } from "@/pages/ContaCorrente";
import { Profile } from "@/pages/Profile";
import { Notifications } from "@/pages/Notifications";
import { ErroReports } from "@/pages/ErroReports";
import { Changelog } from "@/pages/Changelog";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // dados ficam "frescos" por 30s (evita refetches duplicados)
      refetchOnWindowFocus: false, // não refetch ao mudar de tab/janela
      retry: 1,                  // máximo 1 retry em caso de erro
    },
  },
});

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

const ManagerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (user?.role !== 'admin' && user?.role !== 'manager') {
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
        <Route path="dossies" element={<Dossies />} />
        <Route path="irs" element={<IRS />} />
        <Route path="tarefas" element={<Tasks />} />
        <Route path="registos-prediais" element={<RegistosPrediais />} />
        <Route path="templates" element={<AdminRoute><Templates /></AdminRoute>} />
        <Route path="document-templates" element={<DocumentTemplates />} />
        <Route path="documentos" element={<ManagerRoute><Documents /></ManagerRoute>} />
        <Route path="calendario" element={<Calendar />} />
        {/* <Route path="caixa" element={<ManagerRoute><Caixa /></ManagerRoute>} /> */}
        {/* <Route path="conta-corrente" element={<ManagerRoute><ContaCorrente /></ManagerRoute>} /> */}
        <Route path="admin-import" element={<AdminRoute><AdminImport /></AdminRoute>} />
        <Route path="servicos-externos" element={<ServicosExternos />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="notificacoes" element={<Notifications />} />
        <Route path="erro-reports" element={<AdminRoute><ErroReports /></AdminRoute>} />
        <Route path="changelog" element={<Changelog />} />
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
        <ErrorBoundary>
          <BrowserRouter>
            <MinimizeProvider>
              <AppRoutes />
              <MinimizeDock />
              <MinimizeRenderer />
            </MinimizeProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
