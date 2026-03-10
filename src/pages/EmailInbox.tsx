import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEmailStatus, useEmailMensagens, useEmailMensagem, useEmailNaoLidos, useEmailSyncStatus, useEmailMutations } from '@/hooks/useEmailInbox';
import { Mail, RefreshCw, Send, Search, Eye, EyeOff, ChevronLeft, ChevronRight, Inbox, AlertCircle, Radio } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const EmailInbox: React.FC = () => {
  const { toast } = useToast();
  const [pasta, setPasta] = useState('INBOX');
  const [direcao, setDirecao] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [lido, setLido] = useState<boolean | undefined>();
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: status } = useEmailStatus();
  const { data: mensagens, isLoading } = useEmailMensagens(pasta, direcao, search || undefined, lido, limit, offset);
  const { data: detail } = useEmailMensagem(selectedId || 0);
  const { data: naoLidos } = useEmailNaoLidos();
  const { data: syncStatus } = useEmailSyncStatus();
  const { sincronizar, enviar, marcarLido } = useEmailMutations();

  // Compose form
  const [composePara, setComposePara] = useState('');
  const [composeAssunto, setComposeAssunto] = useState('');
  const [composeCorpo, setComposeCorpo] = useState('');

  const handleSync = () => {
    sincronizar.mutate(100, {
      onSuccess: (data) => {
        toast({ title: 'Sincronizado', description: `${data.sincronizados} novos emails de ${data.total_processados} processados.` });
      },
      onError: () => toast({ title: 'Erro', description: 'Falha ao sincronizar.', variant: 'destructive' }),
    });
  };

  const handleSend = () => {
    if (!composePara || !composeAssunto || !composeCorpo) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha destinatário, assunto e corpo.', variant: 'destructive' });
      return;
    }
    enviar.mutate({ para: composePara, assunto: composeAssunto, corpo: composeCorpo }, {
      onSuccess: () => {
        toast({ title: 'Email enviado' });
        setComposeOpen(false);
        setComposePara('');
        setComposeAssunto('');
        setComposeCorpo('');
      },
      onError: () => toast({ title: 'Erro', description: 'Falha ao enviar email.', variant: 'destructive' }),
    });
  };

  const handleToggleLido = (id: number, currentLido: boolean) => {
    marcarLido.mutate({ id, lido: !currentLido });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setOffset(0);
  };

  const totalPages = mensagens ? Math.ceil(mensagens.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  if (!status?.imap_configurado) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium">Email não configurado</h3>
            <p className="text-sm mt-2">Configure IMAP_HOST, IMAP_USER e IMAP_PASSWORD no servidor.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Email</h1>
          {naoLidos && naoLidos.nao_lidos > 0 && (
            <Badge variant="destructive">{naoLidos.nao_lidos} não lidos</Badge>
          )}
          {syncStatus?.auto_sync_ativo && (
            <span className="flex items-center gap-1.5 text-xs text-green-600" title={`Sincronização automática a cada ${syncStatus.intervalo_segundos}s`}>
              <Radio className="h-3 w-3 animate-pulse" />
              Auto-sync
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={sincronizar.isPending} title="Forçar sincronização manual">
            <RefreshCw className={`h-4 w-4 mr-2 ${sincronizar.isPending ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button size="sm" onClick={() => setComposeOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Compor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Pesquisar emails..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Select value={direcao || 'todos'} onValueChange={(v) => { setDirecao(v === 'todos' ? undefined : v); setOffset(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="recebido">Recebidos</SelectItem>
            <SelectItem value="enviado">Enviados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={lido === undefined ? 'todos' : lido ? 'lidos' : 'nao-lidos'} onValueChange={(v) => { setLido(v === 'todos' ? undefined : v === 'lidos'); setOffset(0); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="lidos">Lidos</SelectItem>
            <SelectItem value="nao-lidos">Não lidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message list */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              {pasta} ({mensagens?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">A carregar...</div>
            ) : mensagens?.items.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Sem emails</div>
            ) : (
              mensagens?.items.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedId === msg.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  } ${!msg.lido ? 'bg-gray-50 font-medium' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm truncate flex-1">{msg.direcao === 'enviado' ? msg.para : msg.de}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {!msg.lido && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      <Badge variant="outline" className="text-[10px]">{msg.direcao === 'enviado' ? 'Env' : 'Rec'}</Badge>
                    </div>
                  </div>
                  <p className="text-sm truncate mt-1">{msg.assunto}</p>
                  {msg.data && (
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(msg.data), "dd MMM HH:mm", { locale: pt })}
                    </p>
                  )}
                </div>
              ))
            )}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t">
                <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
                <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={() => setOffset(offset + limit)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message detail */}
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {selectedId && detail ? (
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{detail.assunto}</h3>
                    <p className="text-sm text-gray-600 mt-1">De: {detail.de}</p>
                    <p className="text-sm text-gray-600">Para: {detail.para}</p>
                    {detail.cc && <p className="text-sm text-gray-600">CC: {detail.cc}</p>}
                    {detail.data && (
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(detail.data), "dd 'de' MMMM yyyy 'às' HH:mm", { locale: pt })}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleLido(detail.id, detail.lido)}>
                    {detail.lido ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="border-t pt-4">
                  {detail.corpo_html ? (
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: detail.corpo_html }} />
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap font-sans">{detail.corpo_texto || '(sem conteúdo)'}</pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <div className="text-center">
                  <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Selecione um email para ver</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Compor Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Para</Label>
              <Input value={composePara} onChange={(e) => setComposePara(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Assunto</Label>
              <Input value={composeAssunto} onChange={(e) => setComposeAssunto(e.target.value)} placeholder="Assunto do email" />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={composeCorpo} onChange={(e) => setComposeCorpo(e.target.value)} rows={8} placeholder="Escreva a sua mensagem..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={enviar.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {enviar.isPending ? 'A enviar...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
