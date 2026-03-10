import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSessoesMutations, useSessoesAtivas, type SessaoTrabalho } from '@/hooks/useSessoesTrabalho';

interface LocalSession {
  id: number;
  processoId: number | null;
  processoTitulo: string;
  titulo: string;
  startTime: number;
  pausedAt: number | null;
  accumulatedPause: number;
  notas: string;
}

interface WorkModeContextValue {
  sessions: LocalSession[];
  startSession: (processoId: number | null, processoTitulo: string, titulo: string) => Promise<void>;
  endSession: (sessionId: number) => Promise<void>;
  togglePause: (sessionId: number) => void;
  setNotas: (sessionId: number, notas: string) => void;
  removeSession: (sessionId: number) => void;
  getElapsed: (sessionId: number) => number;
  isSessionPaused: (sessionId: number) => boolean;
  hasActiveSessions: boolean;
}

const LS_KEY = 'app-soli-work-sessions';

function loadSessions(): LocalSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(sessions: LocalSession[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(sessions));
}

function calcElapsed(s: LocalSession): number {
  const now = Date.now();
  if (s.pausedAt) {
    return Math.max(0, Math.floor((s.pausedAt - s.startTime - s.accumulatedPause) / 1000));
  }
  return Math.max(0, Math.floor((now - s.startTime - s.accumulatedPause) / 1000));
}

const WorkModeContext = createContext<WorkModeContextValue | undefined>(undefined);

export const WorkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<LocalSession[]>(loadSessions);
  const [, setTick] = useState(0);
  const { iniciarSessao, terminarSessao, apagarSessao } = useSessoesMutations();

  // Persist
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // Timer tick for elapsed calculation
  useEffect(() => {
    if (sessions.length === 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [sessions.length]);

  const startSession = useCallback(async (processoId: number | null, processoTitulo: string, titulo: string) => {
    const result = await iniciarSessao.mutateAsync({
      processo_id: processoId || undefined,
      titulo,
    });
    const local: LocalSession = {
      id: result.id,
      processoId,
      processoTitulo,
      titulo: result.titulo,
      startTime: Date.now(),
      pausedAt: null,
      accumulatedPause: 0,
      notas: '',
    };
    setSessions((prev) => [...prev, local]);
  }, [iniciarSessao]);

  const endSession = useCallback(async (sessionId: number) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    const duracao = calcElapsed(session);
    await terminarSessao.mutateAsync({
      id: sessionId,
      notas_html: session.notas || undefined,
      duracao_segundos: duracao,
    });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, [sessions, terminarSessao]);

  const togglePause = useCallback((sessionId: number) => {
    setSessions((prev) => prev.map((s) => {
      if (s.id !== sessionId) return s;
      if (s.pausedAt) {
        const pauseDuration = Date.now() - s.pausedAt;
        return { ...s, pausedAt: null, accumulatedPause: s.accumulatedPause + pauseDuration };
      }
      return { ...s, pausedAt: Date.now() };
    }));
  }, []);

  const setNotas = useCallback((sessionId: number, notas: string) => {
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, notas } : s));
  }, []);

  const removeSession = useCallback((sessionId: number) => {
    apagarSessao.mutate(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  }, [apagarSessao]);

  const getElapsed = useCallback((sessionId: number) => {
    const s = sessions.find((s) => s.id === sessionId);
    return s ? calcElapsed(s) : 0;
  }, [sessions]);

  const isSessionPaused = useCallback((sessionId: number) => {
    const s = sessions.find((s) => s.id === sessionId);
    return s?.pausedAt != null;
  }, [sessions]);

  const value = useMemo(() => ({
    sessions,
    startSession,
    endSession,
    togglePause,
    setNotas,
    removeSession,
    getElapsed,
    isSessionPaused,
    hasActiveSessions: sessions.length > 0,
  }), [sessions, startSession, endSession, togglePause, setNotas, removeSession, getElapsed, isSessionPaused]);

  return <WorkModeContext.Provider value={value}>{children}</WorkModeContext.Provider>;
};

export const useWorkMode = () => {
  const ctx = useContext(WorkModeContext);
  if (!ctx) throw new Error('useWorkMode must be used inside WorkModeProvider');
  return ctx;
};
