import { useState, useMemo, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {
  FolderPlus, FilePlus, Trash2, Edit2, ChevronRight, ChevronDown,
  FolderOpen, Folder, FileText, Save, X,
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Highlighter,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBaseConhecimento, Pasta, Nota } from '@/hooks/useBaseConhecimento';
import '@/components/editor/editor.css';

// ── Tree helpers ───────────────────────────────────────

interface TreeNode extends Pasta {
  children: TreeNode[];
}

function buildTree(pastas: Pasta[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];
  for (const p of pastas) {
    map.set(p.id, { ...p, children: [] });
  }
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ── Toolbar button ─────────────────────────────────────

function ToolbarBtn({
  onClick, isActive, tip, children,
}: {
  onClick: () => void;
  isActive?: boolean;
  tip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" pressed={isActive} onPressedChange={() => onClick()} className="h-8 w-8 p-0">
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{tip}</TooltipContent>
    </Tooltip>
  );
}

// ── Notes toolbar ──────────────────────────────────────

function NotesToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b bg-gray-50/80 flex-wrap">
      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} tip="Desfazer">
        <Undo className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} tip="Refazer">
        <Redo className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        tip="Titulo"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        tip="Subtitulo"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        tip="Secção"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        tip="Negrito"
      >
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        tip="Itálico"
      >
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        tip="Sublinhado"
      >
        <Underline className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        tip="Riscado"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        tip="Destaque"
      >
        <Highlighter className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        tip="Lista"
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        tip="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        tip="Citação"
      >
        <Quote className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        tip="Linha divisória"
      >
        <Minus className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-5 mx-1" />

      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        tip="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        tip="Centrar"
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        tip="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarBtn>
    </div>
  );
}

// ── Folder tree item ───────────────────────────────────

