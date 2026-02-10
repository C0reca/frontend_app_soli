import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

export const AdminImport: React.FC = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'clientes' | 'processos' | 'tarefas' | 'registos'>('clientes');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const appFieldsByType = useMemo(() => {
    if (type === 'clientes') {
      return [
        'tipo','nome','email','telefone','morada','codigo_postal','localidade','distrito','pais',
        'nif','data_nascimento','estado_civil','profissao','num_cc','validade_cc','num_ss','num_sns','num_ident_civil','nacionalidade',
        'nome_empresa','nif_empresa','forma_juridica','data_constituicao','registo_comercial','cae','capital_social',
        'representante_nome','representante_nif','representante_email','representante_telemovel','representante_cargo',
        'iban','certidao_permanente','observacoes'
      ];
    }
    if (type === 'processos') {
      return ['titulo','descricao','estado','cliente_nif','funcionario_email','criado_em','tipo'];
    }
    if (type === 'tarefas') {
      return ['titulo','descricao','processo_titulo','responsavel_email','autor_email','prioridade','tipo','data_fim','concluida','parent_titulo'];
    }
    return ['numero_processo','cliente_nif','predio','freguesia','registo','conservatoria','requisicao','apresentacao','data','apresentacao_complementar','data_criacao','outras_observacoes','estado'];
  }, [type]);

  const handlePreview = async () => {
    if (!file) {
      toast({ title: 'Selecione um ficheiro CSV', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append('file', file);
      const response = await api.post('/admin/import/preview/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPreview(response.data);
      setResult(null);
      // criar mapeamento inicial 1:1 por header normalizado
      const initial: Record<string,string> = {};
      response.data.headers_raw.forEach((hr: string, idx: number) => {
        const normalized = response.data.headers_normalized[idx];
        initial[normalized] = appFieldsByType.includes(normalized) ? normalized : '';
      });
      setMapping(initial);
      toast({ title: 'Pré-visualização carregada' });
    } catch (e: any) {
      toast({ title: 'Erro na pré-visualização', description: e?.response?.data?.detail || 'Falha ao ler CSV', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: 'Selecione um ficheiro CSV', variant: 'destructive' });
      return;
    }
    if (!preview) {
      toast({ title: 'Faça primeiro a pré-visualização', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append('file', file);
      if (mapping && Object.keys(mapping).length) {
        form.append('mapping', JSON.stringify(mapping));
      }
      let url = '';
      if (type === 'clientes') url = '/admin/import/clientes/';
      if (type === 'processos') url = '/admin/import/processos/';
      if (type === 'tarefas') url = '/admin/import/tarefas/';
      if (type === 'registos') url = '/admin/import/registos/';
      const response = await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(response.data);
      toast({ title: 'Importação concluída' });
    } catch (e: any) {
      toast({ title: 'Erro na importação', description: e?.response?.data?.detail || 'Falha ao importar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin • Importação CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <select className="border rounded px-3 py-2" value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="clientes">Clientes</option>
              <option value="processos">Processos</option>
              <option value="tarefas">Tarefas</option>
              <option value="registos">Registos Prediais</option>
            </select>
            <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button variant="secondary" onClick={handlePreview} disabled={loading}>{loading ? 'A carregar...' : 'Pré-visualizar'}</Button>
            <Button onClick={handleUpload} disabled={loading || !preview}>{loading ? 'A importar...' : 'Importar'}</Button>
          </div>

          {preview && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Foram detetados {preview.row_count} registos. Revise a amostra e ajuste o mapeamento antes de importar.</p>
              <div className="overflow-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      {preview.headers_raw.map((h: string, idx: number) => (
                        <th key={idx} className="px-2 py-1 text-left align-bottom">
                          <div className="font-medium">{h}</div>
                          <div className="mt-1">
                            <select
                              className="border rounded px-1 py-1 text-xs"
                              value={mapping[preview.headers_normalized[idx]] ?? ''}
                              onChange={(e) => {
                                const norm = preview.headers_normalized[idx];
                                setMapping((prev) => ({ ...prev, [norm]: e.target.value }));
                              }}
                            >
                              <option value="">— Ignorar —</option>
                              {appFieldsByType.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_rows.map((r: string[], rIdx: number) => (
                      <tr key={rIdx} className="border-t">
                        {r.map((c: string, cIdx: number) => (
                          <td key={cIdx} className="px-2 py-1 whitespace-pre">{c}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result && (
            <div className="text-sm">
              <p><strong>Total:</strong> {result.total}</p>
              <p><strong>Importados:</strong> {result.importados}</p>
              <p><strong>Atualizados:</strong> {result.atualizados}</p>
              {Array.isArray(result.erros) && result.erros.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Erros:</p>
                  <ul className="list-disc pl-5">
                    {result.erros.slice(0, 20).map((err: any, idx: number) => (
                      <li key={idx}>Linha {err.linha}: {err.erro}</li>
                    ))}
                  </ul>
                  {result.erros.length > 20 && <p>... e mais {result.erros.length - 20}</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImport;


