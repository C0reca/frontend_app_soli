import React from 'react';
import { TiposProcessoManager } from '@/components/settings/TiposProcessoManager';

export const Templates: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Processos</h1>
          <p className="text-gray-600">Configure os tipos de processo com wizard, checklist, tarefas e documentos</p>
        </div>
      </div>

      <TiposProcessoManager />
    </div>
  );
};
