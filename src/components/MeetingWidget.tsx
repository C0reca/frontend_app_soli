import React, { useState } from 'react';
import { useMeeting, TrackedItem } from '@/contexts/MeetingContext';
import { useMarketingResumoCliente } from '@/hooks/useMarketing';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, Square, X, Clock, FileText, CheckSquare, DollarSign,
  MessageSquare, PanelRightClose, PanelRightOpen, RefreshCw, Edit, Trash2, ArrowRightLeft,
  ShieldCheck, TrendingUp,
} from 'lucide-react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const itemTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  log_processo: { label: 'Registo', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  tarefa: { label: 'Tarefa', icon: <CheckSquare className="h-3.5 w-3.5" /> },
  transacao: { label: 'Transação', icon: <DollarSign className="h-3.5 w-3.5" /> },
  documento: { label: 'Documento', icon: <FileText className="h-3.5 w-3.5" /> },
};

const acaoConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  criado: { label: 'Criado', color: 'bg-green-100 text-green-700' },
  atualizado: { label: 'Atualizado', color: 'bg-blue-100 text-blue-700', icon: <Edit className="h-3 w-3" /> },
  status_alterado: { label: 'Status alterado', color: 'bg-yellow-100 text-yellow-700', icon: <RefreshCw className="h-3 w-3" /> },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: <CheckSquare className="h-3 w-3" /> },
  reaberta: { label: 'Reaberta', color: 'bg-orange-100 text-orange-700', icon: <RefreshCw className="h-3 w-3" /> },
  eliminado: { label: 'Eliminado', color: 'bg-red-100 text-red-700', icon: <Trash2 className="h-3 w-3" /> },
  externo_alterado: { label: 'Diligência ext.', color: 'bg-purple-100 text-purple-700', icon: <ArrowRightLeft className="h-3 w-3" /> },
};

function ItemRow({ item }: { item: TrackedItem }) {
  const typeCfg = itemTypeConfig[item.tipo_item] || { label: item.tipo_item, icon: null };
  const acaoCfg = acaoConfig[item.acao] || { label: item.acao, color: 'bg-gray-100 text-gray-600' };
  const time = new Date(item.timestamp);
  const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50">
      <span className="text-muted-foreground shrink-0">{timeStr}</span>
      <span className="shrink-0">{typeCfg.icon}</span>
      <span className="truncate flex-1">
        {item.label || `${typeCfg.label} #${item.item_id}`}
      </span>
      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 shrink-0 ${acaoCfg.color}`}>
        {acaoCfg.icon && <span className="mr-0.5 inline-flex">{acaoCfg.icon}</span>}
        {acaoCfg.label}
      </Badge>
    </div>
  );
}

function MarketingAlert({ clienteId }: { clienteId: number | null }) {
  const { data } = useMarketingResumoCliente(clienteId);
  if (!clienteId) return null;

  if (!data || !data.abordado) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5">
        <p className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Falar sobre seguros/créditos com este cliente
        </p>
      </div>
    );
  }

  const ultima = data.interacoes[0];
  const dataStr = ultima?.data_interacao
    ? new Date(ultima.data_interacao).toLocaleDateString('pt-PT')
    : '';

  if (ultima?.estado === 'interessado') {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-2.5">
        <p className="text-xs font-medium text-green-800 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Cliente interessado em {ultima.tipo_servico}
          {ultima.email_enviado_em && ' — email enviado'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-2.5">
      <p className="text-xs text-blue-800">
        Já falou sobre {ultima?.tipo_servico || 'serviços'} em {dataStr}
        {ultima?.estado === 'nao_interessado' && ' (não interessado)'}
      </p>
    </div>
  );
}

export const MeetingWidget: React.FC = () => {
  const { meeting, isActive, isPaused, elapsedSeconds, endMeeting, cancelMeeting, togglePause, setNotas } =
    useMeeting();
  const [minimized, setMinimized] = useState(false);
  const [ending, setEnding] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (!isActive || !meeting) return null;

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endMeeting();
    } finally {
      setEnding(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Tem a certeza que quer cancelar esta reunião? Os dados serão perdidos.')) return;
    setCancelling(true);
    try {
      await cancelMeeting();
    } finally {
      setCancelling(false);
    }
  };

  // Minimized: narrow vertical strip
  if (minimized) {
    return (
      <div
        className="h-full w-10 bg-purple-600 flex flex-col items-center py-4 gap-2 cursor-pointer shrink-0"
        onClick={() => setMinimized(false)}
        title="Expandir reunião"
      >
        <PanelRightOpen className="h-4 w-4 text-white" />
        <Clock className={`h-4 w-4 text-white ${isPaused ? 'opacity-50' : 'animate-pulse'}`} />
        <span
          className="font-mono text-[11px] font-semibold text-white"
          style={{ writingMode: 'vertical-rl' }}
        >
          {formatTime(elapsedSeconds)}
        </span>
        {meeting.items.length > 0 && (
          <Badge className="bg-white text-purple-700 text-[10px] px-1 py-0">
            {meeting.items.length}
          </Badge>
        )}
      </div>
    );
  }

  // Expanded sidebar (participates in flex layout, pushes content)
  return (
    <div className="h-full w-80 border-l border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 flex flex-col shrink-0">
      {/* Header */}
      <div className="bg-purple-50 dark:bg-purple-950 border-b border-purple-200 dark:border-purple-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${isPaused ? 'text-yellow-600' : 'text-purple-600 animate-pulse'}`} />
            <span className="font-mono font-bold text-lg tabular-nums">{formatTime(elapsedSeconds)}</span>
            {isPaused && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-400 text-yellow-600">
                Pausada
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMinimized(true)}
            className="h-7 w-7 text-muted-foreground hover:text-purple-700"
            title="Minimizar"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
        <p className="font-semibold text-sm truncate">{meeting.titulo}</p>
        {meeting.processoTitulo && (
          <p className="text-xs text-muted-foreground truncate">Processo: {meeting.processoTitulo}</p>
        )}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Marketing Alert */}
        <MarketingAlert clienteId={meeting.clienteId} />

        {/* Notas */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Notas</label>
          <Textarea
            placeholder="Notas da reunião..."
            value={meeting.notas}
            onChange={(e) => setNotas(e.target.value)}
            className="text-sm resize-none h-28"
          />
        </div>

        {/* Atividade rastreada */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Atividade durante a reunião ({meeting.items.length})
          </label>
          {meeting.items.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              Nenhuma atividade registada ainda. Crie tarefas, registos ou transações e serão rastreados aqui.
            </p>
          ) : (
            <div className="space-y-1">
              {[...meeting.items].reverse().map((item, i) => (
                <ItemRow key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-purple-200 dark:border-purple-800 p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={togglePause} className="flex-1">
            {isPaused ? <Play className="h-3.5 w-3.5 mr-1.5" /> : <Pause className="h-3.5 w-3.5 mr-1.5" />}
            {isPaused ? 'Retomar' : 'Pausar'}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleEnd}
            disabled={ending}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Square className="h-3.5 w-3.5 mr-1.5" />
            {ending ? 'A terminar...' : 'Terminar'}
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          {cancelling ? 'A cancelar...' : 'Cancelar Reunião'}
        </Button>
      </div>
    </div>
  );
};
