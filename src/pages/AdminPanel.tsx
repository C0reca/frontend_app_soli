import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Database, Shield, Upload, FolderOpen, Hash, Bell, Trash2, DatabaseZap, Mail, Eye, EyeOff, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ActionResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export const AdminPanel: React.FC = () => {
  const { toast } = useToast();
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ActionResult | null>(null);

  // ── CSV Import state ──────────────────────────────────────────────────
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvType, setCsvType] = useState<'clientes' | 'processos' | 'tarefas' | 'registos'>('clientes');
  const [csvResult, setCsvResult] = useState<any>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});

  const appFieldsByType = useMemo(() => {
    if (csvType === 'clientes') {
      return [
        'tipo','nome','email','telefone','morada','codigo_postal','localidade','distrito','pais',
        'nif','data_nascimento','estado_civil','profissao','num_cc','validade_cc','num_ss','num_sns','num_ident_civil','nacionalidade',
        'nome_empresa','nif_empresa','forma_juridica','data_constituicao','registo_comercial','cae','capital_social',
        'representante_nome','representante_nif','representante_email','representante_telemovel','representante_cargo',
        'iban','certidao_permanente','observacoes'
      ];
    }
    if (csvType === 'processos') {
      return ['titulo','descricao','estado','cliente_nif','funcionario_email','criado_em','tipo'];
    }
    if (csvType === 'tarefas') {
      return ['titulo','descricao','processo_titulo','responsavel_email','autor_email','prioridade','tipo','data_fim','concluida','parent_titulo'];
    }
    return ['numero_processo','cliente_nif','predio','freguesia','registo','conservatoria','requisicao','apresentacao','data','apresentacao_complementar','data_criacao','outras_observacoes','estado'];
  }, [csvType]);

  // ── Admin actions ─────────────────────────────────────────────────────
  const runAction = async (actionKey: string, endpoint: string, method: 'post' | 'get' | 'delete' = 'post') => {
    setConfirmAction(null);
    setLoading(actionKey);
    setLastResult(null);
    try {
      const res = method === 'post' ? await api.post(endpoint) : method === 'delete' ? await api.delete(endpoint) : await api.get(endpoint);
      const data = res.data;
      const msg = data.msg || data.detail || data.mensagem || 'Operação concluída com sucesso.';
      setLastResult({
        success: true,
        message: typeof msg === 'string' ? msg : JSON.stringify(msg),
        details: data,
      });
      toast({ title: 'Sucesso', description: typeof msg === 'string' ? msg : 'Operação concluída.' });
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Erro ao executar operação.';
      setLastResult({
        success: false,
        message: typeof detail === 'string' ? detail : JSON.stringify(detail),
      });
      toast({ title: 'Erro', description: typeof detail === 'string' ? detail : 'Erro ao executar.', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      key: 'sync-subtarefas',
      title: 'Sincronizar Sub-Compromissos',
      description: 'Atualiza o processo e entidade de todos os sub-compromissos para herdar do compromisso mãe. Útil após migração ou correção de dados.',
      icon: RefreshCw,
      endpoint: '/tarefas/admin/sync-subtarefas',
      method: 'post' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
    },
    {
      key: 'atribuir-dossies',
      title: 'Atribuir Dossiês a Processos',
      description: 'Atribui automaticamente o dossiê a todos os processos que têm entidade com dossiê existente. Mostra entidades sem dossiê.',
      icon: FolderOpen,
      endpoint: '/processos/atribuir-dossies',
      method: 'post' as const,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
    },
    {
      key: 'migrar-referencias',
      title: 'Migrar Referências de Processos',
      description: 'Atribui número sequencial (numero_no_dossie) a processos que ainda não têm referência. Agrupa por dossiê e ordena por data de criação.',
      icon: Hash,
      endpoint: '/processos/migrar-referencias',
      method: 'post' as const,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
    },
    {
      key: 'verificar-prazos',
      title: 'Verificar Prazos de Compromissos',
      description: 'Verifica compromissos com prazos próximos e cria notificações para os responsáveis. Pode ser executado periodicamente.',
      icon: Bell,
      endpoint: '/notificacoes/verificar-prazos',
      method: 'post' as const,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
    },
    {
      key: 'limpar-notificacoes',
      title: 'Limpar Notificações Antigas',
      description: 'Remove notificações já lidas com mais de 90 dias. Ajuda a manter a base de dados limpa.',
      icon: Trash2,
      endpoint: '/notificacoes/limpar-antigas',
      method: 'delete' as const,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
    },
    {
      key: 'migrar-tipo-enum',
      title: 'Migrar Tipos de Compromisso (BD)',
      description: 'Adiciona novos tipos (ex: Correspondência CTT) ao enum da base de dados. Seguro para executar várias vezes.',
      icon: DatabaseZap,
      endpoint: '/tarefas/admin/migrar-tipo-enum',
      method: 'post' as const,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
    },
  ];

  // ── CSV handlers ──────────────────────────────────────────────────────
  const handleCsvPreview = async () => {
    if (!csvFile) {
      toast({ title: 'Selecione um ficheiro CSV', variant: 'destructive' });
      return;
    }
    try {
      setCsvLoading(true);
      const form = new FormData();
      form.append('file', csvFile);
      const response = await api.post('/admin/import/preview', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCsvPreview(response.data);
      setCsvResult(null);
      const initial: Record<string, string> = {};
      response.data.headers_raw.forEach((_: string, idx: number) => {
        const normalized = response.data.headers_normalized[idx];
        initial[normalized] = appFieldsByType.includes(normalized) ? normalized : '';
      });
      setCsvMapping(initial);
      toast({ title: 'Pré-visualização carregada' });
    } catch (e: any) {
      toast({ title: 'Erro na pré-visualização', description: e?.response?.data?.detail || 'Falha ao ler CSV', variant: 'destructive' });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast({ title: 'Selecione um ficheiro CSV', variant: 'destructive' });
      return;
    }
    if (!csvPreview) {
      toast({ title: 'Faça primeiro a pré-visualização', variant: 'destructive' });
      return;
    }
    try {
      setCsvLoading(true);
      const form = new FormData();
      form.append('file', csvFile);
      if (csvMapping && Object.keys(csvMapping).length) {
        form.append('mapping', JSON.stringify(csvMapping));
      }
      const urlMap: Record<string, string> = {
        clientes: '/admin/import/clientes',
        processos: '/admin/import/processos',
        tarefas: '/admin/import/tarefas',
        registos: '/admin/import/registos',
      };
      const response = await api.post(urlMap[csvType], form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCsvResult(response.data);
      toast({ title: 'Importação concluída' });
    } catch (e: any) {
      toast({ title: 'Erro na importação', description: e?.response?.data?.detail || 'Falha ao importar', variant: 'destructive' });
    } finally {
      setCsvLoading(false);
    }
  };

  // ── SMTP Config state ────────────────────────────────────────────────
  const [smtp, setSmtp] = useState({ smtp_host: '', smtp_port: 587, smtp_user: '', smtp_pass: '', smtp_from_email: '' });
  const [smtpPassSet, setSmtpPassSet] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpLoaded, setSmtpLoaded] = useState(false);

  useEffect(() => {
    const loadSmtp = async () => {
      try {
        const res = await api.get('/definicoes-sistema/smtp');
        const d = res.data;
        setSmtp({
          smtp_host: d.smtp_host || '',
          smtp_port: d.smtp_port || 587,
          smtp_user: d.smtp_user || '',
          smtp_pass: '',
          smtp_from_email: d.smtp_from_email || '',
        });
        setSmtpPassSet(d.smtp_pass_set);
        setSmtpLoaded(true);
      } catch {
        // silently fail — user may not have access or endpoint not deployed yet
      }
    };
    loadSmtp();
  }, []);

  const handleSmtpSave = async () => {
    setSmtpLoading(true);
    try {
      const payload: any = {
        smtp_host: smtp.smtp_host,
        smtp_port: smtp.smtp_port,
        smtp_user: smtp.smtp_user,
        smtp_from_email: smtp.smtp_from_email,
      };
      // Only send password if user typed something new
      if (smtp.smtp_pass) {
        payload.smtp_pass = smtp.smtp_pass;
      }
      const res = await api.put('/definicoes-sistema/smtp', payload);
      setSmtpPassSet(res.data.smtp_pass_set);
      setSmtp(prev => ({ ...prev, smtp_pass: '' }));
      toast({ title: 'Configuração SMTP guardada' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.response?.data?.detail || 'Falha ao guardar', variant: 'destructive' });
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleSmtpTest = async () => {
    setSmtpTesting(true);
    try {
      const res = await api.post('/definicoes-sistema/smtp/testar');
      if (res.data.success) {
        toast({ title: 'Teste SMTP', description: res.data.message });
      } else {
        toast({ title: 'Teste falhou', description: res.data.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.response?.data?.detail || 'Falha no teste', variant: 'destructive' });
    } finally {
      setSmtpTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel de Administração</h1>
          <p className="text-gray-600">Ferramentas de gestão e manutenção do sistema</p>
        </div>
      </div>

      {/* Action Result */}
      {lastResult && (
        <Card className={lastResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {lastResult.success
                ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                : <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              }
              <div>
                <p className="font-medium">{lastResult.success ? 'Sucesso' : 'Erro'}</p>
                <p className="text-sm mt-1">{lastResult.message}</p>
                {lastResult.details && lastResult.success && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-3 flex-wrap">
                      {Object.entries(lastResult.details)
                        .filter(([k]) => !['msg', 'detail', 'mensagem'].includes(k))
                        .filter(([, v]) => !Array.isArray(v) && typeof v !== 'object')
                        .map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                    </div>
                    {Object.entries(lastResult.details)
                      .filter(([, v]) => Array.isArray(v) && v.length > 0)
                      .map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <p className="font-medium mt-1">{key} ({(value as any[]).length}):</p>
                          <ul className="list-disc pl-5 text-xs max-h-40 overflow-auto">
                            {(value as any[]).slice(0, 30).map((item: any, idx: number) => (
                              <li key={idx}>
                                {typeof item === 'string' ? item : item.nome || item.nome_empresa || item.erro || JSON.stringify(item)}
                              </li>
                            ))}
                            {(value as any[]).length > 30 && <li>... e mais {(value as any[]).length - 30}</li>}
                          </ul>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setLastResult(null)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manutenção de Dados
          </CardTitle>
          <CardDescription>Operações de correção e sincronização de dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.key}
              className={`flex items-center justify-between rounded-lg border p-4 ${action.bgColor}`}
            >
              <div className="flex items-start gap-3">
                <action.icon className={`h-5 w-5 mt-0.5 ${action.color}`} />
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setConfirmAction(action.key)}
                disabled={loading === action.key}
              >
                {loading === action.key ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A executar...</>
                ) : (
                  'Executar'
                )}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CSV Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação CSV
          </CardTitle>
          <CardDescription>Importar dados em massa a partir de ficheiros CSV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center flex-wrap">
            <select
              className="border rounded px-3 py-2 text-sm"
              value={csvType}
              onChange={(e) => {
                setCsvType(e.target.value as any);
                setCsvPreview(null);
                setCsvResult(null);
                setCsvMapping({});
              }}
            >
              <option value="clientes">Clientes</option>
              <option value="processos">Processos</option>
              <option value="tarefas">Tarefas</option>
              <option value="registos">Registos Prediais</option>
            </select>
            <input
              type="file"
              accept=".csv,text/csv"
              className="text-sm"
              onChange={(e) => {
                setCsvFile(e.target.files?.[0] || null);
                setCsvPreview(null);
                setCsvResult(null);
              }}
            />
            <Button variant="secondary" size="sm" onClick={handleCsvPreview} disabled={csvLoading}>
              {csvLoading ? 'A carregar...' : 'Pré-visualizar'}
            </Button>
            <Button size="sm" onClick={handleCsvUpload} disabled={csvLoading || !csvPreview}>
              {csvLoading ? 'A importar...' : 'Importar'}
            </Button>
          </div>

          {csvPreview && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Foram detetados {csvPreview.row_count} registos. Revise a amostra e ajuste o mapeamento antes de importar.
              </p>
              <div className="overflow-auto border rounded max-h-[400px]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      {csvPreview.headers_raw.map((h: string, idx: number) => (
                        <th key={idx} className="px-2 py-1 text-left align-bottom border-b">
                          <div className="font-medium">{h}</div>
                          <div className="mt-1">
                            <select
                              className="border rounded px-1 py-1 text-xs w-full"
                              value={csvMapping[csvPreview.headers_normalized[idx]] ?? ''}
                              onChange={(e) => {
                                const norm = csvPreview.headers_normalized[idx];
                                setCsvMapping((prev) => ({ ...prev, [norm]: e.target.value }));
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
                    {csvPreview.sample_rows.map((r: string[], rIdx: number) => (
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

          {csvResult && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 text-sm">
                <p><strong>Total:</strong> {csvResult.total}</p>
                <p><strong>Importados:</strong> {csvResult.importados}</p>
                <p><strong>Atualizados:</strong> {csvResult.atualizados}</p>
                {Array.isArray(csvResult.erros) && csvResult.erros.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-700">Erros:</p>
                    <ul className="list-disc pl-5 text-red-600">
                      {csvResult.erros.slice(0, 20).map((err: any, idx: number) => (
                        <li key={idx}>Linha {err.linha}: {err.erro}</li>
                      ))}
                    </ul>
                    {csvResult.erros.length > 20 && <p className="text-red-600">... e mais {csvResult.erros.length - 20}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      {smtpLoaded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Servidor de Email (SMTP)
            </CardTitle>
            <CardDescription>Configuração do servidor para envio de emails de cobrança e lembretes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">Servidor SMTP *</Label>
                <Input
                  id="smtp_host"
                  value={smtp.smtp_host}
                  onChange={(e) => setSmtp(prev => ({ ...prev, smtp_host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">Porta</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={smtp.smtp_port}
                  onChange={(e) => setSmtp(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                  placeholder="587"
                />
                <p className="text-xs text-muted-foreground">587 (STARTTLS) ou 465 (SSL)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_user">Utilizador / Email</Label>
                <Input
                  id="smtp_user"
                  value={smtp.smtp_user}
                  onChange={(e) => setSmtp(prev => ({ ...prev, smtp_user: e.target.value }))}
                  placeholder="user@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_pass">
                  Password {smtpPassSet && !smtp.smtp_pass && <Badge variant="secondary" className="ml-2 text-xs">Definida</Badge>}
                </Label>
                <div className="relative">
                  <Input
                    id="smtp_pass"
                    type={showSmtpPass ? 'text' : 'password'}
                    value={smtp.smtp_pass}
                    onChange={(e) => setSmtp(prev => ({ ...prev, smtp_pass: e.target.value }))}
                    placeholder={smtpPassSet ? '••••••••  (deixe vazio para manter)' : 'Password SMTP'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                  >
                    {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="smtp_from">Email Remetente *</Label>
                <Input
                  id="smtp_from"
                  type="email"
                  value={smtp.smtp_from_email}
                  onChange={(e) => setSmtp(prev => ({ ...prev, smtp_from_email: e.target.value }))}
                  placeholder="noreply@exemplo.com"
                />
                <p className="text-xs text-muted-foreground">Endereço que aparece como remetente nos emails enviados</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSmtpSave} disabled={smtpLoading}>
                {smtpLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A guardar...</> : 'Guardar Configuração'}
              </Button>
              <Button variant="outline" onClick={handleSmtpTest} disabled={smtpTesting || !smtp.smtp_host}>
                {smtpTesting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A testar...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Enviar Email de Teste</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar operação</DialogTitle>
            <DialogDescription>
              {confirmAction && (
                <>Tem a certeza que deseja executar: <strong>{actions.find(a => a.key === confirmAction)?.title}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                const action = actions.find(a => a.key === confirmAction);
                if (action) runAction(action.key, action.endpoint, action.method);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
