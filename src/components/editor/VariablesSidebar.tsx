import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, GripVertical, User, FolderOpen, Folder, Briefcase, Calendar } from 'lucide-react';
import { TEMPLATE_VARIABLES, TemplateVariableGroup } from '@/constants/templateVariables';

const GROUP_ICONS: Record<string, React.ReactNode> = {
  entidade: <User className="h-4 w-4" />,
  processo: <FolderOpen className="h-4 w-4" />,
  dossie: <Folder className="h-4 w-4" />,
  funcionario: <Briefcase className="h-4 w-4" />,
  sistema: <Calendar className="h-4 w-4" />,
};

const GROUP_COLORS: Record<string, string> = {
  entidade: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  processo: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  dossie: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  funcionario: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  sistema: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
};

interface VariablesSidebarProps {
  onVariableClick: (variablePath: string, label: string) => void;
}

export const VariablesSidebar: React.FC<VariablesSidebarProps> = ({ onVariableClick }) => {
  const [search, setSearch] = useState('');

  const filteredGroups = TEMPLATE_VARIABLES.map((group) => ({
    ...group,
    campos: group.campos.filter(
      (c) =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.campo.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((g) => g.campos.length > 0);

  const handleDragStart = (
    e: React.DragEvent,
    variablePath: string,
    label: string,
  ) => {
    e.dataTransfer.setData(
      'application/template-variable',
      JSON.stringify({ variablePath, label }),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Campos Dinâmicos</h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Pesquisar campos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          Arraste ou clique para inserir
        </p>
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={TEMPLATE_VARIABLES.map((g) => g.prefixo)} className="px-2">
          {filteredGroups.map((group) => (
            <AccordionItem key={group.prefixo} value={group.prefixo} className="border-b-0">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                <div className="flex items-center gap-2">
                  {GROUP_ICONS[group.prefixo]}
                  <span>{group.grupo}</span>
                  <span className="text-xs text-gray-400">({group.campos.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1">
                  {group.campos.map((campo) => {
                    const variablePath = `${group.prefixo}.${campo.campo}`;
                    const colorClass = GROUP_COLORS[group.prefixo] || 'bg-gray-50 text-gray-700';
                    return (
                      <div
                        key={variablePath}
                        draggable
                        onDragStart={(e) => handleDragStart(e, variablePath, campo.label)}
                        onClick={() => onVariableClick(variablePath, campo.label)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs border cursor-grab active:cursor-grabbing transition-colors ${colorClass}`}
                        title={`{{${variablePath}}}`}
                      >
                        <GripVertical className="h-3 w-3 opacity-40 flex-shrink-0" />
                        <span className="truncate">{campo.label}</span>
                        <span className="ml-auto text-[10px] opacity-50 flex-shrink-0">
                          {campo.tipo === 'data' ? 'data' : campo.tipo === 'numero' ? 'num' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
};
