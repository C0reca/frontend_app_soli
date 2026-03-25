
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MeetingWidget } from '@/components/MeetingWidget';
import { WorkModePanel } from '@/components/WorkModePanel';
import { GlobalSearch } from '@/components/GlobalSearch';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export const MainLayout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen(true),
  });

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <WorkModePanel />
      <MeetingWidget />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};
