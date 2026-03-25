import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, ChevronLeft, ChevronRight, Eye, Trash2, Monitor, Server, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ErrorLog {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  status_code: number;
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_id?: number;
  ip_address?: string;
  request_body?: string;
  headers_info?: string;
  source?: string;
}

export const ErrorLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchPath, setSearchPath] = useState('');
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const { toast } = useToast();
  const perPage = 25;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['error-logs', page, sourceFilter, searchPath],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (searchPath.trim()) params.path = searchPath.trim();
      const res = await api.get('/admin/error-logs', { params });
      return res.data;
    },
  });

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/error-logs/${id}`);
      toast({ title: 'Log apagado' });
      refetch();
      if (selectedLog?.id === id) setSelectedLog(null);
    } catch {
      toast({ title: 'Erro ao apagar', variant: 'destructive' });
    }
  };

  const items: ErrorLog[] = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Logs de Erros
          </h1>
          <p className="text-muted-foreground text-sm">{total} erro{total !== 1 ? 's' : ''} registado{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="backend">Backend</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por caminho..."
            value={searchPath}
            onChange={(e) => { setSearchPath(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Data</TableHead>
                <TableHead className="w-[90px]">Origem</TableHead>
                <TableHead className="w-[70px]">Método</TableHead>
                <TableHead>Caminho</TableHead>
                <TableHead>Erro</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">A carregar...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem erros registados.</TableCell></TableRow>
              ) : items.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                  <TableCell>
                    {(log.source || 'backend') === 'frontend' ? (
                      <Badge variant="outline" className="text-xs gap-1"><Monitor className="h-3 w-3" />Frontend</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs gap-1"><Server className="h-3 w-3" />Backend</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.method}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">{log.path}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-xs font-medium text-red-600 truncate">{log.error_type}</p>
                    <p className="text-xs text-muted-foreground truncate">{log.error_message}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Detalhes do Erro #{selectedLog?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedLog ? formatDate(selectedLog.timestamp) : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Origem</span>
                  <p className="text-sm">{(selectedLog.source || 'backend') === 'frontend' ? 'Frontend' : 'Backend'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Método</span>
                  <p className="text-sm font-mono">{selectedLog.method}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Caminho</span>
                  <p className="text-sm font-mono break-all">{selectedLog.path}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <p className="text-sm">{selectedLog.status_code || '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">User ID</span>
                  <p className="text-sm">{selectedLog.user_id ?? '-'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">IP</span>
                  <p className="text-sm font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground">Tipo de Erro</span>
                <p className="text-sm font-medium text-red-600">{selectedLog.error_type}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground">Mensagem</span>
                <pre className="text-xs bg-red-50 rounded-md p-3 mt-1 whitespace-pre-wrap break-all text-red-700">
                  {selectedLog.error_message}
                </pre>
              </div>

              {selectedLog.stack_trace && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Stack Trace</span>
                  <pre className="text-xs bg-gray-100 rounded-md p-3 mt-1 overflow-auto max-h-64 whitespace-pre-wrap break-all">
                    {selectedLog.stack_trace}
                  </pre>
                </div>
              )}

              {selectedLog.headers_info && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {(selectedLog.source || 'backend') === 'frontend' ? 'Browser Info' : 'Headers'}
                  </span>
                  <pre className="text-xs bg-gray-100 rounded-md p-3 mt-1 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                    {selectedLog.headers_info}
                  </pre>
                </div>
              )}

              {selectedLog.request_body && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Request Body</span>
                  <pre className="text-xs bg-gray-100 rounded-md p-3 mt-1 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                    {selectedLog.request_body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
