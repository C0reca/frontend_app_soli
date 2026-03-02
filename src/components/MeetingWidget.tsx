import React, { useState } from 'react';
import { useMeeting } from '@/contexts/MeetingContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, X, ChevronUp, ChevronDown, Clock, FileText, CheckSquare, DollarSign, MessageSquare } from 'lucide-react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const itemTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  log_processo: { label: 'Registo', icon: <MessageSquare className="h-3 w-3" /> },
  tarefa: { label: 'Tarefa', icon: <CheckSquare className="h-3 w-3" /> },
  transacao: { label: 'Transação', icon: <DollarSign className="h-3 w-3" /> },
  documento: { label: 'Documento', icon: <FileText className="h-3 w-3" /> },
};

export const MeetingWidget: React.FC = () => {
  const { meeting, isActive, isPaused, elapsedSeconds, endMeeting, cancelMeeting, togglePause, setNotas } =
    useMeeting();
  const [collapsed, setCollapsed] = useState(false);
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

  return (
    <div
      className="fixed bottom-20 right-4 z-[60] bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 rounded-xl shadow-2xl"
      style={{ width: collapsed ? 'auto' : '340px' }}
    >
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950 rounded-t-xl cursor-pointer select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock className={`h-4 w-4 shrink-0 ${isPaused ? 'text-yellow-600' : 'text-purple-600 animate-pulse'}`} />
          <span className="font-mono font-semibold text-sm tabular-nums">{formatTime(elapsedSeconds)}</span>
          {collapsed && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{meeting.titulo}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isPaused && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-400 text-yellow-600">
              Pausada
            </Badge>
          )}
          {collapsed ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded body */}
      {!collapsed && (
        <div className="p-3 space-y-3">
          {/* Título e processo */}
          <div>
            <p className="font-semibold text-sm">{meeting.titulo}</p>
            {meeting.processoTitulo && (
              <p className="text-xs text-muted-foreground truncate">Processo: {meeting.processoTitulo}</p>
            )}
          </div>

          {/* Notas */}
          <Textarea
            placeholder="Notas da reunião..."
            value={meeting.notas}
            onChange={(e) => setNotas(e.target.value)}
            className="text-xs resize-none h-20"
          />

          {/* Itens rastreados */}
          {meeting.items.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Itens criados ({meeting.items.length})
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {meeting.items.map((item, i) => {
                  const meta = itemTypeLabels[item.tipo_item] || { label: item.tipo_item, icon: null };
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                      {meta.icon}
                      <span className="text-muted-foreground">{meta.label}</span>
                      {item.label && <span className="truncate">— {item.label}</span>}
                      {!item.label && <span className="text-muted-foreground">#{item.item_id}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={togglePause} className="flex-1">
              {isPaused ? <Play className="h-3.5 w-3.5 mr-1" /> : <Pause className="h-3.5 w-3.5 mr-1" />}
              {isPaused ? 'Retomar' : 'Pausar'}
            </Button>
            <Button size="sm" variant="default" onClick={handleEnd} disabled={ending} className="flex-1 bg-purple-600 hover:bg-purple-700">
              <Square className="h-3.5 w-3.5 mr-1" />
              {ending ? 'A terminar...' : 'Terminar'}
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel} disabled={cancelling} className="h-8 w-8 text-muted-foreground hover:text-red-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
