import React, { useState } from 'react';
import { useWorkMode } from '@/contexts/WorkModeContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, Square, X, Clock, Briefcase,
  PanelRightClose, PanelRightOpen, ChevronDown, ChevronUp,
} from 'lucide-react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function SessionCard({ sessionId }: { sessionId: number }) {
  const { sessions, getElapsed, isSessionPaused, togglePause, endSession, setNotas, removeSession } = useWorkMode();
  const session = sessions.find((s) => s.id === sessionId);
  const [expanded, setExpanded] = useState(false);
  const [ending, setEnding] = useState(false);

  if (!session) return null;

  const elapsed = getElapsed(sessionId);
  const paused = isSessionPaused(sessionId);

  const handleEnd = async () => {
    setEnding(true);
    try { await endSession(sessionId); } finally { setEnding(false); }
  };

  const handleCancel = () => {
    if (window.confirm('Cancelar esta sessão de trabalho?')) {
      removeSession(sessionId);
    }
  };

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Clock className={`h-3.5 w-3.5 ${paused ? 'text-yellow-600' : 'text-blue-600 animate-pulse'}`} />
        <span className="font-mono text-sm font-bold tabular-nums">{formatTime(elapsed)}</span>
        <span className="text-xs truncate flex-1">{session.titulo}</span>
        {paused && <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-400 text-yellow-600">P</Badge>}
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </div>

      {expanded && (
        <div className="p-3 space-y-2">
          {session.processoTitulo && (
            <p className="text-xs text-muted-foreground truncate">Processo: {session.processoTitulo}</p>
          )}
          <Textarea
            placeholder="Apontamentos..."
            value={session.notas}
            onChange={(e) => setNotas(sessionId, e.target.value)}
            className="text-sm resize-none h-20"
          />
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => togglePause(sessionId)} className="flex-1 h-7 text-xs">
              {paused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
              {paused ? 'Retomar' : 'Pausar'}
            </Button>
            <Button size="sm" onClick={handleEnd} disabled={ending} className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700">
              <Square className="h-3 w-3 mr-1" />
              {ending ? '...' : 'Terminar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const WorkModePanel: React.FC = () => {
  const { sessions, hasActiveSessions } = useWorkMode();
  const [minimized, setMinimized] = useState(false);

  if (!hasActiveSessions) return null;

  if (minimized) {
    return (
      <div
        className="h-full w-10 bg-blue-600 flex flex-col items-center py-4 gap-2 cursor-pointer shrink-0"
        onClick={() => setMinimized(false)}
        title="Expandir sessões de trabalho"
      >
        <PanelRightOpen className="h-4 w-4 text-white" />
        <Briefcase className="h-4 w-4 text-white" />
        <Badge className="bg-white text-blue-700 text-[10px] px-1 py-0">
          {sessions.length}
        </Badge>
      </div>
    );
  }

  return (
    <div className="h-full w-72 border-l border-blue-200 dark:border-blue-800 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0">
      <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-sm">Modo Trabalho</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{sessions.length}</Badge>
        </div>
        <Button size="icon" variant="ghost" onClick={() => setMinimized(true)} className="h-7 w-7">
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sessions.map((s) => (
          <SessionCard key={s.id} sessionId={s.id} />
        ))}
      </div>
    </div>
  );
};
