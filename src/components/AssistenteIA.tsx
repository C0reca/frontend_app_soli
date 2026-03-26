import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, Loader2, Sparkles, Plus, MessageSquare,
  Trash2, Edit, Check, X, ChevronLeft, MoreHorizontal,
  CheckSquare, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useIAChat, useIASugestoes, useIAStatus,
  useConversasIA, useConversaIA, useConversaIAMutations,
  useCriarTarefasIA,
  type MensagemChat, type ConversaIA, type TarefaSugerida, type SugestoesResult,
} from '@/hooks/useAssistenteIA';
import { useToast } from '@/hooks/use-toast';

interface Props {
  processoId?: number;
  clienteId?: number;
}

// Normalize tarefas_sugeridas (pode ser string[] ou TarefaSugerida[])
function normalizeTarefas(raw?: (string | TarefaSugerida)[]): TarefaSugerida[] {
  if (!raw?.length) return [];
  return raw.map(t => {
    if (typeof t === 'string') return { titulo: t, prioridade: 'media' as const };
    return { titulo: t.titulo, descricao: t.descricao, prioridade: t.prioridade || 'media' };
  });
}

// Extended message with optional structured suggestions
interface LocalMessage extends MensagemChat {
  sugestoes?: SugestoesResult;
}

const prioridadeLabel: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const prioridadeColor: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-700',
  media: 'bg-yellow-100 text-yellow-800',
  alta: 'bg-red-100 text-red-800',
};

