import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TemplateVariableComponent } from './TemplateVariableComponent';

export const TemplateVariable = Node.create({
  name: 'templateVariable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      variablePath: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-template-variable]',
        getAttrs: (el) => {
          const element = el as HTMLElement;
          return {
            variablePath: element.getAttribute('data-template-variable'),
            label: element.getAttribute('data-label') || element.getAttribute('data-template-variable'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes({
        'data-template-variable': HTMLAttributes.variablePath,
        'data-label': HTMLAttributes.label,
        class: 'template-variable',
      }),
      `{{${HTMLAttributes.variablePath}}}`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TemplateVariableComponent);
  },
});
