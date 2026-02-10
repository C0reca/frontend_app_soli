import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Folder,
  CheckSquare,
  FileText,
  LogOut,
  Calendar, Building, Wallet, Truck,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Calendário', path: '/calendario' },
  { icon: Users, label: 'Entidades', path: '/clientes' },
  { icon: Folder, label: 'Arquivos', path: '/dossies' },
  { icon: FolderOpen, label: 'Processos', path: '/processos' },
  { icon: Receipt, label: 'IRS', path: '/irs' },
  { icon: CheckSquare, label: 'Compromissos', path: '/tarefas' },
  { icon: Truck, label: 'Serviços Externos', path: '/servicos-externos' },
  { icon: Building, label: 'Registos Prediais', path: '/registos-prediais' },
];

export const EmployeeSidebar: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">ProcessFlow</h1>
        <p className="text-sm text-gray-500">Painel do Funcionário</p>
        <p className="text-xs text-gray-400 mt-1">{user?.nome}</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
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