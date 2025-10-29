import React from 'react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { TaskModal } from '@/components/modals/TaskModal';
import { ProcessModal } from '@/components/modals/ProcessModal';
import { ClientModal } from '@/components/modals/ClientModal';
import { LogProcessoModal } from '@/components/modals/LogProcessoModal';

export const MinimizeRenderer: React.FC = () => {
  const { active, setActive, remove } = useMinimize();
  if (!active) return null;

  const closeAndClear = () => {
    if (active) remove(active.id);
    setActive(null);
  };

  if (active.type === 'task') {
    const { data, parentId, processoId, task } = active.payload || {};
    return (
      <TaskModal
        isOpen={true}
        onClose={closeAndClear}
        task={task || null}
        parentId={parentId ?? null}
        processoId={processoId ?? null}
        initialData={data}
      />
    );
  }

  if (active.type === 'process') {
    const { process, data } = active.payload || {};
    return (
      <ProcessModal
        isOpen={true}
        onClose={closeAndClear}
        process={process || null}
        initialData={data}
      />
    );
  }

  if (active.type === 'client') {
    const { client, data } = active.payload || {};
    return (
      <ClientModal
        isOpen={true}
        onClose={closeAndClear}
        client={client || null}
        initialData={data}
      />
    );
  }

  if (active.type === 'log-processo') {
    const { log, processoId, data } = active.payload || {};
    return (
      <LogProcessoModal
        isOpen={true}
        onClose={closeAndClear}
        processoId={processoId || 0}
        log={log || null}
      />
    );
  }

  return null;
};


