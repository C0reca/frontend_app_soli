import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { useLogsProcesso, LogProcessoCreate } from '@/hooks/useLogsProcesso';
import { useEmployeeList } from '@/hooks/useEmployees';
import { useMinimize } from '@/contexts/MinimizeContext';
import { Minimize2, Upload, X, FileIcon } from 'lucide-react';
import api from '@/services/api';

const logSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  funcionario_id: z.number().optional(),
});

type LogFormData = z.infer<typeof logSchema>;

interface LogProcessoModalProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: number;
  log?: any | null;
}

export const LogProcessoModal: React.FC<LogProcessoModalProps> = ({
  isOpen,
  onClose,
  processoId,
  log = null,
}) => {
  const { createLog, updateLog, getTiposLog } = useLogsProcesso();
  const { data: employees = [] } = useEmployeeList();
  const { minimize } = useMinimize();
  const isEditing = !!log;
  const [docs, setDocs] = useState<{id:number; nome_original:string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const form = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      tipo: 'observacao',
      titulo: '',
      descricao: '',
      funcionario_id: undefined,
    },
  });

  useEffect(() => {
    if (log) {
      form.reset({
        tipo: log.tipo,
        titulo: log.titulo,
        descricao: log.descricao || '',
        funcionario_id: log.funcionario_id,
      });
      // Carregar documentos quando o log mudar
      if (log.id) {
        fetchDocs();
      }
    } else {
      form.reset({
        tipo: 'observacao',
        titulo: '',
        descricao: '',
        funcionario_id: undefined,
      });
      setDocs([]);
      setPendingFiles([]);
    }
  }, [log, form, isOpen]);

  const fetchDocs = async () => {
    if (!log?.id) {
      setDocs([]);
      return;
    }
    try {
      const res = await api.get(`/documentos/log/${log.id}`);
      console.log('Documentos carregados:', res.data);
      setDocs(res.data || []);
    } catch (error: any) {
      console.error('Erro ao buscar documentos:', error);
      // Se o endpoint retornar 500 ou erro, pode ser que a coluna não exista
      // Nesse caso, retornar lista vazia
      if (error?.response?.status === 500) {
        setDocs([]);
      } else {
        setDocs([]);
      }
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Se estamos editando, usar o log_id existente
    if (isEditing && log?.id) {
      try {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/documentos/upload-log/${log.id}`, formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        console.log('Upload response:', response.data);
        // Aguardar um pouco antes de recarregar para garantir que o BD foi atualizado
        await new Promise(resolve => setTimeout(resolve, 300));
        // Recarregar documentos após upload bem-sucedido
        await fetchDocs();
      } catch (error: any) {
        console.error('Erro ao fazer upload:', error);
        alert(error?.response?.data?.detail || 'Erro ao fazer upload do ficheiro. Por favor, tente novamente.');
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    } else {
      // Para novos logs, guardar temporariamente
      setPendingFiles([...pendingFiles, file]);
      e.target.value = '';
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  const onDeleteDoc = async (id: number) => {
    if (!confirm('Tem certeza que deseja apagar este ficheiro?')) {
      return;
    }
    try {
      await api.delete(`/documentos/${id}`);
      await fetchDocs();
    } catch (error: any) {
      alert(error?.response?.data?.detail || 'Erro ao apagar o ficheiro. Por favor, tente novamente.');
    }
  };

  const onSubmit = async (data: LogFormData) => {
    try {
      const logData: LogProcessoCreate = {
        processo_id: processoId,
        funcionario_id: data.funcionario_id || null,
        tipo: data.tipo,
        titulo: data.titulo,
        descricao: data.descricao || null,
      };

      if (isEditing) {
        await updateLog.mutateAsync({ id: log.id, data: logData });
      } else {
        const newLog = await createLog.mutateAsync(logData);
        // Fazer upload dos ficheiros pendentes após criar o log
        if (pendingFiles.length > 0 && newLog?.id) {
          for (const file of pendingFiles) {
            try {
              const form = new FormData();
              form.append('file', file);
              await api.post(`/documentos/upload-log/${newLog.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            } catch (error) {
              console.error('Erro ao fazer upload do ficheiro:', error);
            }
          }
        }
        setPendingFiles([]);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      telefone: 'Telefonema',
      reuniao: 'Reunião',
      email: 'Email',
      documento: 'Documento',
      observacao: 'Observação',
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? 'Editar Registo' : 'Adicionar Registo'}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? 'Edite as informações do registo do processo.'
                  : 'Adicione um novo registo de atividade ao processo.'
                }
              </DialogDescription>
            </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="absolute right-12 top-4"
              onClick={() => {
                const data = form.getValues();
                minimize({ 
                  type: 'log-processo', 
                  title: isEditing ? `Editar: ${log.titulo}` : 'Novo Registo', 
                  payload: { data, log, processoId } 
                });
                onClose();
              }}
              aria-label={'Minimizar'}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Atividade</label>
            <DynamicSelect
              categoria="tipo_log"
              value={form.watch('tipo')}
              onValueChange={(value) => form.setValue('tipo', value as any)}
              placeholder="Selecione o tipo"
              fallbackOptions={[
                { value: "telefone", label: "Telefonema" },
                { value: "reuniao", label: "Reunião" },
                { value: "email", label: "Email" },
                { value: "documento", label: "Documento" },
                { value: "observacao", label: "Observação" },
              ]}
            />
            {form.formState.errors.tipo && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.tipo.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              {...form.register('titulo')}
              placeholder="Digite o título da atividade"
            />
            {form.formState.errors.titulo && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              {...form.register('descricao')}
              placeholder="Descreva a atividade realizada"
              rows={3}
            />
            {form.formState.errors.descricao && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.descricao.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Responsável</label>
            <Select
              value={form.watch('funcionario_id') != null ? String(form.watch('funcionario_id')) : 'none'}
              onValueChange={(value) => form.setValue('funcionario_id', value === 'none' ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block">Anexos</label>
            <div className="flex items-center gap-2">
              <Input 
                type="file" 
                onChange={onUpload} 
                disabled={uploading}
                className="text-sm"
              />
              {uploading && <span className="text-xs text-gray-500">A enviar...</span>}
            </div>
            {isEditing && log?.id && (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {docs.map(d => (
                  <li key={d.id} className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                    <a 
                      href={`/api/documentos/download/${d.id}`} 
                      className="text-blue-600 hover:underline flex-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {d.nome_original}
                    </a>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      className="text-red-600 h-6 px-2" 
                      onClick={() => onDeleteDoc(d.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
                {docs.length === 0 && pendingFiles.length === 0 && <li className="text-gray-500 text-xs">Sem anexos</li>}
              </ul>
            )}
            {!isEditing && pendingFiles.length > 0 && (
              <ul className="list-disc pl-5 text-sm space-y-1">
                {pendingFiles.map((file, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-gray-500" />
                    <span className="flex-1">{file.name}</span>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      className="text-red-600 h-6 px-2" 
                      onClick={() => removePendingFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createLog.isPending || updateLog.isPending}
            >
              {createLog.isPending || updateLog.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
