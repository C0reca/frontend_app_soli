import React from 'react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { Button } from '@/components/ui/button';

export const MinimizeDock: React.FC = () => {
  const { items, restore, remove } = useMinimize();
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {items.map(item => (
        <div key={item.id} className="bg-white shadow rounded border p-2 flex items-center space-x-2">
          <span className="text-sm text-gray-700">{item.title}</span>
          <Button size="sm" variant="outline" onClick={() => restore(item.id)}>Retomar</Button>
          <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>Fechar</Button>
        </div>
      ))}
    </div>
  );
};