function FolderItem({
  node, depth, selectedPastaId, onSelect, onRename, onDelete,
  expanded, onToggle,
}: {
  node: TreeNode;
  depth: number;
  selectedPastaId: number | null;
  onSelect: (id: number | null) => void;
  onRename: (pasta: Pasta) => void;
  onDelete: (pasta: Pasta) => void;
  expanded: Set<number>;
  onToggle: (id: number) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedPastaId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm group ${
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        {isExpanded ? <FolderOpen className="h-4 w-4 text-yellow-600 shrink-0" /> : <Folder className="h-4 w-4 text-yellow-600 shrink-0" />}
        <span className="truncate flex-1">{node.nome}</span>
        <div className="hidden group-hover:flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onRename(node); }} className="p-0.5 hover:bg-gray-200 rounded">
            <Edit2 className="h-3.5 w-3.5 text-gray-500" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(node); }} className="p-0.5 hover:bg-gray-200 rounded">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>
      </div>
      {isExpanded && node.children.map((child) => (
        <FolderItem
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedPastaId={selectedPastaId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          expanded={expanded}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

// ── Main page ──────────────────────────────────────────

export default function BaseConhecimento() {
  const {
    pastas, isLoadingPastas,
    criarPasta, atualizarPasta, apagarPasta,
    useNotas, criarNota, atualizarNota, apagarNota,
  } = useBaseConhecimento();

  // State
  const [selectedPastaId, setSelectedPastaId] = useState<number | null>(null);
  const [selectedNotaId, setSelectedNotaId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Editor state
  const [editTitulo, setEditTitulo] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExtension,
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Comece a escrever...' }),
    ],
    content: '',
    onUpdate: () => {
      setIsDirty(true);
    },
  });

  // Dialog state
  const [pastaDialog, setPastaDialog] = useState<{ open: boolean; pasta?: Pasta }>({ open: false });
  const [pastaName, setPastaName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pasta' | 'nota'; id: number; nome: string } | null>(null);

  // Queries
  const { data: notas = [], isLoading: isLoadingNotas } = useNotas(selectedPastaId);

  const tree = useMemo(() => buildTree(pastas), [pastas]);

  // Load nota content into editor
  const selectedNota = notas.find((n) => n.id === selectedNotaId);

  useEffect(() => {
    if (selectedNota && editor) {
      setEditTitulo(selectedNota.titulo);
      editor.commands.setContent(selectedNota.conteudo || '');
      setIsDirty(false);
    }
  }, [selectedNotaId, selectedNota?.titulo, selectedNota?.conteudo, editor]);

  const toggleExpand = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Handlers ─────────────────────────────────────────

  const handleSelectPasta = (id: number | null) => {
    setSelectedPastaId(id);
    setSelectedNotaId(null);
    setIsDirty(false);
    editor?.commands.clearContent();
  };

  const handleSelectNota = (nota: Nota) => {
    setSelectedNotaId(nota.id);
  };

  const handleSaveNota = () => {
    if (!selectedNotaId || !editor) return;
    atualizarNota.mutate({
      id: selectedNotaId,
      titulo: editTitulo,
      conteudo: editor.getHTML(),
    }, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const handleCriarPasta = () => {
    setPastaName('');
    setPastaDialog({ open: true });
  };

  const handleRenamePasta = (pasta: Pasta) => {
    setPastaName(pasta.nome);
    setPastaDialog({ open: true, pasta });
  };

  const handleSubmitPasta = () => {
    if (!pastaName.trim()) return;
    if (pastaDialog.pasta) {
      atualizarPasta.mutate({ id: pastaDialog.pasta.id, nome: pastaName.trim() });
    } else {
      criarPasta.mutate({ nome: pastaName.trim(), parent_id: selectedPastaId });
    }
    setPastaDialog({ open: false });
  };

  const handleCriarNota = () => {
    criarNota.mutate({
      titulo: 'Nova Nota',
      conteudo: '',
      pasta_id: selectedPastaId,
    }, {
      onSuccess: (data) => {
        setSelectedNotaId(data.id);
        setEditTitulo(data.titulo);
        editor?.commands.setContent('');
        setIsDirty(false);
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'pasta') {
      apagarPasta.mutate(deleteTarget.id, {
        onSuccess: () => {
          if (selectedPastaId === deleteTarget.id) {
            setSelectedPastaId(null);
            setSelectedNotaId(null);
            editor?.commands.clearContent();
          }
        },
      });
    } else {
      apagarNota.mutate(deleteTarget.id, {
        onSuccess: () => {
          if (selectedNotaId === deleteTarget.id) {
            setSelectedNotaId(null);
            editor?.commands.clearContent();
          }
        },
      });
    }
    setDeleteTarget(null);
  };

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left panel — folders + notes list */}
      <div className="w-80 border-r bg-gray-50 flex flex-col shrink-0">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b">
          <Button variant="ghost" size="sm" onClick={handleCriarPasta} title="Nova pasta">
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCriarNota} title="Nova nota">
            <FilePlus className="h-4 w-4" />
          </Button>
          {selectedPastaId && (
            <Button
              variant="ghost" size="sm"
              onClick={() => handleSelectPasta(null)}
              title="Mostrar todas"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Folder tree */}
        <div className="flex-1 overflow-auto">
          <div className="p-1">
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
                selectedPastaId === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleSelectPasta(null)}
            >
              <Folder className="h-4 w-4 text-gray-500" />
              <span>Todas as notas</span>
            </div>

            {isLoadingPastas ? (
              <p className="text-xs text-gray-400 px-3 py-2">A carregar...</p>
            ) : (
              tree.map((node) => (
                <FolderItem
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedPastaId={selectedPastaId}
                  onSelect={handleSelectPasta}
                  onRename={handleRenamePasta}
                  onDelete={(p) => setDeleteTarget({ type: 'pasta', id: p.id, nome: p.nome })}
                  expanded={expanded}
                  onToggle={toggleExpand}
                />
              ))
            )}
          </div>

          {/* Notes list */}
          <div className="border-t mt-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notas {selectedPastaId != null && `(${notas.length})`}
            </div>
            {isLoadingNotas ? (
              <p className="text-xs text-gray-400 px-3 py-1">A carregar...</p>
            ) : notas.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-1">Sem notas</p>
            ) : (
              notas.map((nota) => (
                <div
                  key={nota.id}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm group ${
                    selectedNotaId === nota.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => handleSelectNota(nota)}
                >
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate flex-1">{nota.titulo}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: 'nota', id: nota.id, nome: nota.titulo });
                    }}
                    className="hidden group-hover:block p-0.5 hover:bg-gray-200 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel — rich text editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNotaId && selectedNota ? (
          <>
            {/* Title + save */}
            <div className="flex items-center gap-2 p-2 border-b">
              <Input
                value={editTitulo}
                onChange={(e) => { setEditTitulo(e.target.value); setIsDirty(true); }}
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-1"
                placeholder="Titulo da nota..."
              />
              <Button
                size="sm"
                onClick={handleSaveNota}
                disabled={!isDirty || atualizarNota.isPending}
                className="shrink-0"
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
            </div>

            {/* Formatting toolbar */}
            <NotesToolbar editor={editor} />

            {/* Editor content */}
            <div className="flex-1 overflow-auto template-editor">
              <EditorContent editor={editor} className="p-4" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Selecione ou crie uma nota</p>
            </div>
          </div>
        )}
      </div>

      {/* Pasta dialog (create / rename) */}
      <Dialog open={pastaDialog.open} onOpenChange={(open) => !open && setPastaDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pastaDialog.pasta ? 'Renomear Pasta' : 'Nova Pasta'}</DialogTitle>
          </DialogHeader>
          <Input
            value={pastaName}
            onChange={(e) => setPastaName(e.target.value)}
            placeholder="Nome da pasta"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitPasta()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPastaDialog({ open: false })}>Cancelar</Button>
            <Button onClick={handleSubmitPasta} disabled={!pastaName.trim()}>
              {pastaDialog.pasta ? 'Renomear' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que quer apagar {deleteTarget?.type === 'pasta' ? 'a pasta' : 'a nota'}{' '}
              <strong>{deleteTarget?.nome}</strong>?
              {deleteTarget?.type === 'pasta' && ' Todas as notas e subpastas serão apagadas.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
