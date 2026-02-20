import React from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Quote,
  Upload,
  Table,
  Palette,
  Type,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const FONT_FAMILIES = [
  { label: 'Predefinida', value: '' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Calibri', value: 'Calibri' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' },
];

const FONT_SIZES = [
  { label: 'Predefinido', value: '' },
  { label: '8pt', value: '8pt' },
  { label: '9pt', value: '9pt' },
  { label: '10pt', value: '10pt' },
  { label: '11pt', value: '11pt' },
  { label: '12pt', value: '12pt' },
  { label: '14pt', value: '14pt' },
  { label: '16pt', value: '16pt' },
  { label: '18pt', value: '18pt' },
  { label: '20pt', value: '20pt' },
  { label: '24pt', value: '24pt' },
  { label: '28pt', value: '28pt' },
  { label: '36pt', value: '36pt' },
];

interface EditorToolbarProps {
  editor: Editor | null;
  onImportDocx?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onImportDocx }) => {
  if (!editor) return null;

  const currentColor = editor.getAttributes('textStyle')?.color || '#000000';
  const currentFontFamily = editor.getAttributes('textStyle')?.fontFamily || '';
  const currentFontSize = editor.getAttributes('textStyle')?.fontSize || '';

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    tooltip: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive, tooltip, children }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={isActive}
          onPressedChange={() => onClick()}
          className="h-8 w-8 p-0"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b bg-gray-50 px-2 py-1.5 rounded-t-md">
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        tooltip="Desfazer"
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        tooltip="Refazer"
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Font Family */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Select
              value={currentFontFamily || '_default'}
              onValueChange={(value) => {
                if (value && value !== '_default') {
                  editor.chain().focus().setFontFamily(value).run();
                } else {
                  editor.chain().focus().unsetFontFamily().run();
                }
              }}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f.value || '_default'} value={f.value || '_default'} className="text-xs" style={{ fontFamily: f.value || 'inherit' }}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Tipo de letra
        </TooltipContent>
      </Tooltip>

      {/* Font Size */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Select
              value={currentFontSize || '_default'}
              onValueChange={(value) => {
                if (value && value !== '_default') {
                  editor.chain().focus().setFontSize(value).run();
                } else {
                  editor.chain().focus().unsetFontSize().run();
                }
              }}
            >
              <SelectTrigger className="h-8 w-[80px] text-xs">
                <SelectValue placeholder="Tamanho" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((s) => (
                  <SelectItem key={s.value || '_default'} value={s.value || '_default'} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Tamanho da letra
        </TooltipContent>
      </Tooltip>

      {/* Color Picker */}
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <div className="relative">
                  <Type className="h-4 w-4" />
                  <div
                    className="absolute -bottom-0.5 left-0.5 right-0.5 h-1 rounded-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                </div>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Cor do texto
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-auto p-3" side="bottom" align="start">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-8 gap-1">
              {[
                '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#ffffff',
                '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff',
                '#9900ff', '#ff00ff', '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3',
                '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
              ].map((color) => (
                <button
                  key={color}
                  className="h-5 w-5 rounded border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t">
              <label className="text-xs text-gray-500">Personalizada:</label>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run();
                }}
                className="h-6 w-8 cursor-pointer border-0 p-0"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Limpar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        tooltip="Negrito"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        tooltip="Itálico"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        tooltip="Sublinhado"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        tooltip="Riscado"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        tooltip="Título 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        tooltip="Título 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        tooltip="Título 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        tooltip="Lista"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        tooltip="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        tooltip="Citação"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        tooltip="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        tooltip="Centrar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        tooltip="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        isActive={editor.isActive({ textAlign: 'justify' })}
        tooltip="Justificar"
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Table */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        tooltip="Inserir tabela"
      >
        <Table className="h-4 w-4" />
      </ToolbarButton>

      {/* Import DOCX */}
      {onImportDocx && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={onImportDocx}
              >
                <Upload className="h-3.5 w-3.5" />
                Importar Documento
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Importar ficheiro Word, RTF, ODT ou PDF
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
};
