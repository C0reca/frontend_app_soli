import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

const GROUP_COLORS: Record<string, string> = {
  entidade: 'bg-blue-100 text-blue-800 border-blue-200',
  processo: 'bg-green-100 text-green-800 border-green-200',
  dossie: 'bg-purple-100 text-purple-800 border-purple-200',
  funcionario: 'bg-orange-100 text-orange-800 border-orange-200',
  sistema: 'bg-red-100 text-red-800 border-red-200',
};

export const TemplateVariableComponent: React.FC<any> = ({ node }) => {
  const { variablePath, label } = node.attrs;
  const prefix = variablePath?.split('.')[0] || '';
  const colorClass = GROUP_COLORS[prefix] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border cursor-default select-all ${colorClass}`}
        contentEditable={false}
        data-template-variable={variablePath}
      >
        <span className="opacity-60">{prefix}.</span>
        {label?.split('.').pop() || variablePath}
      </span>
    </NodeViewWrapper>
  );
};
