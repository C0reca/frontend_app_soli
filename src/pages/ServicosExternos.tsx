import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/hooks/useEmployees';
import { useProcesses } from '@/hooks/useProcesses';
import { Task } from '@/hooks/useTasks';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';

interface ExternoTask {
  id: number;
  titulo: string;
  descricao?: string;
  data_fim?: string | null;
  processo_id: number;
  responsavel_id?: number | null;
}

export const ServicosExternos: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ExternoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { employees } = useEmployees();
  const { processes } = useProcesses();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach(e => map.set(e.id, e.nome));
    return map;
  }, [employees]);

  const processTitleById = useMemo(() => {
    const map = new Map<number, string>();
    processes.forEach((p: any) => map.set(p.id, p.titulo));
    return map;
  }, [processes]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tarefas/externos/');
      setItems(res.data);
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Falha ao carregar serviços externos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const downloadReport = async () => {
    try {
      const rows = items.map(it => `
        <tr>
          <td style="padding:6px;border:1px solid #ddd;">${it.id}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.titulo}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.descricao || ''}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.data_fim ? new Date(it.data_fim).toLocaleDateString('pt-BR') : ''}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.processo_id}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.responsavel_id ?? ''}</td>
        </tr>
      `).join('');
      const html = `
        <html>
          <head>
            <title>Serviços Externos</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: ui-sans-serif, system-ui; padding: 16px; }
              h1 { font-size: 18px; margin-bottom: 12px; }
              table { border-collapse: collapse; width: 100%; }
              th { text-align: left; padding: 8px; border:1px solid #ddd; background:#f3f4f6; }
            </style>
          </head>
          <body>
            <h1>Serviços Externos - Relatório</h1>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Descrição</th>
                  <th>Prazo</th>
                  <th>Processo</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </body>
        </html>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
          }, 150);
        };
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Serviços Externos</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'A atualizar...' : 'Atualizar'}</Button>
          <Button onClick={downloadReport}>Exportar PDF</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diligências Externas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map(it => (
              <div key={it.id} className="p-4 border rounded flex items-center justify-between cursor-pointer" onClick={async () => {
                try {
                  const res = await api.get(`/tarefas/${it.id}`);
                  setSelectedTask(res.data as Task);
                  setIsDetailsOpen(true);
                } catch {}
              }}>
                <div className="font-medium">{it.titulo}</div>
                <div className="flex-1 ml-4">
                  {it.descricao && <div className="text-sm text-muted-foreground whitespace-pre-wrap">{it.descricao}</div>}
                  <div className="text-xs text-muted-foreground mt-1">
                    Processo: {processTitleById.get(it.processo_id) || `ID ${it.processo_id}`} {it.data_fim ? `• Prazo: ${new Date(it.data_fim).toLocaleDateString('pt-BR')}` : ''}
                  </div>
                  {it.responsavel_id != null && (
                    <div className="text-xs text-muted-foreground mt-1">Responsável: {employeeNameById.get(it.responsavel_id) || `ID ${it.responsavel_id}`}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await api.patch(`/tarefas/externo/${it.id}`, { servico_externo: false });
                      toast({ title: 'Removido', description: 'Removido de Serviço Externo.' });
                      load();
                    } catch (e) {
                      toast({ title: 'Erro', description: 'Não foi possível remover.', variant: 'destructive' });
                    }
                  }}>
                    Remover
                  </Button>
                  <Button size="sm" variant="outline" onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await api.patch(`/tarefas/status/${it.id}`, { concluida: true });
                      toast({ title: 'Concluída', description: 'Tarefa concluída.' });
                      load();
                    } catch (e) {
                      toast({ title: 'Erro', description: 'Não foi possível concluir.', variant: 'destructive' });
                    }
                  }}>
                    <CheckSquare className="h-4 w-4 mr-2" /> Concluir
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-muted-foreground">Sem itens no momento.</div>
            )}
          </div>
        </CardContent>
      </Card>
      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
      />
    </div>
  );
};

export default ServicosExternos;


