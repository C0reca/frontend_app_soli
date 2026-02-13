import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { Table as TableExtension } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image as ImageExtension } from '@tiptap/extension-image';
import { TemplateVariable } from './TemplateVariableNode';
import { EditorToolbar } from './EditorToolbar';
import './editor.css';

interface TemplateEditorProps {
  content: string;
  onChange: (html: string) => void;
  onVariablesChange?: (variables: string[]) => void;
  onImportDocx?: () => void;
}

function extractVariables(html: string): string[] {
  const vars = new Set<string>();
  // Match data-template-variable attributes
  const attrRegex = /data-template-variable="([^"]+)"/g;
  let match;
  while ((match = attrRegex.exec(html)) !== null) {
    vars.add(match[1]);
  }
  // Match bare {{x.y}} patterns
  const braceRegex = /\{\{(\w+\.\w+)\}\}/g;
  while ((match = braceRegex.exec(html)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  content,
  onChange,
  onVariablesChange,
  onImportDocx,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Comece a escrever o template do documento...' }),
      Highlight,
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ImageExtension,
      TemplateVariable,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      if (onVariablesChange) {
        onVariablesChange(extractVariables(html));
      }
    },
  });

  // Update editor content when content prop changes externally (e.g., import)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content]);

  // Insert a template variable at current cursor or specific position
  const insertVariable = useCallback(
    (variablePath: string, label: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'templateVariable',
          attrs: { variablePath, label },
        })
        .run();
    },
    [editor],
  );

  // Handle drop from sidebar
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      const data = e.dataTransfer.getData('application/template-variable');
      if (!data || !editor) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const { variablePath, label } = JSON.parse(data);
      const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (pos) {
        editor
          .chain()
          .focus()
          .insertContentAt(pos.pos, {
            type: 'templateVariable',
            attrs: { variablePath, label },
          })
          .run();
      }
    },
    [editor],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/template-variable')) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Expose insertVariable for the parent (sidebar click-to-insert)
  React.useImperativeHandle(
    (containerRef as any).__editorRef,
    () => ({ insertVariable }),
    [insertVariable],
  );

  // Attach insertVariable to the container DOM element so parent can call it
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).__insertVariable = insertVariable;
    }
  }, [insertVariable]);

  return (
    <div
      ref={containerRef}
      className={`template-editor border rounded-md bg-white ${isDragOver ? 'drag-over ring-2 ring-blue-400' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <EditorToolbar editor={editor} onImportDocx={onImportDocx} />
      <EditorContent editor={editor} />
    </div>
  );
};
