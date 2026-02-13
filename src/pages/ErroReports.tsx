import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useErroReports, ErroReportListItem } from '@/hooks/useErroReports';
import { ErroReportDetailsModal } from '@/components/modals/ErroReportDetailsModal';
import { Loader2, Bug, Search, Filter } from 'lucide-react';

const estadoLabels: Record<string, string> = {
  novo: 'Novo',
  em_analise: 'Em Análise',
  resolvido: 'Resolvido',
  rejeitado: 'Rejeitado',
};

const estadoBadgeVariant: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-800',
  em_analise: 'bg-yellow-100 text-yellow-800',
  resolvido: 'bg-green-100 text-green-800',
  rejeitado: 'bg-red-100 text-red-800',
};

const prioridadeLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

const prioridadeBadgeVariant: Record<string, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-600',
  alta: 'bg-orange-100 text-orange-600',
  critica: 'bg-red-100 text-red-600',
};

const filterTabs = [
  { value: '', label: 'Todos' },
  { value: 'novo', label: 'Novos' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'resolvido', label: 'Resolvidos' },
  { value: 'rejeitado', label: 'Rejeitados' },
];

export const ErroReports: React.FC = () => {
  const [estadoFilter, setEstadoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, isLoading } = useErroReports(estadoFilter || undefined);

  // Handle both admin response (object with items) and user response (array)
  const items: ErroReportListItem[] = Array.isArray(data) ? data : (data as any)?.items ?? [];

  const filteredItems = search
    ? items.filter(
        (r) =>
          r.descricao.toLowerCase().includes(search.toLowerCase()) ||
          (r.pagina && r.pagina.toLowerCase().includes(search.toLowerCase())) ||
          (r.funcionario_nome && r.funcionario_nome.toLowerCase().includes(search.toLowerCase()))
      )
    : items;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openDetails = (reportId: number) => {
    setSelectedReportId(reportId);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bug className="h-6 w-6" />
          Reportes de Erros
        </h1>
        <p className="text-gray-500 mt-1">Gestão de erros reportados pelos utilizadores</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-gray-400" />
              {filterTabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant={estadoFilter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEstadoFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar reportes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredItems.length} {filteredItems.length === 1 ? 'reporte' : 'reportes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum reporte encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead className="max-w-xs">Descrição</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((report) => (
                  <TableRow
                    key={report.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openDetails(report.id)}
                  >
                    <TableCell className="font-mono text-sm">#{report.id}</TableCell>
                    <TableCell className="text-sm">
                      {report.funcionario_nome || '—'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm truncate">{report.descricao}</p>
                      {report.num_anexos > 0 && (
                        <span className="text-xs text-gray-400">
                          {report.num_anexos} {report.num_anexos === 1 ? 'anexo' : 'anexos'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {report.pagina || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={estadoBadgeVariant[report.estado] || ''}>
                        {estadoLabels[report.estado] || report.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.prioridade && (
                        <Badge className={prioridadeBadgeVariant[report.prioridade] || ''}>
                          {prioridadeLabels[report.prioridade] || report.prioridade}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(report.criado_em)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ErroReportDetailsModal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        reportId={selectedReportId}
      />
    </div>
  );
};
