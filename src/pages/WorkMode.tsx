import React, { useState } from 'react';
import { Plus, Clock, Briefcase, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSessoesHistorico, type SessaoTrabalho } from '@/hooks/useSessoesTrabalho';
import { useWorkMode } from '@/contexts/WorkModeContext';

function formatDuration(seconds?: number): string {
  if (!seconds) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

export const WorkModePage: React.FC = () => {
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: historico = [], isLoading } = useSessoesHistorico();
  const { sessions, startSession } = useWorkMode();

  const handleStart = async () => {
    if (!titulo.trim()) return;
    setLoading(true);
    try {
      await startSession(null, '', titulo.trim());
      setTitulo('');
      setNewSessionOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Modo Trabalho
          </h1>
          <p className="text-sm text-muted-foreground">Tracking de tempo de trabalho por processo</p>
        </div>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 mr-1" />
              {sessions.length} sessão(ões) ativa(s)
            </Badge>
          )}
          <Button onClick={() => setNewSessionOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold">Histórico</h2>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Início</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Processo</TableHead>
              <TableHead>Duração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">A carregar...</TableCell></TableRow>
            ) : historico.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Nenhuma sessão registada</TableCell></TableRow>
            ) : (
              historico.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(s.inicio)}</TableCell>
                  <TableCell className="text-sm">{s.titulo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.processo_titulo || '-'}</TableCell>
                  <TableCell className="text-sm font-mono">{formatDuration(s.duracao_segundos)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Sessão de Trabalho</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título *</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Revisão de documentos"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSessionOpen(false)}>Cancelar</Button>
            <Button onClick={handleStart} disabled={!titulo.trim() || loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'A iniciar...' : 'Iniciar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
