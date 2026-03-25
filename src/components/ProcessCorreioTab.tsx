import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, Mail, Pencil, Trash2, PackageCheck, MessageCircle, Check, CheckCheck, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCorrespondencias, type Correspondencia } from '@/hooks/useCorrespondencia';
import { useEmailsEnviados } from '@/hooks/useEmailTemplates';
import { useWhatsAppMensagens, useWhatsAppStatus, useWhatsAppMutations } from '@/hooks/useWhatsApp';
import { CorrespondenciaModal } from '@/components/modals/CorrespondenciaModal';
import { EnviarEmailModal } from '@/components/modals/EnviarEmailModal';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

interface ProcessCorreioTabProps {
  processoId: number;
  clienteId?: number;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-PT');
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

export const ProcessCorreioTab: React.FC<ProcessCorreioTabProps> = ({ processoId, clienteId }) => {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [corrModalOpen, setCorrModalOpen] = useState(false);
  const [editCorr, setEditCorr] = useState<Correspondencia | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [waMsg, setWaMsg] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { correspondencias, isLoading: loadingCorr, createCorrespondencia, updateCorrespondencia, deleteCorrespondencia } =
    useCorrespondencias({ processo_id: processoId });
  const { data: emailsEnviados = [], isLoading: loadingEmails } = useEmailsEnviados({ processo_id: processoId });
  const { data: waStatus } = useWhatsAppStatus();
  const { data: waData, isLoading: loadingWA } = useWhatsAppMensagens(processoId, clienteId);
  const waMensagens = waData?.items ?? [];
  const { enviarTexto } = useWhatsAppMutations();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [waMensagens]);

  const handleCorrSubmit = (data: any) => {
    if (editCorr) {
      updateCorrespondencia.mutate({ id: editCorr.id, ...data }, { onSuccess: () => { setCorrModalOpen(false); setEditCorr(null); } });
    } else {
      createCorrespondencia.mutate(data, { onSuccess: () => setCorrModalOpen(false) });
    }
  };

  const handleDeleteCorr = async (id: number) => {
    const ok = await confirm({
      title: 'Eliminar correspondência?',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteCorrespondencia.mutate(id);
  };

  const handleSendWA = () => {
    if (!waMsg.trim() || !waPhone.trim()) return;
    enviarTexto.mutate(
      { telefone: waPhone.trim(), mensagem: waMsg.trim(), processo_id: processoId, cliente_id: clienteId },
      { onSuccess: () => setWaMsg('') },
    );
  };

  const waStatusIcon = (estado: string) => {
    switch (estado) {
      case 'pendente': return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'enviada': return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'entregue': return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'lida': return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'falhou': return <XCircle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setEmailModalOpen(true)}>
          <Mail className="h-4 w-4" />
          Enviar Email
        </Button>
        <Button size="sm" className="gap-2" onClick={() => { setEditCorr(null); setCorrModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nova Carta
        </Button>
      </div>

      <Tabs defaultValue="cartas">
        <TabsList>
          <TabsTrigger value="cartas">Cartas ({correspondencias.length})</TabsTrigger>
          <TabsTrigger value="emails">Emails ({emailsEnviados.length})</TabsTrigger>
          {waStatus?.configurado && (
            <TabsTrigger value="whatsapp">
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              WhatsApp ({waMensagens.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="cartas" className="mt-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Data</TableHead>
                  <TableHead className="text-sm">Tipo</TableHead>
                  <TableHead className="text-sm">Assunto</TableHead>
                  <TableHead className="text-sm">Estado</TableHead>
                  <TableHead className="text-sm">Tracking</TableHead>
                  <TableHead className="text-sm text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCorr ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">A carregar...</TableCell></TableRow>
                ) : correspondencias.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">Nenhuma correspondência</TableCell></TableRow>
                ) : (
                  correspondencias.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(c.data_envio || c.data_rececao || c.criado_em)}</TableCell>
                      <TableCell className="text-sm">
                        {c.tipo === 'enviada'
                          ? <Badge className="bg-orange-100 text-orange-800 text-xs"><Send className="h-3 w-3 mr-1" />Enviada</Badge>
                          : <Badge className="bg-purple-100 text-purple-800 text-xs"><PackageCheck className="h-3 w-3 mr-1" />Recebida</Badge>}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{c.assunto}</TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="outline" className="text-xs">{c.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{c.tracking_code || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditCorr(c); setCorrModalOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCorr(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="emails" className="mt-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">Data</TableHead>
                  <TableHead className="text-sm">Destinatário</TableHead>
                  <TableHead className="text-sm">Assunto</TableHead>
                  <TableHead className="text-sm">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEmails ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">A carregar...</TableCell></TableRow>
                ) : emailsEnviados.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Nenhum email enviado</TableCell></TableRow>
                ) : (
                  emailsEnviados.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(e.criado_em)}</TableCell>
                      <TableCell className="text-sm">{e.destinatario}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{e.assunto}</TableCell>
                      <TableCell className="text-sm">
                        {e.estado === 'enviado'
                          ? <Badge className="bg-green-100 text-green-800 text-xs">Enviado</Badge>
                          : <Badge className="bg-red-100 text-red-800 text-xs">Erro</Badge>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {waStatus?.configurado && (
          <TabsContent value="whatsapp" className="mt-3">
            <div className="border rounded-lg flex flex-col h-[400px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingWA ? (
                  <p className="text-center text-sm text-muted-foreground py-8">A carregar...</p>
                ) : waMensagens.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem WhatsApp neste processo</p>
                ) : (
                  waMensagens.map((m) => (
                    <div key={m.id} className={`flex ${m.direcao === 'enviada' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        m.direcao === 'enviada' ? 'bg-green-100 text-green-900' : 'bg-white border text-gray-900'
                      }`}>
                        {m.tipo === 'template' && m.template_nome && (
                          <p className="text-xs italic text-muted-foreground mb-1">Template: {m.template_nome}</p>
                        )}
                        <p className="whitespace-pre-wrap">{m.conteudo || '(sem conteúdo)'}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">{formatTime(m.criado_em)}</span>
                          {m.direcao === 'enviada' && waStatusIcon(m.estado)}
                        </div>
                        {m.estado === 'falhou' && m.erro_detalhe && (
                          <p className="text-xs text-red-500 mt-1">{m.erro_detalhe}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3 space-y-2">
                {!waMensagens.some(m => m.telefone_destino) && (
                  <input
                    type="text"
                    placeholder="Nº telefone (ex: 351912345678)"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                  />
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escrever mensagem..."
                    value={waMsg}
                    onChange={(e) => setWaMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendWA(); }
                    }}
                    rows={2}
                    className="text-sm resize-none"
                  />
                  <Button
                    size="icon"
                    className="shrink-0 self-end"
                    disabled={!waMsg.trim() || (!waPhone.trim() && !waMensagens.some(m => m.telefone_destino)) || enviarTexto.isPending}
                    onClick={() => {
                      if (!waPhone && waMensagens.length > 0) {
                        setWaPhone(waMensagens[0].telefone_destino);
                      }
                      handleSendWA();
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <CorrespondenciaModal
        isOpen={corrModalOpen}
        onClose={() => { setCorrModalOpen(false); setEditCorr(null); }}
        onSubmit={handleCorrSubmit}
        correspondencia={editCorr}
        processoId={processoId}
        clienteId={clienteId}
        isLoading={createCorrespondencia.isPending || updateCorrespondencia.isPending}
      />

      <EnviarEmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        processoId={processoId}
      />
      {ConfirmDialogComponent}
    </div>
  );
};
