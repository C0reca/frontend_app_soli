import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  User, Type, AlignLeft, Flag, UserCheck, UserCog, DollarSign, MapPin,
  Lock, Unlock, Layers, Puzzle, Calendar, Hash, List, FileText,
} from 'lucide-react';
import type { WizardConfig, WizardStepConfig, WizardFieldConfig, CustomFieldDef } from '@/hooks/useTiposProcesso';

// ── Field definitions ────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  isCustom?: boolean;
  customType?: string;
}

const BUILTIN_FIELD_DEFS: FieldDef[] = [
  { key: 'cliente_id', label: 'Entidade', icon: User, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  { key: 'titulo', label: 'Titulo', icon: Type, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  { key: 'descricao', label: 'Descricao', icon: AlignLeft, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  { key: 'estado', label: 'Estado', icon: Flag, color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
  { key: 'funcionario_id', label: 'Responsavel', icon: UserCheck, color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
  { key: 'titular_id', label: 'Titular', icon: UserCog, color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-300' },
  { key: 'valor', label: 'Valor (EUR)', icon: DollarSign, color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300' },
  { key: 'onde_estao', label: 'Localizacao', icon: MapPin, color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-300' },
];

const CUSTOM_TYPE_ICONS: Record<string, React.ElementType> = {
  text: Type,
  number: Hash,
  date: Calendar,
  textarea: FileText,
  select: List,
};

function customFieldToFieldDef(cf: CustomFieldDef): FieldDef {
  return {
    key: cf.key,
    label: cf.label,
    icon: CUSTOM_TYPE_ICONS[cf.type] || Puzzle,
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    isCustom: true,
    customType: cf.type,
  };
}

const DEFAULT_WIZARD_CONFIG: WizardConfig = {
  steps: [
    {
      id: 'step_entidade',
      title: 'Entidade e Arquivo',
      fields: [{ key: 'cliente_id', required: true }],
    },
    {
      id: 'step_detalhes',
      title: 'Detalhes do Processo',
      fields: [
        { key: 'titulo', required: true },
        { key: 'descricao', required: false },
        { key: 'estado', required: true },
        { key: 'funcionario_id', required: false },
        { key: 'titular_id', required: false },
        { key: 'valor', required: false },
        { key: 'onde_estao', required: false },
      ],
    },
  ],
  custom_fields: [],
};

interface WizardBlockEditorProps {
  value: WizardConfig | null | undefined;
  onChange: (config: WizardConfig) => void;
}

export const WizardBlockEditor: React.FC<WizardBlockEditorProps> = ({ value, onChange }) => {
  const config: WizardConfig = {
    steps: value?.steps ?? DEFAULT_WIZARD_CONFIG.steps,
    custom_fields: value?.custom_fields ?? [],
  };

  const [dragData, setDragData] = useState<{ type: 'field' | 'palette'; key: string; fromStepIdx?: number; fromFieldIdx?: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ stepIdx: number; fieldIdx: number } | null>(null);
  const [showNewCustomField, setShowNewCustomField] = useState(false);

  // Build all field defs (built-in + custom)
  const customFieldDefs: FieldDef[] = (config.custom_fields ?? []).map(customFieldToFieldDef);
  const allFieldDefs = [...BUILTIN_FIELD_DEFS, ...customFieldDefs];

  const getFieldDef = (key: string): FieldDef | undefined => allFieldDefs.find(f => f.key === key);

  const usedFieldKeys = new Set(config.steps.flatMap(s => s.fields.map(f => f.key)));
  const availableFields = allFieldDefs.filter(f => !usedFieldKeys.has(f.key));

  const updateConfig = useCallback((newConfig: WizardConfig) => {
    onChange(newConfig);
  }, [onChange]);

  // ── Custom field operations ────────────────────────────────────────────

  const addCustomField = (cf: CustomFieldDef) => {
    const customFields = [...(config.custom_fields ?? []), cf];
    updateConfig({ ...config, custom_fields: customFields });
  };

  const removeCustomField = (key: string) => {
    // Remove from custom_fields list AND from all steps
    const customFields = (config.custom_fields ?? []).filter(f => f.key !== key);
    const steps = config.steps.map(s => ({
      ...s,
      fields: s.fields.filter(f => f.key !== key),
    }));
    updateConfig({ ...config, custom_fields: customFields, steps });
  };

  // ── Step operations ────────────────────────────────────────────────────

  const addStep = () => {
    const id = `step_${Date.now()}`;
    updateConfig({ ...config, steps: [...config.steps, { id, title: 'Novo Passo', fields: [] }] });
  };

  const removeStep = (stepIdx: number) => {
    updateConfig({ ...config, steps: config.steps.filter((_, i) => i !== stepIdx) });
  };

  const moveStep = (stepIdx: number, dir: -1 | 1) => {
    const newIdx = stepIdx + dir;
    if (newIdx < 0 || newIdx >= config.steps.length) return;
    const steps = [...config.steps];
    [steps[stepIdx], steps[newIdx]] = [steps[newIdx], steps[stepIdx]];
    updateConfig({ ...config, steps });
  };

  const renameStep = (stepIdx: number, title: string) => {
    const steps = [...config.steps];
    steps[stepIdx] = { ...steps[stepIdx], title };
    updateConfig({ ...config, steps });
  };

  // ── Field operations ───────────────────────────────────────────────────

  const addFieldToStep = (stepIdx: number, fieldKey: string) => {
    const steps = [...config.steps];
    steps[stepIdx] = {
      ...steps[stepIdx],
      fields: [...steps[stepIdx].fields, { key: fieldKey, required: false }],
    };
    updateConfig({ ...config, steps });
  };

  const removeFieldFromStep = (stepIdx: number, fieldIdx: number) => {
    const steps = [...config.steps];
    steps[stepIdx] = {
      ...steps[stepIdx],
      fields: steps[stepIdx].fields.filter((_, i) => i !== fieldIdx),
    };
    updateConfig({ ...config, steps });
  };

  const toggleFieldRequired = (stepIdx: number, fieldIdx: number) => {
    const steps = [...config.steps];
    const fields = [...steps[stepIdx].fields];
    fields[fieldIdx] = { ...fields[fieldIdx], required: !fields[fieldIdx].required };
    steps[stepIdx] = { ...steps[stepIdx], fields };
    updateConfig({ ...config, steps });
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────

  const handleDragStart = (type: 'field' | 'palette', key: string, fromStepIdx?: number, fromFieldIdx?: number) => {
    setDragData({ type, key, fromStepIdx, fromFieldIdx });
  };

  const handleDragOver = (e: React.DragEvent, stepIdx: number, fieldIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ stepIdx, fieldIdx });
  };

  const handleDragLeave = () => setDropTarget(null);

  const handleDrop = (e: React.DragEvent, stepIdx: number, fieldIdx: number) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragData) return;

    const steps = [...config.steps];

    if (dragData.type === 'palette') {
      const fields = [...steps[stepIdx].fields];
      fields.splice(fieldIdx, 0, { key: dragData.key, required: false });
      steps[stepIdx] = { ...steps[stepIdx], fields };
    } else if (dragData.type === 'field' && dragData.fromStepIdx !== undefined && dragData.fromFieldIdx !== undefined) {
      const fromFields = [...steps[dragData.fromStepIdx].fields];
      const [moved] = fromFields.splice(dragData.fromFieldIdx, 1);
      steps[dragData.fromStepIdx] = { ...steps[dragData.fromStepIdx], fields: fromFields };
      const toFields = [...steps[stepIdx].fields];
      toFields.splice(fieldIdx, 0, moved);
      steps[stepIdx] = { ...steps[stepIdx], fields: toFields };
    }

    updateConfig({ ...config, steps });
    setDragData(null);
  };

  const handleStepDrop = (e: React.DragEvent, stepIdx: number) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragData) return;

    const steps = [...config.steps];

    if (dragData.type === 'palette') {
      steps[stepIdx] = { ...steps[stepIdx], fields: [...steps[stepIdx].fields, { key: dragData.key, required: false }] };
    } else if (dragData.type === 'field' && dragData.fromStepIdx !== undefined && dragData.fromFieldIdx !== undefined) {
      const fromFields = [...steps[dragData.fromStepIdx].fields];
      const [moved] = fromFields.splice(dragData.fromFieldIdx, 1);
      steps[dragData.fromStepIdx] = { ...steps[dragData.fromStepIdx], fields: fromFields };
      steps[stepIdx] = { ...steps[stepIdx], fields: [...steps[stepIdx].fields, moved] };
    }

    updateConfig({ ...config, steps });
    setDragData(null);
  };

  const handleDragEnd = () => { setDragData(null); setDropTarget(null); };

  const resetToDefault = () => updateConfig(DEFAULT_WIZARD_CONFIG);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-medium">Wizard de Criacao</span>
        </div>
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={resetToDefault}>
          Repor padrao
        </Button>
      </div>

      <div className="flex gap-4">
        {/* ── Palette ─────────────────────────────────────────────────── */}
        <div className="w-52 shrink-0 space-y-3">
          {/* Built-in blocks */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Campos do sistema</p>
            {BUILTIN_FIELD_DEFS.filter(f => !usedFieldKeys.has(f.key)).length === 0 && customFieldDefs.filter(f => !usedFieldKeys.has(f.key)).length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Todos os blocos em uso</p>
            ) : (
              <>
                {BUILTIN_FIELD_DEFS.filter(f => !usedFieldKeys.has(f.key)).map((fd) => (
                  <PaletteBlock key={fd.key} fd={fd} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                ))}
              </>
            )}
          </div>

          {/* Custom blocks */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Campos personalizados</p>
            </div>

            {customFieldDefs.filter(f => !usedFieldKeys.has(f.key)).map((fd) => (
              <div key={fd.key} className="relative group">
                <PaletteBlock fd={fd} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
                <button
                  type="button"
                  onClick={() => removeCustomField(fd.key)}
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar campo personalizado"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}

            {/* In-use custom fields (shown dimmed with delete option) */}
            {customFieldDefs.filter(f => usedFieldKeys.has(f.key)).map((fd) => (
              <div key={fd.key} className="relative group opacity-50">
                <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border-2 ${fd.borderColor} ${fd.bgColor}`}>
                  <fd.icon className={`h-3.5 w-3.5 ${fd.color} shrink-0`} />
                  <p className={`text-xs font-semibold ${fd.color} truncate`}>{fd.label}</p>
                  <Badge variant="outline" className="text-[8px] px-1 ml-auto">{fd.customType}</Badge>
                </div>
                <button
                  type="button"
                  onClick={() => removeCustomField(fd.key)}
                  className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar campo personalizado"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setShowNewCustomField(true)}
              className="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 border-dashed border-pink-300 text-pink-600 text-xs font-medium hover:bg-pink-50 transition-colors"
            >
              <Puzzle className="h-3.5 w-3.5" />
              Novo campo personalizado
            </button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground">
              Arraste blocos para os passos do wizard. Campos personalizados ficam guardados no processo.
            </p>
          </div>
        </div>

        {/* ── Steps canvas ────────────────────────────────────────────── */}
        <div className="flex-1 space-y-3">
          {config.steps.map((step, stepIdx) => (
            <div
              key={step.id}
              className={`rounded-xl border-2 border-dashed transition-colors ${
                dragData ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
              }`}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => handleStepDrop(e, stepIdx)}
            >
              {/* Step header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-t-xl border-b">
                <GripVertical className="h-3.5 w-3.5 text-gray-400" />
                <div className="flex items-center gap-1.5 flex-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 bg-white font-bold">
                    {stepIdx + 1}
                  </Badge>
                  <Input
                    value={step.title}
                    onChange={(e) => renameStep(stepIdx, e.target.value)}
                    className="h-7 text-sm font-medium border-none bg-transparent px-1 focus-visible:ring-0 focus-visible:bg-white focus-visible:border"
                  />
                </div>
                <div className="flex items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(stepIdx, -1)} disabled={stepIdx === 0}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStep(stepIdx, 1)} disabled={stepIdx === config.steps.length - 1}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeStep(stepIdx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Fields area */}
              <div className="p-2 min-h-[60px] space-y-1">
                {step.fields.length === 0 && !dragData && (
                  <p className="text-xs text-muted-foreground text-center py-4 italic">
                    Arraste blocos para aqui ou clique + para adicionar campos
                  </p>
                )}

                {step.fields.map((field, fieldIdx) => {
                  const fd = getFieldDef(field.key);
                  if (!fd) return null;
                  const Icon = fd.icon;
                  const isDropHere = dropTarget?.stepIdx === stepIdx && dropTarget?.fieldIdx === fieldIdx;

                  return (
                    <React.Fragment key={`${step.id}-${field.key}`}>
                      {isDropHere && <div className="h-1 rounded-full bg-blue-500 mx-2 animate-pulse" />}
                      <div
                        draggable
                        onDragStart={() => handleDragStart('field', field.key, stepIdx, fieldIdx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, stepIdx, fieldIdx)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stepIdx, fieldIdx)}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${fd.borderColor} ${fd.bgColor} cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-sm`}
                        style={{ borderLeftWidth: '5px' }}
                      >
                        <GripVertical className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <Icon className={`h-3.5 w-3.5 ${fd.color} shrink-0`} />
                        <span className={`text-xs font-semibold ${fd.color} flex-1`}>{fd.label}</span>
                        {fd.isCustom && (
                          <Badge variant="outline" className="text-[8px] px-1">{fd.customType}</Badge>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleFieldRequired(stepIdx, fieldIdx)}
                          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            field.required
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {field.required ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                          {field.required ? 'Obrig.' : 'Opcional'}
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                          onClick={() => removeFieldFromStep(stepIdx, fieldIdx)}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </React.Fragment>
                  );
                })}

                {/* Drop zone at end */}
                {dragData && (
                  <div
                    onDragOver={(e) => handleDragOver(e, stepIdx, step.fields.length)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stepIdx, step.fields.length)}
                    className={`h-8 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center ${
                      dropTarget?.stepIdx === stepIdx && dropTarget?.fieldIdx === step.fields.length
                        ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground">Largar aqui</span>
                  </div>
                )}

                {/* Quick add buttons */}
                {availableFields.length > 0 && !dragData && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {availableFields.slice(0, 4).map((fd) => {
                      const Icon = fd.icon;
                      return (
                        <button
                          key={fd.key}
                          type="button"
                          onClick={() => addFieldToStep(stepIdx, fd.key)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-gray-300 text-[10px] text-gray-500 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          <Icon className="h-2.5 w-2.5" />
                          {fd.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add step button */}
          <button
            type="button"
            onClick={addStep}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Passo
          </button>
        </div>
      </div>

      {/* ── New Custom Field Dialog ──────────────────────────────────── */}
      {showNewCustomField && (
        <NewCustomFieldDialog
          existingKeys={new Set(allFieldDefs.map(f => f.key))}
          onAdd={(cf) => { addCustomField(cf); setShowNewCustomField(false); }}
          onClose={() => setShowNewCustomField(false)}
        />
      )}
    </div>
  );
};

// ── Palette Block ────────────────────────────────────────────────────────

const PaletteBlock: React.FC<{
  fd: FieldDef;
  onDragStart: (type: 'palette', key: string) => void;
  onDragEnd: () => void;
}> = ({ fd, onDragStart, onDragEnd }) => {
  const Icon = fd.icon;
  return (
    <div
      draggable
      onDragStart={() => onDragStart('palette', fd.key)}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border-2 ${fd.borderColor} ${fd.bgColor} cursor-grab active:cursor-grabbing select-none transition-all hover:shadow-md hover:scale-[1.02]`}
      style={{
        borderLeftWidth: '5px',
        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)',
      }}
    >
      <Icon className={`h-3.5 w-3.5 ${fd.color} shrink-0`} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold ${fd.color} truncate`}>{fd.label}</p>
      </div>
      {fd.isCustom && (
        <Badge variant="outline" className="text-[8px] px-1 shrink-0">{fd.customType}</Badge>
      )}
    </div>
  );
};

// ── New Custom Field Dialog ──────────────────────────────────────────────

const CUSTOM_FIELD_TYPES = [
  { value: 'text', label: 'Texto', icon: Type, desc: 'Campo de texto curto' },
  { value: 'number', label: 'Numero', icon: Hash, desc: 'Valor numerico' },
  { value: 'date', label: 'Data', icon: Calendar, desc: 'Seletor de data' },
  { value: 'textarea', label: 'Texto Longo', icon: FileText, desc: 'Area de texto grande' },
  { value: 'select', label: 'Selecao', icon: List, desc: 'Lista de opcoes' },
] as const;

const NewCustomFieldDialog: React.FC<{
  existingKeys: Set<string>;
  onAdd: (cf: CustomFieldDef) => void;
  onClose: () => void;
}> = ({ existingKeys, onAdd, onClose }) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<CustomFieldDef['type']>('text');
  const [placeholder, setPlaceholder] = useState('');
  const [optionsText, setOptionsText] = useState('');

  const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`;
  const isValid = label.trim().length >= 2 && !existingKeys.has(key);

  const handleSubmit = () => {
    if (!isValid) return;
    const cf: CustomFieldDef = {
      key,
      label: label.trim(),
      type,
      placeholder: placeholder.trim() || undefined,
    };
    if (type === 'select' && optionsText.trim()) {
      cf.options = optionsText.split('\n').map(o => o.trim()).filter(Boolean);
    }
    onAdd(cf);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-pink-600" />
            Novo Campo Personalizado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do campo *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Matricula, Data Escritura, etc."
              autoFocus
            />
            {label.trim() && existingKeys.has(key) && (
              <p className="text-xs text-red-500">Ja existe um campo com esta chave.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo de campo</Label>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOM_FIELD_TYPES.map((t) => {
                const Icon = t.icon;
                const selected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                      selected
                        ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{t.label}</p>
                      <p className="text-[10px] opacity-70">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Placeholder (opcional)</Label>
            <Input
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="Texto de exemplo no campo vazio"
            />
          </div>

          {type === 'select' && (
            <div className="space-y-2">
              <Label>Opcoes (uma por linha) *</Label>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={"Opcao 1\nOpcao 2\nOpcao 3"}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
          )}

          {/* Preview */}
          {label.trim() && (
            <div className="rounded-lg border-2 border-pink-300 bg-pink-50 px-3 py-2 flex items-center gap-2">
              <Puzzle className="h-3.5 w-3.5 text-pink-700" />
              <span className="text-xs font-semibold text-pink-700">{label.trim()}</span>
              <Badge variant="outline" className="text-[8px] px-1 ml-auto">{type}</Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Criar Campo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
