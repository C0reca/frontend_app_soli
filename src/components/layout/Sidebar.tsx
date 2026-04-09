
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
  Bug,
  Megaphone,
  Shield,
  Trash2,
  Settings,
  BookOpen,
  ScanSearch,
  Car,
  AlertTriangle,
  Mail,
  Target,
  Briefcase,
  Link,
  UserPlus,
  MapPin,
  Inbox,
  MessageSquare,
  HelpCircle,
  ListChecks,
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
  modulo?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', modulo: 'dashboard' },
      { icon: Calendar, label: 'Calendário', path: '/calendario', modulo: 'calendario' },
      { icon: CheckSquare, label: 'Tarefas', path: '/tarefas', modulo: 'tarefas' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { icon: Users, label: 'Entidades', path: '/clientes', modulo: 'clientes' },
      { icon: FolderOpen, label: 'Processos', path: '/processos', modulo: 'processos' },
      { icon: Folder, label: 'Arquivos', path: '/dossies', modulo: 'dossies' },
      { icon: Receipt, label: 'IRS', path: '/irs', modulo: 'irs' },
    ],
  },
  {
    title: 'Registos',
    items: [
      { icon: Building, label: 'Registos Prediais', path: '/registos-prediais', modulo: 'registos_prediais' },
      { icon: Car, label: 'Registos Automóveis', path: '/registos-automoveis', modulo: 'registos_automoveis' },
      { icon: Truck, label: 'Diligências Externas', path: '/servicos-externos', modulo: 'servicos_externos' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { icon: Wallet, label: 'Financeiro', path: '/financeiro', managerOrAdmin: true, modulo: 'financeiro' },
    ],
  },
  {
    title: 'Documentos',
    items: [
      { icon: FileText, label: 'Documentos', path: '/documentos', managerOrAdmin: true, modulo: 'documentos' },
      { icon: FileTemplate, label: 'Templates Docs', path: '/document-templates', modulo: 'templates_docs' },
      { icon: Trash2, label: 'Lixeira Templates', path: '/document-templates/lixeira', managerOrAdmin: true },
      { icon: ScanSearch, label: 'Assistente Docs', path: '/assistente-documentos', modulo: 'extracao_documentos' },
      { icon: FileTemplate, label: 'Templates', path: '/templates', adminOnly: true },
    ],
  },
  {
    title: 'Comunicação',
    items: [
      { icon: Inbox, label: 'Email Inbox', path: '/email-inbox', adminOnly: true },
      { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp', adminOnly: true },
      { icon: Mail, label: 'Correspondência', path: '/correspondencia', adminOnly: true },
      { icon: Target, label: 'Marketing', path: '/marketing', adminOnly: true },
      { icon: Link, label: 'Formulários', path: '/formularios-publicos', adminOnly: true },
      { icon: UserPlus, label: 'Portal Stand', path: '/stand-users', adminOnly: true },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { icon: Briefcase, label: 'Modo Trabalho', path: '/modo-trabalho', adminOnly: true },
      { icon: UserCog, label: 'Funcionários', path: '/funcionarios', managerOrAdmin: true },
      { icon: BookOpen, label: 'Base de Conhecimento', path: '/base-conhecimento' },
      { icon: HelpCircle, label: 'Ajuda Rápida', path: '/ajuda' },
      { icon: Megaphone, label: 'Novidades', path: '/changelog' },
    ],
  },
  {
    title: 'Administração',
    items: [
      { icon: Settings, label: 'Definições', path: '/definicoes', managerOrAdmin: true },
      { icon: Bug, label: 'Reportes', path: '/erro-reports', adminOnly: true },
      { icon: AlertTriangle, label: 'Logs de Erros', path: '/error-logs', adminOnly: true },
      { icon: Shield, label: 'Administração', path: '/admin', adminOnly: true },
    ],
  },
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
    if (item.modulo && !isAdminOrManager) return canView(item.modulo);
    return true;
  };

  return (
    <div className="h-full w-64 min-h-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">ProcessFlow</h1>
        <p className="text-sm text-gray-500">{panelLabel}</p>
        <p className="text-xs text-gray-400 mt-1">{user?.nome}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-3">
              <h3 className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.label}
                      {item.path === '/changelog' && <ChangelogBadge />}
                    </NavLink>
                  );
                })}
              </div>
            </div>
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
