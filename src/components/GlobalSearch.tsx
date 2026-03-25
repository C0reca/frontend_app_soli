import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, CheckSquare, Users, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import api from '@/services/api';

interface SearchResult {
  id: number;
  titulo: string;
  subtitulo?: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [processos, setProcessos] = useState<SearchResult[]>([]);
  const [clientes, setClientes] = useState<SearchResult[]>([]);
  const [tarefas, setTarefas] = useState<SearchResult[]>([]);

  const search = useCallback(async (term: string) => {
    const q = term.trim();
    if (q.length < 2) {
      setProcessos([]);
      setClientes([]);
      setTarefas([]);
      return;
    }
    setLoading(true);
    try {
      const [pRes, cRes, tRes] = await Promise.all([
        api.get('/processos', { params: { search: q, limit: 5 } }).catch(() => ({ data: { items: [] } })),
        api.get('/clientes/search', { params: { q, limit: 5 } }).catch(() => ({ data: [] })),
        api.get('/tarefas', { params: { search: q, limit: 5 } }).catch(() => ({ data: { items: [] } })),
      ]);

      // Processos - pode vir como { items: [...] } ou [...]
      const pItems = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.items || []);
      setProcessos(pItems.slice(0, 5).map((p: any) => ({
        id: p.id,
        titulo: p.titulo || p.nome || `Processo #${p.id}`,
        subtitulo: p.cliente_nome || p.descricao || undefined,
      })));

      // Clientes
      const cItems = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.items || []);
      setClientes(cItems.slice(0, 5).map((c: any) => ({
        id: c.id,
        titulo: c.nome || c.nome_empresa || `Entidade #${c.id}`,
        subtitulo: c.nif || c.nif_empresa || c.designacao || undefined,
      })));

      // Tarefas
      const tItems = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.items || []);
      setTarefas(tItems.slice(0, 5).map((t: any) => ({
        id: t.id,
        titulo: t.titulo || t.descricao || `Tarefa #${t.id}`,
        subtitulo: t.processo_titulo || t.estado || undefined,
      })));
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setProcessos([]);
      setClientes([]);
      setTarefas([]);
    }
  }, [open]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults = processos.length > 0 || clientes.length > 0 || tarefas.length > 0;
  const showEmpty = query.trim().length >= 2 && !loading && !hasResults;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Pesquisar processos, entidades, tarefas..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            A pesquisar...
          </div>
        )}

        {showEmpty && (
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        )}

        {!loading && processos.length > 0 && (
          <CommandGroup heading="Processos">
            {processos.map((p) => (
              <CommandItem
                key={`p-${p.id}`}
                value={`processo-${p.id}-${p.titulo}`}
                onSelect={() => handleSelect(`/processos?abrir=${p.id}`)}
              >
                <FolderOpen className="mr-2 h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{p.titulo}</span>
                  {p.subtitulo && (
                    <span className="text-xs text-muted-foreground">{p.subtitulo}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && processos.length > 0 && clientes.length > 0 && <CommandSeparator />}

        {!loading && clientes.length > 0 && (
          <CommandGroup heading="Entidades">
            {clientes.map((c) => (
              <CommandItem
                key={`c-${c.id}`}
                value={`entidade-${c.id}-${c.titulo}`}
                onSelect={() => handleSelect(`/clientes?abrir=${c.id}`)}
              >
                <Users className="mr-2 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{c.titulo}</span>
                  {c.subtitulo && (
                    <span className="text-xs text-muted-foreground">{c.subtitulo}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && (processos.length > 0 || clientes.length > 0) && tarefas.length > 0 && <CommandSeparator />}

        {!loading && tarefas.length > 0 && (
          <CommandGroup heading="Tarefas">
            {tarefas.map((t) => (
              <CommandItem
                key={`t-${t.id}`}
                value={`tarefa-${t.id}-${t.titulo}`}
                onSelect={() => handleSelect(`/tarefas?abrir=${t.id}`)}
              >
                <CheckSquare className="mr-2 h-4 w-4 text-orange-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t.titulo}</span>
                  {t.subtitulo && (
                    <span className="text-xs text-muted-foreground">{t.subtitulo}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && !hasResults && query.trim().length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Escreva pelo menos 2 caracteres para pesquisar...
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
};
