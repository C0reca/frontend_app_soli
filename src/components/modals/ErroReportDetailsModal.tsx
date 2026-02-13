import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useErroReport, useErroReportMutations } from '@/hooks/useErroReports';
import { Loader2, Download, Clock, User, Monitor, MapPin } from 'lucide-react';
import api from '@/services/api';

interface ErroReportDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: number | null;
}

const estadoBadgeVariant: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  em_analise: 'bg-yellow-100 text-yellow-800',
  resolvido: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
};

const estadoLabels: Record<string, string> = {
  novo: 'Novo',
  em_analise: 'Em Análise',
  resolvido: 'Resolvido',
  rejeitado: 'Rejeitado',
};

const prioridadeLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

const prioridadeBadgeVariant: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

export const ErroReportDetailsModal: React.FC<ErroReportDetailsModalProps> = ({
  open,
  onOpenChange,
  reportId,
}) => {
  const { data: report, isLoading } = useErroReport(open ? reportId : null);
  const { updateEstado } = useErroReportMutations();
  const [novoEstado, setNovoEstado] = useState('');
  const [comentario, setComentario] = useState('');
  const [notasInternas, setNotasInternas] = useState('');
  const [novaPrioridade, setNovaPrioridade] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveEstado = async () => {
    if (!report || !novoEstado) return;
    setSaving(true);
    try {
      await updateEstado.mutateAsync({
        reportId: report.id,
        payload: {
          estado: novoEstado,
          comentario: comentario.trim() || undefined,
          notas_internas: notasInternas.trim() || undefined,
          prioridade: novaPrioridade || undefined,
        },
      });
      setNovoEstado('');
      setComentario('');
      setNotasInternas('');
      setNovaPrioridade('');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAnexo = (anexoId: number, nomeOriginal: string) => {
    if (!report) return;
    api.get(`/erro-reports/${report.id}/anexos/${anexoId}/download`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeOriginal;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Reporte #{reportId}
            {report && (
              <>
                <Badge className={estadoBadgeVariant[report.estado] || ''}>
                  {estadoLabels[report.estado] || report.estado}
                </Badge>
                {report.prioridade && (
                  <Badge className={prioridadeBadgeVariant[report.prioridade] || ''}>
                    {prioridadeLabels[report.prioridade] || report.prioridade}
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : report ? (
          <Tabs defaultValue="detalhes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="anexos">
                Anexos ({report.anexos.length})
              </TabsTrigger>
              <TabsTrigger value="historico">
                Histórico ({report.historico.length})
              </TabsTrigger>
            </TabsList>

            {/* Details tab */}
            <TabsContent value="detalhes" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Reportado por:</span>
                  <span className="font-medium">{report.funcionario_nome || 'Desconhecido'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Data:</span>
                  <span className="font-medium">{formatDate(report.criado_em)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Página:</span>
                  <span className="font-medium font-mono text-xs">{report.pagina || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Versão:</span>
                  <span className="font-medium">{report.app_versao || '—'}</span>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">Descrição</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">
                  {report.descricao}
                </p>
              </div>

              {report.passos_reproduzir && (
                <div>
                  <Label className="text-gray-500">Passos para Reproduzir</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap bg-gray-50 rounded-md p-3">
                    {report.passos_reproduzir}
                  </p>
                </div>
              )}

              {report.mensagem_erro && (
                <div>
                  <Label className="text-gray-500">Mensagem de Erro</Label>
                  <pre className="mt-1 text-xs bg-red-50 text-red-800 rounded-md p-3 overflow-x-auto">
                    {report.mensagem_erro}
                  </pre>
                </div>
              )}

              {report.stack_trace && (
                <div>
                  <Label className="text-gray-500">Stack Trace</Label>
                  <pre className="mt-1 text-xs bg-gray-900 text-green-400 rounded-md p-3 overflow-x-auto max-h-48">
                    {report.stack_trace}
                  </pre>
                </div>
              )}

              {report.browser_info && (
                <div>
                  <Label className="text-gray-500">Browser</Label>
                  <p className="mt-1 text-xs text-gray-600 font-mono break-all">
                    {report.browser_info}
                  </p>
                </div>
              )}

              {/* Admin controls */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Ações do Administrador</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Alterar Estado</Label>
                    <Select value={novoEstado} onValueChange={setNovoEstado}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Alterar Prioridade</Label>
                    <Select value={novaPrioridade} onValueChange={setNovaPrioridade}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecionar prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Comentário (visível no histórico)</Label>
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Adicionar comentário..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Notas Internas</Label>
                  <Textarea
                    value={notasInternas || report.notas_internas || ''}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    placeholder="Notas internas (não visíveis ao utilizador)..."
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleSaveEstado}
                  disabled={saving || !novoEstado}
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    'Guardar Alterações'
                  )}
                </Button>
              </div>

              {report.resolvido_por_nome && (
                <div className="text-sm text-gray-500 border-t pt-3">
                  Resolvido por <strong>{report.resolvido_por_nome}</strong> em{' '}
                  {report.resolvido_em ? formatDate(report.resolvido_em) : '—'}
                </div>
              )}
            </TabsContent>

            {/* Attachments tab */}
            <TabsContent value="anexos" className="mt-4">
              {report.anexos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Sem anexos</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {report.anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{anexo.nome_original}</p>
                        <p className="text-xs text-gray-400">{formatDate(anexo.criado_em)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadAnexo(anexo.id, anexo.nome_original)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* History tab */}
            <TabsContent value="historico" className="mt-4">
              {report.historico.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Sem histórico</p>
              ) : (
                <div className="space-y-3">
                  {report.historico.map((h) => (
                    <div key={h.id} className="border-l-2 border-blue-200 pl-4 py-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{h.funcionario_nome || 'Sistema'}</span>
                        <span className="text-gray-400">alterou o estado</span>
                        {h.estado_anterior && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {estadoLabels[h.estado_anterior] || h.estado_anterior}
                            </Badge>
                            <span className="text-gray-400">&rarr;</span>
                          </>
                        )}
                        <Badge className={`text-xs ${estadoBadgeVariant[h.estado_novo] || ''}`}>
                          {estadoLabels[h.estado_novo] || h.estado_novo}
                        </Badge>
                      </div>
                      {h.comentario && (
                        <p className="text-sm text-gray-600 mt-1">{h.comentario}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(h.criado_em)}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-center text-gray-500 py-8">Reporte não encontrado</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
