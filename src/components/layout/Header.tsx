import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, FolderOpen, CheckSquare, Users, Building, Loader2, Bug } from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ErroReportModal } from '@/components/modals/ErroReportModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import api from '@/services/api';

interface SearchResults {
  processos: { id: number; titulo: string; subtitulo?: string }[];
  tarefas: { id: number; titulo: string; subtitulo?: string }[];
  clientes: { id: number; titulo: string; subtitulo?: string }[];
  arquivos: { id: number; titulo: string; subtitulo?: string }[];
}

const DEBOUNCE_MS = 300;

export const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const term = (q || '').trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<SearchResults>('/busca', { params: { q: term, limit: 8 } });
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = results && (
    results.processos.length > 0 ||
    results.tarefas.length > 0 ||
    results.clientes.length > 0 ||
    results.arquivos.length > 0
  );
  const showDropdown = open && query.trim().length >= 2;

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    navigate(path);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center flex-1 max-w-xl" ref={containerRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Pesquisar em processos, compromissos, entidades, arquivos..."
            className="pl-10 w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="p-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A pesquisar...
                </div>
              ) : !hasResults ? (
                <div className="p-4 text-sm text-gray-500 text-center">
                  Nenhum resultado para &quot;{query.trim()}&quot;
                </div>
              ) : (
                <div className="py-2">
                  {results!.processos.length > 0 && (
                    <div className="px-3 py-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5" />
                        Processos
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {results!.processos.map((p) => (
                          <li key={`p-${p.id}`}>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 text-sm"
                              onClick={() => handleSelect(`/processos?abrir=${p.id}`)}
                            >
                              <span className="font-medium text-gray-900">{p.titulo}</span>
                              {p.subtitulo && <span className="block text-xs text-gray-500 truncate">{p.subtitulo}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results!.tarefas.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />
                        Compromissos
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {results!.tarefas.map((t) => (
                          <li key={`t-${t.id}`}>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 text-sm"
                              onClick={() => handleSelect(`/tarefas?abrir=${t.id}`)}
                            >
                              <span className="font-medium text-gray-900">{t.titulo}</span>
                              {t.subtitulo && <span className="block text-xs text-gray-500 truncate">{t.subtitulo}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results!.clientes.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Entidades
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {results!.clientes.map((c) => (
                          <li key={`c-${c.id}`}>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 text-sm"
                              onClick={() => handleSelect(`/clientes?abrir=${c.id}`)}
                            >
                              <span className="font-medium text-gray-900">{c.titulo}</span>
                              {c.subtitulo && <span className="block text-xs text-gray-500 truncate">{c.subtitulo}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results!.arquivos.length > 0 && (
                    <div className="px-3 py-1.5 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5" />
                        Arquivos
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {results!.arquivos.map((a) => (
                          <li key={`a-${a.id}`}>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100 text-sm"
                              onClick={() => handleSelect(`/dossies?abrir=${a.id}`)}
                            >
                              <span className="font-medium text-gray-900">{a.titulo}</span>
                              {a.subtitulo && <span className="block text-xs text-gray-500 truncate">{a.subtitulo}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReportModalOpen(true)}
              className="text-gray-500 hover:text-red-600"
            >
              <Bug className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reportar um erro</TooltipContent>
        </Tooltip>

        <NotificationDropdown />

        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className="flex items-center space-x-3 rounded-lg px-2 py-1 hover:bg-gray-100 transition-colors"
        >
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <Avatar>
            <AvatarFallback>
              {user?.nome?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
      <ErroReportModal open={reportModalOpen} onOpenChange={setReportModalOpen} />
    </header>
  );
};
