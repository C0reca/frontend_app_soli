
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { EmployeeSidebar } from './EmployeeSidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="h-screen flex bg-gray-50">
      {isAdmin ? <Sidebar /> : <EmployeeSidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
