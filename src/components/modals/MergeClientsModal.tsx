import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check, Star } from 'lucide-react';
import { Client, getEffectiveTipo, useDuplicateClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

interface MergeClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  nif: string;
}

// Campos multi-select (contactos): pode manter vários
const MULTI_SELECT_FIELDS = new Set(['email', 'telefone']);

// Campos normais (single select)
const DISPLAY_FIELDS: { key: string; label: string }[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'nome_empresa', label: 'Nome Empresa' },
  { key: 'nif', label: 'NIF (Singular)' },
  { key: 'nif_empresa', label: 'NIF (Empresa)' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'email', label: 'Email' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'morada', label: 'Morada' },
  { key: 'codigo_postal', label: 'Cód. Postal' },
  { key: 'localidade', label: 'Localidade' },
  { key: 'distrito', label: 'Distrito' },
  { key: 'pais', label: 'País' },
  { key: 'data_nascimento', label: 'Data Nascimento' },
  { key: 'estado_civil', label: 'Estado Civil' },
  { key: 'profissao', label: 'Profissão' },
  { key: 'num_cc', label: 'Nº CC' },
  { key: 'validade_cc', label: 'Validade CC' },
  { key: 'num_ss', label: 'Nº Seg. Social' },
  { key: 'num_sns', label: 'Nº SNS' },
  { key: 'nacionalidade', label: 'Nacionalidade' },
  { key: 'forma_juridica', label: 'Forma Jurídica' },
  { key: 'registo_comercial', label: 'Registo Comercial' },
  { key: 'cae', label: 'CAE' },
  { key: 'capital_social', label: 'Capital Social' },
  { key: 'iban', label: 'IBAN' },
  { key: 'certidao_permanente', label: 'Certidão Permanente' },
  { key: 'senha_financas', label: 'Senha Finanças' },
  { key: 'senha_ss', label: 'Senha Seg. Social' },
];

function getFieldValue(client: Client, key: string): string {
  const val = (client as any)[key];
  if (val === null || val === undefined || val === '') return '';
  return String(val);
}

function getClientLabel(client: Client): string {
  const tipo = getEffectiveTipo(client);
  const name = tipo === 'coletivo' ? (client as any).nome_empresa : (client as any).nome;
  return `${name || 'Sem nome'} (ID: ${client.id})`;
}

