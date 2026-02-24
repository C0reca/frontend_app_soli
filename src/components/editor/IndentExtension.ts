import { Extension } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

/**
 * TipTap extension that preserves and controls paragraph/heading indentation.
 *
 * - Parses `margin-left` from incoming HTML (e.g. PDF import)
 * - Renders it back as inline `margin-left`
 * - Provides indent/outdent commands (step = 40px)
 */
export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      step: 40, // px per indent level
      maxIndent: 200,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) => {
              const ml = element.style.marginLeft || element.style.paddingLeft;
              if (!ml) return 0;
              const val = parseInt(ml, 10);
              return isNaN(val) ? 0 : val;
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              const indent = attributes.indent as number;
              if (!indent || indent <= 0) return {};
              return { style: `margin-left: ${indent}px` };
            },
          },
          textIndent: {
            default: 0,
            parseHTML: (element: HTMLElement) => {
              const ti = element.style.textIndent;
              if (!ti) return 0;
              const val = parseInt(ti, 10);
              return isNaN(val) ? 0 : val;
            },
            renderHTML: (attributes: Record<string, unknown>) => {
              const ti = attributes.textIndent as number;
              if (!ti || ti <= 0) return {};
              return { style: `text-indent: ${ti}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = (node.attrs.indent as number) || 0;
              const next = Math.min(current + this.options.step, this.options.maxIndent);
              if (next !== current) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
                changed = true;
              }
            }
          });

          if (changed && dispatch) dispatch(tr);
          return changed;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const current = (node.attrs.indent as number) || 0;
              const next = Math.max(current - this.options.step, 0);
              if (next !== current) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
                changed = true;
              }
            }
          });

          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});
