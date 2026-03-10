import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, AlertTriangle, FileText, CheckSquare, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useIAChat, useIASugestoes, useIAStatus, type MensagemChat } from '@/hooks/useAssistenteIA';

interface Props {
  processoId?: number;
  clienteId?: number;
}

export const AssistenteIA: React.FC<Props> = ({ processoId, clienteId }) => {
  const [mensagem, setMensagem] = useState('');
  const [historico, setHistorico] = useState<MensagemChat[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data: status } = useIAStatus();
  const chatMutation = useIAChat();
  const sugestoesMutation = useIASugestoes();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [historico]);

  if (!status?.habilitada) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm text-center gap-2">
        <Bot className="h-8 w-8 opacity-50" />
        <p>Assistente IA não configurado.</p>
        <p className="text-xs">Configure ANTHROPIC_API_KEY ou OPENAI_API_KEY no servidor.</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!mensagem.trim() || chatMutation.isPending) return;

    const userMsg: MensagemChat = { role: 'user', content: mensagem.trim() };
    const newHistorico = [...historico, userMsg];
    setHistorico(newHistorico);
    setMensagem('');

    try {
      const result = await chatMutation.mutateAsync({
        mensagem: userMsg.content,
        processo_id: processoId,
        cliente_id: clienteId,
        historico: historico,
      });
      setHistorico(prev => [...prev, { role: 'assistant', content: result.resposta }]);
    } catch (err: any) {
      setHistorico(prev => [...prev, { role: 'assistant', content: `Erro: ${err?.response?.data?.detail || 'Falha na comunicação'}` }]);
    }
  };

  const handleSugestoes = async () => {
    if (!processoId || sugestoesMutation.isPending) return;
    try {
      const result = await sugestoesMutation.mutateAsync(processoId);
      const parts: string[] = [];
      if (result.proximos_passos?.length) parts.push('**Próximos passos:**\n' + result.proximos_passos.map(p => `- ${p}`).join('\n'));
      if (result.documentos_em_falta?.length) parts.push('**Documentos em falta:**\n' + result.documentos_em_falta.map(d => `- ${d}`).join('\n'));
      if (result.tarefas_sugeridas?.length) parts.push('**Tarefas sugeridas:**\n' + result.tarefas_sugeridas.map(t => `- ${t}`).join('\n'));
      if (result.alertas?.length) parts.push('**Alertas:**\n' + result.alertas.map(a => `- ${a}`).join('\n'));
      if (result.estimativa_conclusao) parts.push(`**Estimativa:** ${result.estimativa_conclusao}`);
      const text = parts.length > 0 ? parts.join('\n\n') : (result.resposta_texto || 'Sem sugestões disponíveis.');
      setHistorico(prev => [
        ...prev,
        { role: 'user', content: '(Pedido de sugestões automáticas)' },
        { role: 'assistant', content: text },
      ]);
    } catch (err: any) {
      setHistorico(prev => [...prev, { role: 'assistant', content: `Erro: ${err?.response?.data?.detail || 'Falha'}` }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Assistente IA</span>
          <Badge variant="outline" className="text-xs">{status.provider}</Badge>
        </div>
        {processoId && (
          <Button size="sm" variant="ghost" onClick={handleSugestoes} disabled={sugestoesMutation.isPending} className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            Sugestões
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {historico.length === 0 && (
          <div className="text-center text-muted-foreground text-xs py-4 space-y-2">
            <Bot className="h-6 w-6 mx-auto opacity-50" />
            <p>Faça uma pergunta sobre este {processoId ? 'processo' : 'cliente'}.</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {['Quais são os próximos passos?', 'Que documentos faltam?', 'Resuma este processo'].map(q => (
                <button
                  key={q}
                  onClick={() => { setMensagem(q); }}
                  className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {historico.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-muted'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-2">
        <div className="flex gap-2">
          <Textarea
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva uma mensagem..."
            rows={1}
            className="resize-none text-sm min-h-[36px]"
          />
          <Button size="icon" onClick={handleSend} disabled={!mensagem.trim() || chatMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
