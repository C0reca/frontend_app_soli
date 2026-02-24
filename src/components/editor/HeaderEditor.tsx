import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from './FontSizeExtension';
import { Image as ImageExtension } from '@tiptap/extension-image';
import { TemplateVariable } from './TemplateVariableNode';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Palette,
  Type,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import './editor.css';

interface HeaderEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export const HeaderEditor: React.FC<HeaderEditorProps> = ({ content, onChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      UnderlineExtension,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: 'Cabeçalho do documento (texto, imagem, variáveis)...' }),
      ImageExtension,
      TemplateVariable,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      queueMicrotask(() => {
        editor.commands.setContent(content, false);
      });
    }
  }, [content, editor]);

  // Insert a template variable
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

  // Expose insertVariable for parent (sidebar click-to-insert)
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).__insertVariable = insertVariable;
    }
  }, [insertVariable]);

  const handleImageInsert = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        editor.chain().focus().setImage({ src: dataUrl }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      ref={containerRef}
      className={`header-editor template-editor border rounded-md bg-white ${isDragOver ? 'ring-2 ring-blue-400' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Mini toolbar */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5 px-2 py-1 border-b bg-gray-50 flex-wrap">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Negrito</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Itálico</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('underline')}
                onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
              >
                <Underline className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Sublinhado</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'left' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Alinhar à esquerda</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'center' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Centrar</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive({ textAlign: 'right' })}
                onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
              >
                <AlignRight className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Alinhar à direita</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Font family */}
          <select
            className="h-7 text-xs border rounded px-1 bg-white"
            value={editor.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setFontFamily(e.target.value).run();
              } else {
                editor.chain().focus().unsetFontFamily().run();
              }
            }}
          >
            <option value="">Fonte</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>

          {/* Font size */}
          <select
            className="h-7 text-xs border rounded px-1 bg-white w-14"
            value={editor.getAttributes('textStyle').fontSize || ''}
            onChange={(e) => {
              if (e.target.value) {
                (editor.chain().focus() as any).setFontSize(e.target.value).run();
              } else {
                (editor.chain().focus() as any).unsetFontSize().run();
              }
            }}
          >
            <option value="">Tam.</option>
            <option value="8pt">8</option>
            <option value="9pt">9</option>
            <option value="10pt">10</option>
            <option value="11pt">11</option>
            <option value="12pt">12</option>
            <option value="14pt">14</option>
            <option value="16pt">16</option>
            <option value="18pt">18</option>
            <option value="24pt">24</option>
          </select>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Color */}
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="inline-flex items-center cursor-pointer h-7 w-7 justify-center rounded hover:bg-gray-200">
                <Palette className="h-3.5 w-3.5" />
                <input
                  type="color"
                  className="sr-only"
                  value={editor.getAttributes('textStyle').color || '#000000'}
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                />
              </label>
            </TooltipTrigger>
            <TooltipContent>Cor do texto</TooltipContent>
          </Tooltip>

          {/* Image */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200"
                onClick={handleImageInsert}
              >
                <ImageIcon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Inserir imagem</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div className="header-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
