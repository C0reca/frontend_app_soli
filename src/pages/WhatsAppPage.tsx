import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useWhatsAppStatus,
  useWhatsAppConversas,
  useWhatsAppConversa,
  useWhatsAppMensagens,
  useWhatsAppNaoLidas,
  useWhatsAppMutations,
  type WhatsAppMensagem,
} from '@/hooks/useWhatsApp';
import {
  MessageSquare, Send, Phone, AlertCircle, CheckCheck, Check, Clock, XCircle,
  Search, ArrowLeft, User, Plus, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const estadoIcon = (estado: string) => {
  switch (estado) {
    case 'pendente': return <Clock className="h-3 w-3 text-gray-400 inline" />;
    case 'enviada': return <Check className="h-3 w-3 text-gray-400 inline" />;
    case 'entregue': return <CheckCheck className="h-3 w-3 text-gray-400 inline" />;
    case 'lida': return <CheckCheck className="h-3 w-3 text-blue-500 inline" />;
    case 'falhou': return <XCircle className="h-3 w-3 text-red-500 inline" />;
    default: return null;
  }
};

type ViewMode = 'conversas' | 'todas' | 'enviadas' | 'recebidas';

export const WhatsAppPage: React.FC = () => {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTelefone, setSelectedTelefone] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('conversas');

  // New message dialog
  const [newTelefone, setNewTelefone] = useState('');
  const [newMensagem, setNewMensagem] = useState('');

  // History view pagination
  const [historyOffset, setHistoryOffset] = useState(0);
  const historyLimit = 50;
  const [historyDirecao, setHistoryDirecao] = useState<string | undefined>();

  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: status } = useWhatsAppStatus();
  const { data: conversas, isLoading: loadingConversas } = useWhatsAppConversas(search || undefined);
  const { data: conversa, isLoading: loadingConversa } = useWhatsAppConversa(selectedTelefone || undefined);
  const { data: naoLidas } = useWhatsAppNaoLidas();
  const { data: allMsgs, isLoading: loadingAll } = useWhatsAppMensagens(
    undefined, undefined, historyLimit
  );
  const { enviarTexto } = useWhatsAppMutations();

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    if (conversa?.items) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [conversa?.items?.length, selectedTelefone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleSendNew = () => {
    if (!newTelefone || !newMensagem) {
      toast({ title: 'Preencha telefone e mensagem', variant: 'destructive' });
      return;
    }
    const tel = newTelefone.replace(/[\s+]/g, '');
    enviarTexto.mutate({ telefone: tel, mensagem: newMensagem }, {
      onSuccess: () => {
        toast({ title: 'Mensagem enviada' });
        setSendOpen(false);
        setNewTelefone('');
        setNewMensagem('');
        setSelectedTelefone(tel);
        setViewMode('conversas');
      },
      onError: () => toast({ title: 'Erro ao enviar', variant: 'destructive' }),
    });
  };

  const handleReply = () => {
    if (!replyMsg.trim() || !selectedTelefone) return;
    enviarTexto.mutate({ telefone: selectedTelefone, mensagem: replyMsg }, {
      onSuccess: () => {
        setReplyMsg('');
      },
      onError: () => toast({ title: 'Erro ao enviar', variant: 'destructive' }),
    });
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };

  if (!status?.configurado) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium">WhatsApp não configurado</h3>
            <p className="text-sm mt-2">Configure WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no servidor.</p>
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
          <MessageSquare className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">WhatsApp</h1>
          {naoLidas && naoLidas.nao_lidas > 0 && (
            <Badge variant="destructive">{naoLidas.nao_lidas} recebidas</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); setSelectedTelefone(null); setHistoryOffset(0); }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversas">Conversas</SelectItem>
              <SelectItem value="todas">Todas Mensagens</SelectItem>
              <SelectItem value="enviadas">Enviadas</SelectItem>
              <SelectItem value="recebidas">Recebidas</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setSendOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      {viewMode === 'conversas' ? (
        /* ===== CONVERSATION VIEW ===== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Conversations list */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="py-3 px-4 shrink-0">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Pesquisar número..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="text-sm"
                />
                <Button type="submit" variant="outline" size="icon" className="shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {loadingConversas ? (
                <div className="p-4 text-center text-gray-500 text-sm">A carregar...</div>
              ) : !conversas?.items.length ? (
                <div className="p-4 text-center text-gray-500 text-sm">Sem conversas</div>
              ) : (
                conversas.items.map((conv) => (
                  <div
                    key={conv.telefone}
                    onClick={() => setSelectedTelefone(conv.telefone)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTelefone === conv.telefone ? 'bg-green-50 border-l-2 border-l-green-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-green-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {conv.cliente_nome || conv.telefone}
                          </span>
                          {conv.ultima_msg_em && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {format(new Date(conv.ultima_msg_em), "dd/MM HH:mm")}
                            </span>
                          )}
                        </div>
                        {conv.cliente_nome && (
                          <p className="text-[11px] text-gray-400">{conv.telefone}</p>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
                          {conv.ultima_msg_direcao === 'enviada' && (
                            <CheckCheck className="h-3 w-3 text-gray-400 shrink-0" />
                          )}
                          <p className="text-xs text-gray-500 truncate">{conv.ultima_msg_conteudo || '...'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className="text-[9px]">{conv.total_msgs}</Badge>
                        {conv.recebidas > 0 && (
                          <Badge variant="default" className="text-[9px] bg-green-600">{conv.recebidas}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Chat view */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedTelefone ? (
              <>
                {/* Chat header */}
                <CardHeader className="py-3 px-4 border-b shrink-0">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSelectedTelefone(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {conversas?.items.find(c => c.telefone === selectedTelefone)?.cliente_nome || selectedTelefone}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedTelefone}
                      </p>
                    </div>
                    {conversa && (
                      <Badge variant="outline" className="ml-auto text-xs">{conversa.total} mensagens</Badge>
                    )}
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                  {loadingConversa ? (
                    <div className="text-center text-gray-500 text-sm py-8">A carregar...</div>
                  ) : (
                    <>
                      {conversa?.items.map((msg) => (
                        <ChatBubble key={msg.id} msg={msg} />
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </CardContent>

                {/* Reply input */}
                <div className="p-3 border-t bg-white shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={replyMsg}
                      onChange={(e) => setReplyMsg(e.target.value)}
                      onKeyDown={handleReplyKeyDown}
                      placeholder="Escrever mensagem..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleReply}
                      disabled={!replyMsg.trim() || enviarTexto.isPending}
                      className="bg-green-600 hover:bg-green-700 shrink-0"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Selecione uma conversa</p>
                  <p className="text-sm mt-1">ou inicie uma nova mensagem</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      ) : (
        /* ===== HISTORY VIEW (todas / enviadas / recebidas) ===== */
        <HistoryView
          viewMode={viewMode}
          allMsgs={allMsgs}
          isLoading={loadingAll}
          offset={historyOffset}
          limit={historyLimit}
          onOffsetChange={setHistoryOffset}
          onOpenConversation={(tel) => { setSelectedTelefone(tel); setViewMode('conversas'); }}
        />
      )}

      {/* New message dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Mensagem WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Telefone (com código país)</Label>
              <Input value={newTelefone} onChange={(e) => setNewTelefone(e.target.value)} placeholder="351912345678" />
              <p className="text-xs text-gray-400 mt-1">Ex: 351912345678 (sem + ou espaços)</p>
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea value={newMensagem} onChange={(e) => setNewMensagem(e.target.value)} rows={4} placeholder="Escreva a mensagem..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendNew} disabled={enviarTexto.isPending} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              {enviarTexto.isPending ? 'A enviar...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ===== Chat Bubble Component ===== */
const ChatBubble: React.FC<{ msg: WhatsAppMensagem }> = ({ msg }) => {
  const isEnviada = msg.direcao === 'enviada';

  return (
    <div className={`flex ${isEnviada ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
        isEnviada
          ? 'bg-green-100 text-green-900 rounded-br-none'
          : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
      }`}>
        {msg.tipo === 'template' && (
          <p className="text-[10px] text-gray-500 italic mb-1">Template: {msg.template_nome}</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{msg.conteudo || `[${msg.tipo}]`}</p>
        <div className={`flex items-center gap-1 mt-1 ${isEnviada ? 'justify-end' : 'justify-start'}`}>
          {msg.criado_em && (
            <span className="text-[10px] text-gray-400">
              {format(new Date(msg.criado_em), "HH:mm")}
            </span>
          )}
          {isEnviada && estadoIcon(msg.estado)}
        </div>
        {msg.estado === 'falhou' && msg.erro_detalhe && (
          <p className="text-[10px] text-red-500 mt-1">{msg.erro_detalhe}</p>
        )}
      </div>
    </div>
  );
};

/* ===== History View Component ===== */
const HistoryView: React.FC<{
  viewMode: ViewMode;
  allMsgs?: { total: number; items: WhatsAppMensagem[] };
  isLoading: boolean;
  offset: number;
  limit: number;
  onOffsetChange: (offset: number) => void;
  onOpenConversation: (telefone: string) => void;
}> = ({ viewMode, allMsgs, isLoading, offset, limit, onOffsetChange, onOpenConversation }) => {
  const filteredItems = allMsgs?.items.filter((msg) => {
    if (viewMode === 'enviadas') return msg.direcao === 'enviada';
    if (viewMode === 'recebidas') return msg.direcao === 'recebida';
    return true;
  }) || [];

  const title = viewMode === 'enviadas' ? 'Mensagens Enviadas' : viewMode === 'recebidas' ? 'Mensagens Recebidas' : 'Todas as Mensagens';

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">{title} ({allMsgs?.total || 0})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">A carregar...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Sem mensagens</div>
        ) : (
          <div className="divide-y">
            {filteredItems.map((msg) => (
              <div
                key={msg.id}
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => onOpenConversation(msg.telefone_destino)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.direcao === 'recebida' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {msg.direcao === 'recebida'
                        ? <Phone className="h-3.5 w-3.5 text-blue-600" />
                        : <Send className="h-3.5 w-3.5 text-green-600" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{msg.telefone_destino}</span>
                        <Badge variant={msg.direcao === 'enviada' ? 'secondary' : 'default'} className="text-[10px]">
                          {msg.direcao === 'enviada' ? 'Enviada' : 'Recebida'}
                        </Badge>
                        {msg.direcao === 'enviada' && estadoIcon(msg.estado)}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{msg.conteudo || `[${msg.tipo}]`}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {msg.criado_em && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(msg.criado_em), "dd/MM/yy HH:mm", { locale: pt })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
