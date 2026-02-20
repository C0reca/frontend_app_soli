import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useUserPermissions, useUpdatePermissions, PermissaoModuloItem, useUserProcessRestrictions, useUpdateProcessRestrictions, useDeleteProcessRestrictions } from '@/hooks/usePermissoes';
import { Process } from '@/hooks/useProcesses';
import { Client } from '@/hooks/useClients';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Search, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MODULOS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'clientes', label: 'Entidades' },
  { id: 'processos', label: 'Processos' },
  { id: 'tarefas', label: 'Compromissos' },
  { id: 'irs', label: 'IRS' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'caixa', label: 'Caixa' },
  { id: 'templates_docs', label: 'Templates Docs' },
  { id: 'registos_prediais', label: 'Registos Prediais' },
  { id: 'dossies', label: 'Arquivos' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'servicos_externos', label: 'Serviços Externos' },
];

type RestrictionTab = 'processos' | 'tipos' | 'entidades';

export const UserPermissionsManager: React.FC = () => {
  const { employees, isLoading: loadingEmps } = useEmployees();
  const [selectedFuncId, setSelectedFuncId] = useState<number | null>(null);
  const { data: userPerms, isLoading: loadingPerms } = useUserPermissions(selectedFuncId);
  const updatePerms = useUpdatePermissions();
  const { toast } = useToast();

  // Process restrictions
  const { data: restrictions, isLoading: loadingRestrictions } = useUserProcessRestrictions(selectedFuncId);
  const updateRestrictions = useUpdateProcessRestrictions();
  const deleteRestrictions = useDeleteProcessRestrictions();

  // Local state for module permissions
  const [perms, setPerms] = useState<Record<string, { pode_ver: boolean; pode_criar: boolean; pode_editar: boolean }>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Lazy-load processes & clients only when restrictions section is needed
  const [restrictActive, setRestrictActive] = useState(false);
  const [selectedProcessIds, setSelectedProcessIds] = useState<Set<number>>(new Set());
  const [selectedTipos, setSelectedTipos] = useState<Set<string>>(new Set());
  const [selectedEntidadeIds, setSelectedEntidadeIds] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<RestrictionTab>('tipos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRestrDirty, setIsRestrDirty] = useState(false);

  // Only fetch processes & clients when a user is selected (lazy load)
  const { data: processes = [] } = useQuery<Process[]>({
    queryKey: ['processes'],
    queryFn: async () => (await api.get('/processos')).data,
    enabled: !!selectedFuncId,
    staleTime: 5 * 60 * 1000,
  });
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clientes');
      const data = response?.data;
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    },
    enabled: !!selectedFuncId,
    staleTime: 5 * 60 * 1000,
  });

  // Filter to show funcionarios and managers (not admin — admin always has full access)
  const funcionarios = (employees as Employee[])?.filter(
    (e) => (e.role === 'funcionario' || e.role === 'manager') && e.is_active
  ) || [];

  // Sync local state from API (module permissions)
  useEffect(() => {
    const map: Record<string, { pode_ver: boolean; pode_criar: boolean; pode_editar: boolean }> = {};
    for (const m of MODULOS) {
      map[m.id] = { pode_ver: true, pode_criar: true, pode_editar: true };
    }
    if (userPerms?.permissoes) {
      for (const p of userPerms.permissoes) {
        map[p.modulo] = { pode_ver: p.pode_ver, pode_criar: p.pode_criar, pode_editar: p.pode_editar };
      }
    }
    setPerms(map);
    setIsDirty(false);
  }, [userPerms]);

  // Sync local state from API (process restrictions)
  useEffect(() => {
    if (restrictions) {
      const hasAny =
        (restrictions.processo_ids?.length || 0) > 0 ||
        (restrictions.tipo_processos?.length || 0) > 0 ||
        (restrictions.entidade_ids?.length || 0) > 0;
      setRestrictActive(hasAny);
      setSelectedProcessIds(new Set(restrictions.processo_ids || []));
      setSelectedTipos(new Set(restrictions.tipo_processos || []));
      setSelectedEntidadeIds(new Set(restrictions.entidade_ids || []));
    } else {
      setRestrictActive(false);
      setSelectedProcessIds(new Set());
      setSelectedTipos(new Set());
      setSelectedEntidadeIds(new Set());
    }
    setIsRestrDirty(false);
  }, [restrictions]);

  // Unique process types from actual data
  const uniqueTipos = useMemo(() => {
    if (!processes?.length) return [];
    const tipos = new Set<string>();
    for (const p of processes) {
      if (p.tipo) tipos.add(p.tipo);
    }
    return Array.from(tipos).sort();
  }, [processes]);

  // Group processes by client for display
  const groupedProcesses = useMemo(() => {
    if (!processes?.length) return [];
    const groups: Record<string, { label: string; processes: Process[] }> = {};
    for (const p of processes) {
      const clientName = p.dossie?.entidade?.nome || p.cliente?.nome || 'Sem entidade';
      if (!groups[clientName]) {
        groups[clientName] = { label: clientName, processes: [] };
      }
      groups[clientName].processes.push(p);
    }
    return Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
  }, [processes]);

  // Sorted clients
  const sortedClients = useMemo(() => {
    if (!clients?.length) return [];
    return [...clients].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
  }, [clients]);

  // Filter by search
  const filteredGroupedProcesses = useMemo(() => {
    if (!searchTerm.trim()) return groupedProcesses;
    const term = searchTerm.toLowerCase();
    return groupedProcesses
      .map((g) => ({
        ...g,
        processes: g.processes.filter(
          (p) =>
            p.titulo.toLowerCase().includes(term) ||
            g.label.toLowerCase().includes(term) ||
            p.referencia?.toLowerCase().includes(term)
        ),
      }))
      .filter((g) => g.processes.length > 0);
  }, [groupedProcesses, searchTerm]);

  const filteredTipos = useMemo(() => {
    if (!searchTerm.trim()) return uniqueTipos;
    const term = searchTerm.toLowerCase();
    return uniqueTipos.filter((t) => t.toLowerCase().includes(term));
  }, [uniqueTipos, searchTerm]);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return sortedClients;
    const term = searchTerm.toLowerCase();
    return sortedClients.filter(
      (c) =>
        (c.nome || '').toLowerCase().includes(term) ||
        (c as any).nome_empresa?.toLowerCase().includes(term) ||
        (c as any).nif?.toLowerCase().includes(term)
    );
  }, [sortedClients, searchTerm]);

  // Count for each tipo
  const tipoCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of processes || []) {
      if (p.tipo) counts[p.tipo] = (counts[p.tipo] || 0) + 1;
    }
    return counts;
  }, [processes]);

  // Count processes per client
  const entidadeProcessCount = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const p of processes || []) {
      const cid = p.cliente_id || (p.cliente as any)?.id;
      if (cid) counts[cid] = (counts[cid] || 0) + 1;
    }
    return counts;
  }, [processes]);

  const togglePerm = (modulo: string, campo: 'pode_ver' | 'pode_criar' | 'pode_editar') => {
    setPerms((prev) => ({
      ...prev,
      [modulo]: { ...prev[modulo], [campo]: !prev[modulo]?.[campo] },
    }));
    setIsDirty(true);
  };

  const selectAll = () => {
    const map: Record<string, { pode_ver: boolean; pode_criar: boolean; pode_editar: boolean }> = {};
    for (const m of MODULOS) {
      map[m.id] = { pode_ver: true, pode_criar: true, pode_editar: true };
    }
    setPerms(map);
    setIsDirty(true);
  };

  const removeAll = () => {
    const map: Record<string, { pode_ver: boolean; pode_criar: boolean; pode_editar: boolean }> = {};
    for (const m of MODULOS) {
      map[m.id] = { pode_ver: false, pode_criar: false, pode_editar: false };
    }
    setPerms(map);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!selectedFuncId) return;
    const permissoes: PermissaoModuloItem[] = MODULOS.map((m) => ({
      modulo: m.id,
      ...perms[m.id],
    }));
    try {
      await updatePerms.mutateAsync({ funcionarioId: selectedFuncId, permissoes });
      setIsDirty(false);
      toast({ title: 'Permissões de módulos guardadas' });
    } catch {
      toast({ title: 'Erro ao guardar permissões', variant: 'destructive' });
    }
  };

  const handleToggleRestrict = (checked: boolean) => {
    setRestrictActive(checked);
    if (!checked) {
      setSelectedProcessIds(new Set());
      setSelectedTipos(new Set());
      setSelectedEntidadeIds(new Set());
    }
    setIsRestrDirty(true);
  };

  const toggleProcessId = (id: number) => {
    setSelectedProcessIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setIsRestrDirty(true);
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos((prev) => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo); else next.add(tipo);
      return next;
    });
    setIsRestrDirty(true);
  };

  const toggleEntidade = (id: number) => {
    setSelectedEntidadeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setIsRestrDirty(true);
  };

  const handleSaveRestrictions = async () => {
    if (!selectedFuncId) return;
    try {
      if (restrictActive && (selectedProcessIds.size > 0 || selectedTipos.size > 0 || selectedEntidadeIds.size > 0)) {
        await updateRestrictions.mutateAsync({
          funcionarioId: selectedFuncId,
          processoIds: Array.from(selectedProcessIds),
          tipoProcessos: Array.from(selectedTipos),
          entidadeIds: Array.from(selectedEntidadeIds),
        });
      } else {
        await deleteRestrictions.mutateAsync(selectedFuncId);
      }
      setIsRestrDirty(false);
      toast({ title: 'Restrição de processos guardada' });
    } catch {
      toast({ title: 'Erro ao guardar restrição', variant: 'destructive' });
    }
  };

  const totalRestrictions = selectedProcessIds.size + selectedTipos.size + selectedEntidadeIds.size;
  const isSaving = updateRestrictions.isPending || deleteRestrictions.isPending;

  return (
    <div className="space-y-6">
      {/* Employee selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Utilizador:</label>
        <Select
          value={selectedFuncId?.toString() || ''}
          onValueChange={(v) => setSelectedFuncId(Number(v))}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder={loadingEmps ? 'A carregar...' : 'Selecionar utilizador'} />
          </SelectTrigger>
          <SelectContent>
            {funcionarios.map((f) => (
              <SelectItem key={f.id} value={f.id.toString()}>
                {f.nome}{f.role === 'manager' ? ' (Gerente)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFuncId && (
        <>
          {(loadingPerms || loadingRestrictions) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* ── Module Permissions ── */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Selecionar tudo
                </Button>
                <Button variant="outline" size="sm" onClick={removeAll}>
                  Remover tudo
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Módulo</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-700 w-24">Ver</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-700 w-24">Criar</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-700 w-24">Editar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULOS.map((m) => (
                      <tr key={m.id} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{m.label}</td>
                        <td className="text-center px-4 py-3">
                          <Checkbox
                            checked={perms[m.id]?.pode_ver ?? true}
                            onCheckedChange={() => togglePerm(m.id, 'pode_ver')}
                          />
                        </td>
                        <td className="text-center px-4 py-3">
                          <Checkbox
                            checked={perms[m.id]?.pode_criar ?? true}
                            onCheckedChange={() => togglePerm(m.id, 'pode_criar')}
                          />
                        </td>
                        <td className="text-center px-4 py-3">
                          <Checkbox
                            checked={perms[m.id]?.pode_editar ?? true}
                            onCheckedChange={() => togglePerm(m.id, 'pode_editar')}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={!isDirty || updatePerms.isPending}>
                  {updatePerms.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Módulos
                </Button>
              </div>

              {/* ── Process Restrictions ── */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="h-5 w-5 text-gray-500" />
                  <h3 className="text-base font-semibold">Restrição de Processos</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Quando activo, o funcionário só vê os processos que correspondem às regras seleccionadas.
                  Os compromissos, dashboard, documentos e financeiro são automaticamente filtrados.
                  As regras são combinadas (união).
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <Switch
                    checked={restrictActive}
                    onCheckedChange={handleToggleRestrict}
                  />
                  <span className="text-sm font-medium">
                    {restrictActive
                      ? `Restringido (${totalRestrictions} regra${totalRestrictions !== 1 ? 's' : ''})`
                      : 'Sem restrição (vê tudo)'}
                  </span>
                </div>

                {restrictActive && (
                  <>
                    {/* Tabs */}
                    <div className="flex border-b mb-4">
                      {([
                        { key: 'tipos' as RestrictionTab, label: 'Por Tipo', count: selectedTipos.size },
                        { key: 'entidades' as RestrictionTab, label: 'Por Entidade', count: selectedEntidadeIds.size },
                        { key: 'processos' as RestrictionTab, label: 'Por Processo', count: selectedProcessIds.size },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                              {tab.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative mb-3 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={
                          activeTab === 'tipos' ? 'Pesquisar tipos...' :
                          activeTab === 'entidades' ? 'Pesquisar entidades...' :
                          'Pesquisar processos...'
                        }
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    {/* Tab: Tipos */}
                    {activeTab === 'tipos' && (
                      <div className="border rounded-lg max-h-72 overflow-y-auto">
                        {filteredTipos.length === 0 ? (
                          <div className="text-gray-400 text-sm text-center py-8">Nenhum tipo encontrado</div>
                        ) : (
                          filteredTipos.map((tipo) => (
                            <label
                              key={tipo}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <Checkbox
                                checked={selectedTipos.has(tipo)}
                                onCheckedChange={() => toggleTipo(tipo)}
                              />
                              <span className="text-sm flex-1">{tipo}</span>
                              <span className="text-xs text-gray-400">
                                {tipoCount[tipo] || 0} processo{(tipoCount[tipo] || 0) !== 1 ? 's' : ''}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    )}

                    {/* Tab: Entidades */}
                    {activeTab === 'entidades' && (
                      <div className="border rounded-lg max-h-72 overflow-y-auto">
                        {filteredClients.length === 0 ? (
                          <div className="text-gray-400 text-sm text-center py-8">Nenhuma entidade encontrada</div>
                        ) : (
                          filteredClients.map((c) => {
                            const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id;
                            const procCount = entidadeProcessCount[cId] || 0;
                            return (
                              <label
                                key={c.id}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              >
                                <Checkbox
                                  checked={selectedEntidadeIds.has(cId)}
                                  onCheckedChange={() => toggleEntidade(cId)}
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm">{c.nome}</span>
                                  {(c as any).nome_empresa && (
                                    <span className="text-xs text-gray-400 ml-2">({(c as any).nome_empresa})</span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">
                                  {procCount} proc.
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Tab: Processos */}
                    {activeTab === 'processos' && (
                      <div className="border rounded-lg max-h-72 overflow-y-auto">
                        {filteredGroupedProcesses.length === 0 ? (
                          <div className="text-gray-400 text-sm text-center py-8">Nenhum processo encontrado</div>
                        ) : (
                          filteredGroupedProcesses.map((group) => (
                            <div key={group.label}>
                              <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b sticky top-0">
                                {group.label}
                              </div>
                              {group.processes.map((p) => (
                                <label
                                  key={p.id}
                                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                >
                                  <Checkbox
                                    checked={selectedProcessIds.has(p.id)}
                                    onCheckedChange={() => toggleProcessId(p.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm">{p.titulo}</span>
                                    {p.referencia && (
                                      <span className="text-xs text-gray-400 ml-2">#{p.referencia}</span>
                                    )}
                                  </div>
                                  {p.tipo && <span className="text-xs text-gray-400">{p.tipo}</span>}
                                </label>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Summary of selections */}
                    {totalRestrictions > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                        {selectedTipos.size > 0 && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            {selectedTipos.size} tipo{selectedTipos.size !== 1 ? 's' : ''}
                          </span>
                        )}
                        {selectedEntidadeIds.size > 0 && (
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded">
                            {selectedEntidadeIds.size} entidade{selectedEntidadeIds.size !== 1 ? 's' : ''}
                          </span>
                        )}
                        {selectedProcessIds.size > 0 && (
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            {selectedProcessIds.size} processo{selectedProcessIds.size !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleSaveRestrictions}
                    disabled={!isRestrDirty || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar Restrição
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!selectedFuncId && (
        <div className="text-gray-500 text-center py-12">
          Selecione um utilizador para configurar as permissões
        </div>
      )}
    </div>
  );
};
