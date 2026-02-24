import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, AlignLeft, AlignCenter, AlignRight, Type, Variable } from 'lucide-react';
import { TEMPLATE_VARIABLES } from '@/constants/templateVariables';
import type { OverlayFieldData } from './OverlayFieldRect';

interface FieldPropertiesPanelProps {
  field: OverlayFieldData | null;
  onUpdate: (id: string, updates: Partial<OverlayFieldData>) => void;
  onDelete: (id: string) => void;
}

// Build a flat list of all available variables for the dropdown
function getAllVariables() {
  const vars: { value: string; label: string; group: string }[] = [];
  for (const group of TEMPLATE_VARIABLES) {
    for (const campo of group.campos) {
      vars.push({
        value: `${group.prefixo}.${campo.campo}`,
        label: `${group.grupo} → ${campo.label}`,
        group: group.grupo,
      });
    }
  }
  return vars;
}

const ALL_VARIABLES = getAllVariables();

const FONT_FAMILIES = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times', label: 'Times' },
  { value: 'Courier', label: 'Courier' },
];

export const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({
  field,
  onUpdate,
  onDelete,
}) => {
  if (!field) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        <p className="mb-2 font-medium text-gray-700">Propriedades do Campo</p>
        <p>Seleccione um campo no PDF para editar as suas propriedades.</p>
        <p className="mt-3 text-xs">Clique no PDF para criar um novo campo.</p>
      </div>
    );
  }

  // Determine if this is a text field or variable field
  const isTextMode = !field.variable;

  const switchToText = () => {
    onUpdate(field.id, { variable: '', custom_text: field.custom_text || '' });
  };

  const switchToVariable = () => {
    onUpdate(field.id, { variable: field.variable || '', custom_text: '' });
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Propriedades</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(field.id)}
          className="text-red-600 hover:text-red-700 h-7 px-2"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Eliminar
        </Button>
      </div>

      {/* Mode toggle: Variable vs Text */}
      <div className="space-y-1">
        <Label className="text-xs">Tipo de campo</Label>
        <div className="flex gap-1">
          <Button
            variant={!isTextMode ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={switchToVariable}
          >
            <Variable className="h-3.5 w-3.5 mr-1" />
            Variável
          </Button>
          <Button
            variant={isTextMode ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={switchToText}
          >
            <Type className="h-3.5 w-3.5 mr-1" />
            Texto
          </Button>
        </div>
      </div>

      {/* Variable selector OR text input */}
      {isTextMode ? (
        <div className="space-y-1">
          <Label className="text-xs">Texto</Label>
          <Textarea
            value={field.custom_text}
            onChange={(e) => onUpdate(field.id, { custom_text: e.target.value })}
            placeholder="Escreva o texto..."
            className="text-xs min-h-[60px] resize-none"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">Variável</Label>
          <Select
            value={field.variable || ''}
            onValueChange={(val) => onUpdate(field.id, { variable: val })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Escolher variável..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {ALL_VARIABLES.map((v) => (
                <SelectItem key={v.value} value={v.value} className="text-xs">
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Font size */}
      <div className="space-y-1">
        <Label className="text-xs">Tamanho</Label>
        <Input
          type="number"
          min={6}
          max={72}
          value={field.font_size}
          onChange={(e) => onUpdate(field.id, { font_size: parseFloat(e.target.value) || 12 })}
          className="h-8 text-xs"
        />
      </div>

      {/* Font family */}
      <div className="space-y-1">
        <Label className="text-xs">Fonte</Label>
        <Select
          value={field.font_family}
          onValueChange={(val) => onUpdate(field.id, { font_family: val })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value} className="text-xs">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div className="space-y-1">
        <Label className="text-xs">Cor</Label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={field.color}
            onChange={(e) => onUpdate(field.id, { color: e.target.value })}
            className="h-8 w-10 rounded border cursor-pointer"
          />
          <Input
            value={field.color}
            onChange={(e) => onUpdate(field.id, { color: e.target.value })}
            className="h-8 text-xs flex-1"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Alignment */}
      <div className="space-y-1">
        <Label className="text-xs">Alinhamento</Label>
        <div className="flex gap-1">
          {[
            { value: 'left', icon: AlignLeft },
            { value: 'center', icon: AlignCenter },
            { value: 'right', icon: AlignRight },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              variant={field.alignment === value ? 'default' : 'outline'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onUpdate(field.id, { alignment: value })}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      </div>

      {/* Position info (read-only display) */}
      <div className="pt-2 border-t">
        <p className="text-[10px] text-gray-400">
          Pos: ({field.x.toFixed(0)}, {field.y.toFixed(0)}) · Tam: {field.width.toFixed(0)}×{field.height.toFixed(0)}
        </p>
      </div>
    </div>
  );
};
