
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  FolderOpen,
  Folder,
  CheckSquare,
  FileText,
  FileText as FileTemplate,
  LogOut,
  Calendar,
  Building,
  Wallet,
  Truck,
  Receipt,
  Landmark,
  Bug,
  Megaphone,
  Shield,
  Trash2,
  Settings,
  BookOpen,
  ScanSearch
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { ChangelogBadge } from '@/components/ChangelogBadge';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  adminOnly?: boolean;
  managerOrAdmin?: boolean;
  modulo?: string; // para filtragem por permissão de módulo
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', modulo: 'dashboard' },
  { icon: Calendar, label: 'Calendário', path: '/calendario', modulo: 'calendario' },
  { icon: Users, label: 'Entidades', path: '/clientes', modulo: 'clientes' },
  { icon: UserCog, label: 'Funcionários', path: '/funcionarios', managerOrAdmin: true },
  { icon: Folder, label: 'Arquivos', path: '/dossies', modulo: 'dossies' },
  { icon: FolderOpen, label: 'Processos', path: '/processos', modulo: 'processos' },
  { icon: Receipt, label: 'IRS', path: '/irs', modulo: 'irs' },
  { icon: CheckSquare, label: 'Compromissos', path: '/tarefas', modulo: 'tarefas' },
  { icon: Truck, label: 'Diligências Externas', path: '/servicos-externos', modulo: 'servicos_externos' },
  { icon: Building, label: 'Registos Prediais', path: '/registos-prediais', modulo: 'registos_prediais' },
  { icon: Wallet, label: 'Caixa', path: '/caixa', managerOrAdmin: true, modulo: 'caixa' },
  { icon: Landmark, label: 'Conta Corrente', path: '/conta-corrente', managerOrAdmin: true, modulo: 'financeiro' },
  { icon: FileTemplate, label: 'Templates', path: '/templates', adminOnly: true },
  { icon: FileTemplate, label: 'Templates Docs', path: '/document-templates', modulo: 'templates_docs' },
  { icon: Trash2, label: 'Lixeira Templates', path: '/document-templates/lixeira', managerOrAdmin: true },
  { icon: FileText, label: 'Documentos', path: '/documentos', managerOrAdmin: true, modulo: 'documentos' },
  { icon: ScanSearch, label: 'Assistente Docs', path: '/assistente-documentos', modulo: 'extracao_documentos' },
  { icon: BookOpen, label: 'Base de Conhecimento', path: '/base-conhecimento' },
  { icon: Bug, label: 'Reportes', path: '/erro-reports', adminOnly: true },
  { icon: Settings, label: 'Definições', path: '/definicoes', managerOrAdmin: true },
  { icon: Shield, label: 'Administração', path: '/admin', adminOnly: true },
  { icon: Megaphone, label: 'Novidades', path: '/changelog' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const role = user?.role;
  const { canView, isAdminOrManager } = usePermissions();

  const panelLabel = role === 'admin'
    ? 'Painel Administrativo'
    : role === 'manager'
      ? 'Painel de Gestão'
      : 'Painel do Funcionário';

  const isItemVisible = (item: NavItem): boolean => {
    if (item.adminOnly) return role === 'admin';
    if (item.managerOrAdmin) return role === 'admin' || role === 'manager';
    // Para funcionários, verificar permissão por módulo
    if (item.modulo && !isAdminOrManager) return canView(item.modulo);
    return true;
  };

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">ProcessFlow</h1>
        <p className="text-sm text-gray-500">{panelLabel}</p>
        <p className="text-xs text-gray-400 mt-1">{user?.nome}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.filter(item => isItemVisible(item)).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
              {item.path === '/changelog' && <ChangelogBadge />}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
};
