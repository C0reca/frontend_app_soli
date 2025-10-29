import React, { createContext, useContext, useMemo, useState } from 'react';

type MinimizedType = 'task' | 'process' | 'client';

export interface MinimizedItem {
  id: string;
  type: MinimizedType;
  title: string;
  payload: any;
}

interface MinimizeContextValue {
  items: MinimizedItem[];
  minimize: (item: Omit<MinimizedItem, 'id'>) => void;
  restore: (id: string) => MinimizedItem | undefined;
  remove: (id: string) => void;
  setActive: (item: MinimizedItem | null) => void;
  active: MinimizedItem | null;
}

const MinimizeContext = createContext<MinimizeContextValue | undefined>(undefined);

export const MinimizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<MinimizedItem[]>([]);
  const [active, setActive] = useState<MinimizedItem | null>(null);

  const minimize = (item: Omit<MinimizedItem, 'id'>) => {
    const id = `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems(prev => [...prev, { ...item, id }]);
  };

  const restore = (id: string) => {
    const found = items.find(i => i.id === id);
    if (found) setActive(found);
    return found;
  };

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const value = useMemo(() => ({ items, minimize, restore, remove, active, setActive }), [items, active]);

  return (
    <MinimizeContext.Provider value={value}>
      {children}
    </MinimizeContext.Provider>
  );
};

export const useMinimize = () => {
  const ctx = useContext(MinimizeContext);
  if (!ctx) throw new Error('useMinimize must be used within MinimizeProvider');
  return ctx;
};


