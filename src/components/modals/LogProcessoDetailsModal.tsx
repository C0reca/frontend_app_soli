import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogProcesso } from '@/hooks/useLogsProcesso';
import { FileIcon, Edit, CheckSquare, Building, Calendar, User, Paperclip, X } from 'lucide-react';
import api from '@/services/api';
import { LogProcessoModal } from './LogProcessoModal';

interface LogProcessoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: LogProcesso | null;
  processoId: number;
  onViewTask?: (taskId: number) => void;
  onViewProcess?: (processId: number) => void;
}

export const LogProcessoDetailsModal: React.FC<LogProcessoDetailsModalProps> = ({
  isOpen,
  onClose,
  log,
  processoId,
  onViewTask,
  onViewProcess,
}) => {
  const [docs, setDocs] = useState<{id:number; nome_original:string}[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (log?.id) {
      fetchDocs();
    }
  }, [log]);

  const fetchDocs = async () => {
    if (!log?.id) return;
    try {
      const res = await api.get(`/documentos/log/${log.id}`);
      setDocs(res.data);
    } catch {}
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      telefone: 'Telefonema',
      reuniao: 'Reunião',
      email: 'Email',
      documento: 'Documento',
      observacao: 'Observação',
      criacao: 'Criação',
      alteracao: 'Alteração',
      tarefa_criada: 'Tarefa Criada',
      tarefa_concluida: 'Tarefa Concluída',
      estado_alterado: 'Estado Alterado',
    };
    return labels[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'telefone':
        return 'bg-blue-100 text-blue-800';
      case 'reuniao':
        return 'bg-purple-100 text-purple-800';
      case 'email':
        return 'bg-red-100 text-red-800';
      case 'documento':
        return 'bg-gray-100 text-gray-800';
      case 'observacao':
        return 'bg-gray-100 text-gray-800';
      case 'tarefa_criada':
        return 'bg-purple-100 text-purple-800';
      case 'tarefa_concluida':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!log) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Registo</span>
              {!log.is_automatico && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>
              Informações completas do registo de atividade
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{log.titulo}</h3>
                <Badge className={`mt-2 ${getTipoColor(log.tipo)}`}>
                  {getTipoLabel(log.tipo)}
                </Badge>
              </div>
              {log.is_automatico && (
                <Badge variant="outline">Automático</Badge>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Data e Hora</label>
                  <p className="text-sm">{new Date(log.data_hora).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {log.funcionario_nome && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Responsável</label>
                    <p className="text-sm">{log.funcionario_nome}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Processo</label>
                  <p className="text-sm">
                    {onViewProcess ? (
                      <button
                        onClick={() => onViewProcess(processoId)}
                        className="text-blue-600 hover:underline"
                      >
                        Ver Processo #{processoId}
                      </button>
                    ) : (
                      `Processo #${processoId}`
                    )}
                  </p>
                </div>
              </div>

              {log.tarefa_id && (
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tarefa Relacionada</label>
                    <p className="text-sm">
                      {onViewTask ? (
                        <button
                          onClick={() => onViewTask(log.tarefa_id!)}
                          className="text-blue-600 hover:underline"
                        >
                          Ver Tarefa #{log.tarefa_id}
                        </button>
                      ) : (
                        `Tarefa #${log.tarefa_id}`
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {log.descricao && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Descrição</label>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {log.descricao}
                  </p>
                </div>
              </>
            )}

            {docs.length > 0 && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Anexos ({docs.length})
                  </label>
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                        <FileIcon className="h-4 w-4 text-gray-500" />
                        <a
                          href={`/api/documentos/download/${doc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex-1"
                        >
                          {doc.nome_original}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LogProcessoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          onClose();
        }}
        processoId={processoId}
        log={log}
      />
    </>
  );
};