export const MergeClientsModal: React.FC<MergeClientsModalProps> = ({
  isOpen,
  onClose,
  clients,
  nif,
}) => {
  const { mergeClients } = useDuplicateClients();
  const { toast } = useToast();

  const [manterId, setManterId] = useState<number | string>(clients[0]?.id);

  // Single-select fields: which client index per field
  const [fieldChoices, setFieldChoices] = useState<Record<string, number>>({});

  // Multi-select fields: which client indices are selected, and which is primary
  // { email: { selected: Set<number>, primary: number } }
  const [multiChoices, setMultiChoices] = useState<Record<string, { selected: Set<number>; primary: number }>>({});

  const relevantFields = useMemo(() => {
    return DISPLAY_FIELDS.filter(({ key }) => {
      return clients.some(c => getFieldValue(c, key) !== '');
    });
  }, [clients]);

  const getDefaultChoice = (key: string): number => {
    const withValue = clients
      .map((c, i) => ({ i, val: getFieldValue(c, key), date: new Date((c as any).criado_em || 0).getTime() }))
      .filter(x => x.val !== '');
    if (withValue.length === 0) return 0;
    if (withValue.length === 1) return withValue[0].i;
    withValue.sort((a, b) => b.date - a.date);
    return withValue[0].i;
  };

  const getChoice = (key: string): number => {
    return fieldChoices[key] ?? getDefaultChoice(key);
  };

  // For multi-select fields, get the current state (default: all unique values selected, most recent as primary)
  const getMultiState = (key: string): { selected: Set<number>; primary: number } => {
    if (multiChoices[key]) return multiChoices[key];
    // Default: select all that have a unique non-empty value
    const seen = new Set<string>();
    const selected = new Set<number>();
    let primary = 0;
    let latestDate = 0;
    clients.forEach((c, i) => {
      const val = getFieldValue(c, key);
      if (val && !seen.has(val)) {
        seen.add(val);
        selected.add(i);
        const date = new Date((c as any).criado_em || 0).getTime();
        if (date > latestDate) {
          latestDate = date;
          primary = i;
        }
      }
    });
    return { selected, primary };
  };

  const toggleMultiSelect = (key: string, idx: number) => {
    const current = getMultiState(key);
    const newSelected = new Set(current.selected);
    const val = getFieldValue(clients[idx], key);
    if (!val) return;

    if (newSelected.has(idx)) {
      // Can't deselect the primary — must have at least one
      if (newSelected.size > 1) {
        newSelected.delete(idx);
        let newPrimary = current.primary;
        if (current.primary === idx) {
          newPrimary = [...newSelected][0];
        }
        setMultiChoices(prev => ({ ...prev, [key]: { selected: newSelected, primary: newPrimary } }));
      }
    } else {
      newSelected.add(idx);
      setMultiChoices(prev => ({ ...prev, [key]: { selected: newSelected, primary: current.primary } }));
    }
  };

  const setMultiPrimary = (key: string, idx: number) => {
    const current = getMultiState(key);
    const newSelected = new Set(current.selected);
    newSelected.add(idx); // ensure selected
    setMultiChoices(prev => ({ ...prev, [key]: { selected: newSelected, primary: idx } }));
  };

  // Observações: juntar todas
  const mergedObservacoes = useMemo(() => {
    const parts = clients
      .map(c => getFieldValue(c, 'observacoes'))
      .filter(v => v !== '');
    const unique = [...new Set(parts)];
    return unique.join('\n---\n');
  }, [clients]);

  const handleMerge = async () => {
    const removerIds = clients.filter(c => c.id !== manterId).map(c => Number(c.id));

    const dados_finais: Record<string, any> = {};
    const contactos_extra: { tipo: string; valor: string }[] = [];

    for (const { key } of relevantFields) {
      if (MULTI_SELECT_FIELDS.has(key)) {
        const state = getMultiState(key);
        // Primary value goes into the main field
        const primaryVal = getFieldValue(clients[state.primary], key);
        if (primaryVal) {
          dados_finais[key] = primaryVal;
        }
        // Extra selected values become additional contactos
        state.selected.forEach(idx => {
          if (idx !== state.primary) {
            const val = getFieldValue(clients[idx], key);
            if (val) {
              contactos_extra.push({
                tipo: key === 'email' ? 'email' : 'telefone',
                valor: val,
              });
            }
          }
        });
      } else {
        const choiceIdx = getChoice(key);
        const val = (clients[choiceIdx] as any)[key];
        if (val !== null && val !== undefined && val !== '') {
          dados_finais[key] = val;
        }
      }
    }

    // Observações: sempre juntar
    dados_finais['observacoes'] = mergedObservacoes;

    try {
      await mergeClients.mutateAsync({
        manter_id: Number(manterId),
        remover_ids: removerIds,
        dados_finais,
        contactos_extra,
      });
      toast({
        title: 'Entidades fundidas',
        description: `Entidades fundidas com sucesso. ${removerIds.length} entidade(s) desativada(s).`,
      });
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Erro ao fundir entidades.';
      toast({
        title: 'Erro',
        description: typeof msg === 'string' ? msg : JSON.stringify(msg),
        variant: 'destructive',
      });
    }
  };

  if (clients.length < 2) return null;

  const allSame = (key: string) => {
    const vals = clients.map(c => getFieldValue(c, key)).filter(v => v !== '');
    return new Set(vals).size <= 1;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fundir {clients.length} Entidades</DialogTitle>
          <DialogDescription>
            Escolha qual valor manter para cada campo. Para contactos (email/telefone), pode selecionar vários. As observações serão concatenadas.
          </DialogDescription>
        </DialogHeader>

        {/* Selector: qual entidade manter */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Entidade a manter (principal):</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(clients.length, 3)}, 1fr)` }}>
            {clients.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setManterId(c.id)}
                className={`rounded-lg border-2 p-3 text-left text-sm transition-colors ${
                  manterId === c.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-xs truncate">{getClientLabel(c)}</span>
                  {manterId === c.id && <Badge variant="default" className="text-[10px] shrink-0">Principal</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Criado: {(c as any).criado_em ? new Date((c as any).criado_em).toLocaleDateString('pt-PT') : 'N/A'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Comparação campo a campo */}
        <div className="space-y-0.5 mt-4 overflow-x-auto">
          {/* Header */}
          <div className="flex gap-1 text-xs font-medium text-muted-foreground px-1 pb-1 border-b min-w-0">
            <span className="w-28 shrink-0">Campo</span>
            {clients.map((c) => (
              <span key={c.id} className="flex-1 min-w-[120px] truncate">
                ID: {c.id}
              </span>
            ))}
          </div>

          {/* Rows */}
          {relevantFields.map(({ key, label }) => {
            const values = clients.map(c => getFieldValue(c, key));
            const isMulti = MULTI_SELECT_FIELDS.has(key);
            const isSame = allSame(key);

            if (isMulti) {
              // Multi-select row for contacts
              const state = getMultiState(key);
              const hasAnyValue = values.some(v => v !== '');

              // If no values at all, show plain row
              if (!hasAnyValue) {
                return (
                  <div key={key} className="flex gap-1 items-center px-1 py-1 rounded hover:bg-muted/50 text-sm min-w-0">
                    <span className="w-28 shrink-0 text-muted-foreground text-xs">{label}</span>
                    {clients.map((c) => (
                      <div key={c.id} className="flex-1 min-w-[120px] px-2 py-1 text-xs truncate text-muted-foreground">
                        —
                      </div>
                    ))}
                  </div>
                );
              }

              // Always show checkboxes for contact fields (even if only one unique value)
              return (
                <div key={key} className="flex gap-1 items-center px-1 py-1.5 rounded hover:bg-muted/50 text-sm min-w-0 bg-blue-50/30">
                  <span className="w-28 shrink-0 text-muted-foreground text-xs">
                    {label}
                    <span className="block text-[10px] text-blue-600">multi-select</span>
                  </span>
                  {clients.map((c, idx) => {
                    const val = values[idx];
                    if (!val) {
                      return (
                        <div key={c.id} className="flex-1 min-w-[120px] px-2 py-1 text-xs italic text-muted-foreground">
                          —
                        </div>
                      );
                    }
                    const isSelected = state.selected.has(idx);
                    const isPrimary = state.primary === idx;
                    return (
                      <div key={c.id} className="flex-1 min-w-[120px] flex items-center gap-1.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMultiSelect(key, idx)}
                          className="h-3.5 w-3.5"
                        />
                        <button
                          type="button"
                          onClick={() => setMultiPrimary(key, idx)}
                          className={`flex-1 text-left px-1.5 py-1 rounded border text-xs truncate ${
                            isPrimary
                              ? 'border-blue-400 bg-blue-50 font-medium'
                              : isSelected
                                ? 'border-green-300 bg-green-50'
                                : 'border-transparent opacity-50'
                          }`}
                          title={`${val}${isPrimary ? ' (principal)' : isSelected ? ' (manter)' : ''}`}
                        >
                          {isPrimary && <Star className="inline mr-0.5 h-3 w-3 text-blue-600 fill-blue-600" />}
                          {val}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Single-select row
            const choice = getChoice(key);
            return (
              <div key={key} className="flex gap-1 items-center px-1 py-1 rounded hover:bg-muted/50 text-sm min-w-0">
                <span className="w-28 shrink-0 text-muted-foreground text-xs">{label}</span>
                {clients.map((c, idx) => {
                  const val = values[idx];
                  const isChosen = choice === idx;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => !isSame && setFieldChoices(prev => ({ ...prev, [key]: idx }))}
                      disabled={isSame}
                      className={`flex-1 min-w-[120px] text-left px-2 py-1 rounded border text-xs truncate ${
                        isChosen
                          ? 'border-blue-400 bg-blue-50 font-medium'
                          : 'border-transparent hover:border-gray-200'
                      } ${!val ? 'text-muted-foreground italic' : ''}`}
                      title={val || '—'}
                    >
                      {val || '—'}
                      {isChosen && !isSame && <Check className="inline ml-1 h-3 w-3 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Observações — sempre concatenadas */}
          {mergedObservacoes && (
            <div className="px-1 py-2 mt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1">Observações (concatenadas de todas as entidades):</p>
              <div className="rounded border bg-muted/30 p-2 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                {mergedObservacoes}
              </div>
            </div>
          )}
        </div>

        <Alert className="mt-4">
          <AlertDescription>
            As {clients.length - 1} entidade(s) não selecionadas serão desativadas (não eliminadas).
            Todos os processos, dossiês, contactos e transações serão transferidos para a entidade principal.
            {' '}Contactos selecionados com <Star className="inline h-3 w-3 text-blue-600 fill-blue-600" /> ficam como principal; os restantes são guardados como contactos adicionais.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleMerge}
            disabled={mergeClients.isPending}
          >
            {mergeClients.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fundir {clients.length} Entidades
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
