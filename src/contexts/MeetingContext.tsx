import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useReuniao, Reuniao } from '@/hooks/useReuniao';

interface TrackedItem {
  tipo_item: string;
  item_id: number;
  label?: string;
}

interface MeetingState {
  id: number;
  processoId: number | null;
  processoTitulo: string;
  titulo: string;
  startTime: number; // epoch ms
  pausedAt: number | null; // epoch ms when paused, null if running
  accumulatedPause: number; // total ms spent paused
  items: TrackedItem[];
  notas: string;
}

interface MeetingContextValue {
  meeting: MeetingState | null;
  isActive: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  startMeeting: (processoId: number | null, processoTitulo: string, titulo: string) => Promise<void>;
  endMeeting: () => Promise<void>;
  cancelMeeting: () => Promise<void>;
  trackItem: (tipo: string, id: number, label?: string) => void;
  togglePause: () => void;
  setNotas: (notas: string) => void;
}

const MeetingContext = createContext<MeetingContextValue | undefined>(undefined);

const LS_KEY = 'app-soli-meeting';

function loadFromStorage(): MeetingState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(state: MeetingState | null) {
  if (state) {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(LS_KEY);
  }
}

export const MeetingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meeting, setMeeting] = useState<MeetingState | null>(loadFromStorage);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const { iniciarReuniao, terminarReuniao, cancelarReuniao, ativa, isLoadingAtiva } = useReuniao();
  const hasRestoredRef = useRef(false);

  // Restore from backend on mount if localStorage is empty
  useEffect(() => {
    if (hasRestoredRef.current || isLoadingAtiva) return;
    hasRestoredRef.current = true;

    if (!meeting && ativa) {
      const restored: MeetingState = {
        id: ativa.id,
        processoId: ativa.processo_id,
        processoTitulo: '',
        titulo: ativa.titulo,
        startTime: new Date(ativa.inicio).getTime(),
        pausedAt: null,
        accumulatedPause: 0,
        items: (ativa.itens || []).map((i) => ({ tipo_item: i.tipo_item, item_id: i.item_id })),
        notas: ativa.notas || '',
      };
      setMeeting(restored);
      saveToStorage(restored);
    }
  }, [isLoadingAtiva, ativa]);

  // Persist to localStorage on change
  useEffect(() => {
    saveToStorage(meeting);
  }, [meeting]);

  // Timer tick
  useEffect(() => {
    if (!meeting) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      if (meeting.pausedAt) {
        const active = meeting.pausedAt - meeting.startTime - meeting.accumulatedPause;
        setElapsedSeconds(Math.floor(active / 1000));
      } else {
        const active = now - meeting.startTime - meeting.accumulatedPause;
        setElapsedSeconds(Math.floor(active / 1000));
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [meeting?.startTime, meeting?.pausedAt, meeting?.accumulatedPause, meeting !== null]);

  // beforeunload warning
  useEffect(() => {
    if (!meeting) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [meeting !== null]);

  const startMeeting = useCallback(
    async (processoId: number | null, processoTitulo: string, titulo: string) => {
      const result = await iniciarReuniao.mutateAsync({
        processo_id: processoId || undefined,
        titulo,
      });
      const state: MeetingState = {
        id: result.id,
        processoId: result.processo_id,
        processoTitulo,
        titulo: result.titulo,
        startTime: new Date(result.inicio).getTime(),
        pausedAt: null,
        accumulatedPause: 0,
        items: [],
        notas: '',
      };
      setMeeting(state);
    },
    [iniciarReuniao],
  );

  const endMeeting = useCallback(async () => {
    if (!meeting) return;
    await terminarReuniao.mutateAsync({
      id: meeting.id,
      data: {
        notas: meeting.notas || undefined,
        duracao_segundos: elapsedSeconds,
        itens: meeting.items.map((i) => ({ tipo_item: i.tipo_item, item_id: i.item_id })),
      },
    });
    setMeeting(null);
  }, [meeting, elapsedSeconds, terminarReuniao]);

  const cancelMeeting = useCallback(async () => {
    if (!meeting) return;
    await cancelarReuniao.mutateAsync(meeting.id);
    setMeeting(null);
  }, [meeting, cancelarReuniao]);

  const trackItem = useCallback(
    (tipo: string, id: number, label?: string) => {
      if (!meeting) return;
      setMeeting((prev) => {
        if (!prev) return prev;
        if (prev.items.some((i) => i.tipo_item === tipo && i.item_id === id)) return prev;
        return { ...prev, items: [...prev.items, { tipo_item: tipo, item_id: id, label }] };
      });
    },
    [meeting !== null],
  );

  const togglePause = useCallback(() => {
    setMeeting((prev) => {
      if (!prev) return prev;
      if (prev.pausedAt) {
        // Resume: add pause duration to accumulated
        const pauseDuration = Date.now() - prev.pausedAt;
        return { ...prev, pausedAt: null, accumulatedPause: prev.accumulatedPause + pauseDuration };
      } else {
        // Pause
        return { ...prev, pausedAt: Date.now() };
      }
    });
  }, []);

  const setNotas = useCallback((notas: string) => {
    setMeeting((prev) => (prev ? { ...prev, notas } : prev));
  }, []);

  const value = useMemo(
    () => ({
      meeting,
      isActive: meeting !== null,
      isPaused: meeting?.pausedAt !== null && meeting?.pausedAt !== undefined,
      elapsedSeconds,
      startMeeting,
      endMeeting,
      cancelMeeting,
      trackItem,
      togglePause,
      setNotas,
    }),
    [meeting, elapsedSeconds, startMeeting, endMeeting, cancelMeeting, trackItem, togglePause, setNotas],
  );

  return <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>;
};

const noopMeeting: MeetingContextValue = {
  meeting: null,
  isActive: false,
  isPaused: false,
  elapsedSeconds: 0,
  startMeeting: async () => {},
  endMeeting: async () => {},
  cancelMeeting: async () => {},
  trackItem: () => {},
  togglePause: () => {},
  setNotas: () => {},
};

export const useMeeting = () => {
  const ctx = useContext(MeetingContext);
  return ctx ?? noopMeeting;
};