export const AssistenteIA: React.FC<Props> = ({ processoId, clienteId }) => {
  const [conversaAtiva, setConversaAtiva] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [createdTaskIds, setCreatedTaskIds] = useState<Set<string>>(new Set());
  // Flag: true quando o user seleciona uma conversa da sidebar (deve carregar msgs da BD)
  const pendingLoadRef = useRef(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: status } = useIAStatus();
  const { data: conversas = [] } = useConversasIA(processoId, clienteId);
  const { data: conversaDetail } = useConversaIA(conversaAtiva);
  const { criar, renomear, apagar } = useConversaIAMutations();
  const chatMutation = useIAChat();
  const sugestoesMutation = useIASugestoes();
  const criarTarefasMutation = useCriarTarefasIA();

  // Só carrega mensagens da BD quando o user clica numa conversa na sidebar
  useEffect(() => {
    if (pendingLoadRef.current && conversaDetail?.mensagens) {
      setLocalMessages(conversaDetail.mensagens);
      pendingLoadRef.current = false;
    }
  }, [conversaDetail]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages, chatMutation.isPending]);

  useEffect(() => {
    setMensagem('');
    if (!conversaAtiva) setLocalMessages([]);
  }, [conversaAtiva]);

  // ── Helper: ensure active conversation ──

  const ensureConversation = useCallback(async (title?: string): Promise<number | null> => {
    if (conversaAtiva) return conversaAtiva;
    try {
      const nova = await criar.mutateAsync({
        titulo: title || 'Nova conversa',
        processo_id: processoId,
        cliente_id: clienteId,
      });
      setConversaAtiva(nova.id);
      setShowSidebar(false);
      return nova.id;
    } catch {
      return null;
    }
  }, [conversaAtiva, criar, processoId, clienteId]);

  // ── Handlers ──

  const handleNewConversation = useCallback(async () => {
    try {
      const nova = await criar.mutateAsync({
        titulo: 'Nova conversa',
        processo_id: processoId,
        cliente_id: clienteId,
      });
      setConversaAtiva(nova.id);
      setShowSidebar(false);
    } catch { /* ignore */ }
  }, [criar, processoId, clienteId]);

  const handleSend = useCallback(async () => {
    if (!mensagem.trim() || chatMutation.isPending) return;
    const activeId = await ensureConversation();
    if (!activeId) return;

    const userMsg: LocalMessage = { role: 'user', content: mensagem.trim() };
    setLocalMessages(prev => [...prev, userMsg]);
    setMensagem('');

    try {
      const result = await chatMutation.mutateAsync({
        mensagem: userMsg.content,
        processo_id: processoId,
        cliente_id: clienteId,
        conversa_id: activeId,
      });
      setLocalMessages(prev => [...prev, { role: 'assistant', content: result.resposta }]);
    } catch (err: any) {
      setLocalMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Erro: ${err?.response?.data?.detail || 'Falha na comunicação'}` },
      ]);
    }
  }, [mensagem, chatMutation, ensureConversation, processoId, clienteId]);

  const handleSugestoes = useCallback(async () => {
    if (!processoId || sugestoesMutation.isPending) return;
    const activeId = await ensureConversation('Sugestões IA');
    if (!activeId) return;

    try {
      const result = await sugestoesMutation.mutateAsync(processoId);
      const parts: string[] = [];
      if (result.proximos_passos?.length) parts.push('**Próximos passos:**\n' + result.proximos_passos.map((p: string) => `- ${p}`).join('\n'));
      if (result.documentos_em_falta?.length) parts.push('**Documentos em falta:**\n' + result.documentos_em_falta.map((d: string) => `- ${d}`).join('\n'));

      const tarefas = normalizeTarefas(result.tarefas_sugeridas);
      if (tarefas.length) {
        parts.push('**Tarefas sugeridas:**\n' + tarefas.map(t => `- ${t.titulo}${t.descricao ? ` — ${t.descricao}` : ''} (${prioridadeLabel[t.prioridade || 'media'] || 'Média'})`).join('\n'));
      }

      if (result.alertas?.length) parts.push('**Alertas:**\n' + result.alertas.map((a: string) => `- ${a}`).join('\n'));
      if (result.estimativa_conclusao) parts.push(`**Estimativa:** ${result.estimativa_conclusao}`);
      const text = parts.length > 0 ? parts.join('\n\n') : (result.resposta_texto || 'Sem sugestões disponíveis.');

      setLocalMessages(prev => [
        ...prev,
        { role: 'user', content: '(Pedido de sugestões automáticas)' },
        { role: 'assistant', content: text, sugestoes: tarefas.length > 0 ? { ...result, tarefas_sugeridas: tarefas } : undefined },
      ]);
    } catch (err: any) {
      setLocalMessages(prev => [...prev, { role: 'assistant', content: `Erro: ${err?.response?.data?.detail || 'Falha'}` }]);
    }
  }, [processoId, sugestoesMutation, ensureConversation]);

  const handleCreateTask = useCallback(async (tarefa: TarefaSugerida) => {
    if (!processoId) return;
    const key = `${tarefa.titulo}`;
    try {
      const result = await criarTarefasMutation.mutateAsync({
        processo_id: processoId,
        cliente_id: clienteId,
        tarefas: [tarefa],
      });
      setCreatedTaskIds(prev => new Set(prev).add(key));
      toast({
        title: 'Tarefa criada',
        description: `"${result.criadas[0]?.titulo}" foi adicionada aos compromissos.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.response?.data?.detail || 'Não foi possível criar a tarefa.',
        variant: 'destructive',
      });
    }
  }, [processoId, clienteId, criarTarefasMutation, toast]);

  const handleCreateAllTasks = useCallback(async (tarefas: TarefaSugerida[]) => {
    if (!processoId) return;
    const pending = tarefas.filter(t => !createdTaskIds.has(t.titulo));
    if (!pending.length) return;
    try {
      const result = await criarTarefasMutation.mutateAsync({
        processo_id: processoId,
        cliente_id: clienteId,
        tarefas: pending,
      });
      setCreatedTaskIds(prev => {
        const next = new Set(prev);
        pending.forEach(t => next.add(t.titulo));
        return next;
      });
      toast({
        title: 'Tarefas criadas',
        description: `${result.total} tarefa(s) adicionada(s) aos compromissos.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err?.response?.data?.detail || 'Não foi possível criar as tarefas.',
        variant: 'destructive',
      });
    }
  }, [processoId, clienteId, criarTarefasMutation, createdTaskIds, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleDeleteConversa = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await apagar.mutateAsync(id);
    if (conversaAtiva === id) {
      setConversaAtiva(null);
      setLocalMessages([]);
    }
  }, [apagar, conversaAtiva]);

  const startRename = useCallback((c: ConversaIA, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.titulo);
  }, []);

  const confirmRename = useCallback(async () => {
    if (editingId && editTitle.trim()) {
      await renomear.mutateAsync({ id: editingId, titulo: editTitle.trim() });
    }
    setEditingId(null);
  }, [editingId, editTitle, renomear]);

  if (!status?.habilitada) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm text-center gap-2">
        <Bot className="h-8 w-8 opacity-50" />
        <p>Assistente IA não configurado.</p>
        <p className="text-xs">Configure ANTHROPIC_API_KEY ou OPENAI_API_KEY no servidor.</p>
      </div>
    );
  }

  // ── Task action buttons for a message with suggestions ──

  const renderTaskActions = (msg: LocalMessage) => {
    const tarefas = normalizeTarefas(msg.sugestoes?.tarefas_sugeridas);
    if (!tarefas.length || !processoId) return null;

    const allCreated = tarefas.every(t => createdTaskIds.has(t.titulo));
    const pendingCount = tarefas.filter(t => !createdTaskIds.has(t.titulo)).length;

    return (
      <div className="mt-2 space-y-1.5">
        <div className="border-t border-border/50 pt-2">
          {tarefas.map((t, idx) => {
            const isCreated = createdTaskIds.has(t.titulo);
            return (
              <div key={idx} className="flex items-center gap-1.5 py-1">
                <Button
                  size="sm"
                  variant={isCreated ? 'ghost' : 'outline'}
                  disabled={isCreated || criarTarefasMutation.isPending}
                  onClick={() => handleCreateTask(t)}
                  className={`h-7 text-xs gap-1.5 flex-shrink-0 ${isCreated ? 'text-green-600' : ''}`}
                >
                  {isCreated ? (
                    <><CheckCircle2 className="h-3 w-3" /> Criada</>
                  ) : (
                    <><CheckSquare className="h-3 w-3" /> Criar</>
                  )}
                </Button>
                <span className="text-xs truncate flex-1">{t.titulo}</span>
                <Badge className={`text-[10px] px-1.5 py-0 ${prioridadeColor[t.prioridade || 'media'] || ''}`}>
                  {prioridadeLabel[t.prioridade || 'media'] || 'Média'}
                </Badge>
              </div>
            );
          })}
        </div>
        {tarefas.length > 1 && !allCreated && (
          <Button
            size="sm"
            variant="default"
            disabled={criarTarefasMutation.isPending}
            onClick={() => handleCreateAllTasks(tarefas)}
            className="w-full h-7 text-xs gap-1.5"
          >
            {criarTarefasMutation.isPending ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> A criar...</>
            ) : (
              <><CheckSquare className="h-3 w-3" /> Criar todas ({pendingCount})</>
            )}
          </Button>
        )}
      </div>
    );
  };

  // ── Conversation sidebar ──────────────────────────────────────────

  const renderSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Conversas</span>
        <Button size="sm" variant="ghost" onClick={handleNewConversation} disabled={criar.isPending} className="h-7 w-7 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {conversas.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-6 px-3 space-y-2">
            <MessageSquare className="h-6 w-6 mx-auto opacity-50" />
            <p>Nenhuma conversa ainda.</p>
            <Button size="sm" variant="outline" onClick={handleNewConversation} disabled={criar.isPending} className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Nova conversa
            </Button>
          </div>
        ) : (
          <div className="py-1">
            {conversas.map(c => (
              <div
                key={c.id}
                onClick={() => { pendingLoadRef.current = true; setConversaAtiva(c.id); setShowSidebar(false); }}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors text-sm ${
                  conversaAtiva === c.id ? 'bg-accent' : ''
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                {editingId === c.id ? (
                  <div className="flex-1 flex items-center gap-1 min-w-0">
                    <Input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingId(null); }}
                      className="h-6 text-xs"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                    <Button size="icon" variant="ghost" className="h-5 w-5 flex-shrink-0" onClick={(e) => { e.stopPropagation(); confirmRename(); }}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 truncate">{c.titulo}</span>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-5 w-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={(e) => startRename(c, e as any)}>
                          <Edit className="h-3 w-3 mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDeleteConversa(c.id, e as any)} className="text-red-600">
                          <Trash2 className="h-3 w-3 mr-2" />
                          Apagar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Chat area ─────────────────────────────────────────────────────

  const renderChat = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => setShowSidebar(true)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Bot className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium truncate">
            {conversaDetail?.titulo || 'Assistente IA'}
          </span>
          <Badge variant="outline" className="text-xs flex-shrink-0">{status.provider}</Badge>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {processoId && (
            <Button size="sm" variant="ghost" onClick={handleSugestoes} disabled={sugestoesMutation.isPending} className="text-xs gap-1 h-7">
              <Sparkles className="h-3 w-3" />
              Sugestões
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleNewConversation} disabled={criar.isPending} className="h-7 w-7 p-0" title="Nova conversa">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {localMessages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-8 space-y-3">
            <Bot className="h-8 w-8 mx-auto opacity-50" />
            <p>Faça uma pergunta sobre este {processoId ? 'processo' : 'cliente'}.</p>
            <div className="flex flex-wrap gap-1.5 justify-center px-2">
              {['Quais são os próximos passos?', 'Que documentos faltam?', 'Resuma este processo'].map(q => (
                <button
                  key={q}
                  onClick={() => setMensagem(q)}
                  className="text-xs px-2.5 py-1.5 rounded-md border hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {localMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-muted'
            }`}>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              {msg.role === 'assistant' && msg.sugestoes && renderTaskActions(msg)}
            </div>
          </div>
        ))}
        {(chatMutation.isPending || sugestoesMutation.isPending) && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-2 flex-shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem..."
            rows={1}
            className="resize-none text-sm min-h-[36px]"
          />
          <Button size="icon" onClick={handleSend} disabled={!mensagem.trim() || chatMutation.isPending} className="flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0">
      {showSidebar ? renderSidebar() : renderChat()}
    </div>
  );
};
