import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Car, LogOut, Loader2, Plus, Package, Calendar, DollarSign, Paperclip, Upload, Download, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

// Standalone API client for portal (separate from main app's api.ts)
function getPortalApi() {
  const base = import.meta.env.DEV
    ? 'http://127.0.0.1:8000/api'
    : `${window.location.origin}/api`;
  const instance = axios.create({ baseURL: base });
  instance.interceptors.request.use(config => {
    const token = localStorage.getItem('stand_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Strip trailing slash
    if (config.url && config.url.length > 1 && config.url.endsWith('/')) {
      config.url = config.url.slice(0, -1);
    }
    return config;
  });
  instance.interceptors.response.use(r => r, err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('stand_token');
      localStorage.removeItem('stand_user');
      window.location.reload();
    }
    return Promise.reject(err);
  });
  return instance;
}

const portalApi = getPortalApi();

interface StandPortalUser {
  id: number;
  nome: string;
  email: string;
  stand_entidade_id: number;
  stand_nome?: string;
}

// ========== LOGIN ==========
const StandLogin: React.FC<{ onLogin: (user: StandPortalUser) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await portalApi.post('/portal-stand/login', { email, password });
      localStorage.setItem('stand_token', data.access_token);
      localStorage.setItem('stand_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Car className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Portal do Stand</CardTitle>
          <CardDescription>Aceda à sua área de registos automóveis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@stand.pt" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ========== DASHBOARD ==========
const StandDashboard: React.FC<{ user: StandPortalUser; onLogout: () => void }> = ({ user, onLogout }) => {
  const [semanas, setSemanas] = useState<any[]>([]);
  const [registos, setRegistos] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [pedidoOpen, setPedidoOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [anexos, setAnexos] = useState<Record<number, any[]>>({});
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [semanasRes, registosRes] = await Promise.all([
        portalApi.get('/portal-stand/semanas'),
        portalApi.get('/portal-stand/registos?limit=50'),
      ]);
      setSemanas(semanasRes.data);
      setRegistos(registosRes.data);
    } catch { /* handled by interceptor */ }
    setLoading(false);
  }, []);

  const fetchAnexos = useCallback(async (registoId: number) => {
    try {
      const { data } = await portalApi.get(`/portal-stand/registos/${registoId}/anexos`);
      setAnexos(prev => ({ ...prev, [registoId]: data }));
    } catch { /* ignore */ }
  }, []);

  const handleExpand = (registoId: number) => {
    if (expandedId === registoId) {
      setExpandedId(null);
    } else {
      setExpandedId(registoId);
      if (!anexos[registoId]) fetchAnexos(registoId);
    }
  };

  const handleUpload = async (registoId: number, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await portalApi.post(`/portal-stand/registos/${registoId}/anexo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchAnexos(registoId);
    } catch { /* handled by interceptor */ }
    setUploading(false);
  };

  const handleDeleteAnexo = async (registoId: number, anexoId: number) => {
    if (!confirm('Eliminar este documento?')) return;
    try {
      await portalApi.delete(`/portal-stand/registos/${registoId}/anexo/${anexoId}`);
      await fetchAnexos(registoId);
    } catch { /* ignore */ }
  };

  const handleDownload = async (registoId: number, anexoId: number, nomeOriginal: string) => {
    try {
      const { data } = await portalApi.get(
        `/portal-stand/registos/${registoId}/anexo/${anexoId}/download`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeOriginal;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { /* handled by interceptor */ }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-PT');
  };

  const formatMoney = (v?: number | string) => {
    if (v == null) return '-';
    return `${Number(v).toFixed(2)} €`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const semanaAberta = semanas.find(s => s.estado === 'aberta');
  const totalPendente = registos.items.filter(r => r.estado_pagamento === 'pendente').length;
  const totalPago = registos.items.filter(r => r.estado_pagamento === 'pago').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="font-bold text-lg">Portal do Stand</h1>
            <p className="text-sm text-muted-foreground">{user.stand_nome || user.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.nome}</span>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-600">
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{registos.total}</p>
                <p className="text-sm text-muted-foreground">Total Registos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalPendente}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{semanas.length}</p>
                <p className="text-sm text-muted-foreground">Semanas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {semanaAberta && (
          <Alert>
            <AlertDescription>
              Semana aberta: <strong>{formatDate(semanaAberta.semana_inicio)} — {formatDate(semanaAberta.semana_fim)}</strong> ({semanaAberta.registos_count} registos)
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button onClick={() => setPedidoOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Pedido de Registo
          </Button>
        </div>

        <Tabs defaultValue="registos">
          <TabsList>
            <TabsTrigger value="registos">Registos ({registos.total})</TabsTrigger>
            <TabsTrigger value="semanas">Semanas ({semanas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="registos">
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registos.items.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sem registos</TableCell></TableRow>
                  ) : (
                    registos.items.map((r: any) => (
                      <React.Fragment key={r.id}>
                        <TableRow className="cursor-pointer hover:bg-slate-50" onClick={() => handleExpand(r.id)}>
                          <TableCell className="font-mono font-medium">{r.matricula || '-'}</TableCell>
                          <TableCell>{r.marca || '-'}</TableCell>
                          <TableCell className="text-sm">{r.sa_nome || '-'}</TableCell>
                          <TableCell className="text-sm">{formatMoney(r.valor)}</TableCell>
                          <TableCell>
                            <Badge variant={r.estado_pagamento === 'pago' ? 'default' : 'secondary'}>
                              {r.estado_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                              <Paperclip className="h-3.5 w-3.5" />
                              {expandedId === r.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(r.data_criacao)}</TableCell>
                        </TableRow>
                        {expandedId === r.id && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-slate-50 p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" /> Documentos
                                  </h4>
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload(r.id, file);
                                        e.target.value = '';
                                      }}
                                    />
                                    <Button variant="outline" size="sm" className="gap-1.5" asChild disabled={uploading}>
                                      <span>
                                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                                        Anexar Documento
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                                {(anexos[r.id] || []).length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {(anexos[r.id] || []).map((a: any) => (
                                      <div key={a.id} className="flex items-center justify-between bg-white rounded border px-3 py-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                          <span className="text-sm truncate">{a.nome_original}</span>
                                          <Badge variant="outline" className="text-[10px] shrink-0">{a.tipo}</Badge>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => handleDownload(r.id, a.id, a.nome_original)}
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                            onClick={() => handleDeleteAnexo(r.id, a.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="semanas">
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Registos</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {semanas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem semanas</TableCell></TableRow>
                  ) : (
                    semanas.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{formatDate(s.semana_inicio)} — {formatDate(s.semana_fim)}</TableCell>
                        <TableCell>{s.registos_count ?? '-'}</TableCell>
                        <TableCell className="text-sm">{s.total ? formatMoney(s.total) : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={s.estado === 'fechada' ? 'default' : 'secondary'}>
                            {s.estado === 'fechada' ? 'Fechada' : 'Aberta'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(s.data_fecho)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <NovoPedidoDialog open={pedidoOpen} onOpenChange={setPedidoOpen} onSuccess={fetchData} />
    </div>
  );
};

// ========== NOVO PEDIDO DIALOG ==========
const NovoPedidoDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; onSuccess: () => void }> = ({ open, onOpenChange, onSuccess }) => {
  const [form, setForm] = useState({
    matricula: '', marca: '',
    sa_nome: '', sa_nif: '', sa_morada: '', sa_email: '', sa_telemovel: '',
    sp_nome: '', sp_nif: '', sp_morada: '', sp_email: '', sp_telemovel: '',
    outras_observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await portalApi.post('/portal-stand/pedidos', form);
      setForm({ matricula: '', marca: '', sa_nome: '', sa_nif: '', sa_morada: '', sa_email: '', sa_telemovel: '', sp_nome: '', sp_nif: '', sp_morada: '', sp_email: '', sp_telemovel: '', outras_observacoes: '' });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao submeter');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Pedido de Registo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Matrícula</Label>
              <Input value={form.matricula} onChange={e => set('matricula', e.target.value)} placeholder="AA-00-BB" />
            </div>
            <div>
              <Label>Marca</Label>
              <Input value={form.marca} onChange={e => set('marca', e.target.value)} />
            </div>
          </div>

          <h4 className="font-medium text-sm pt-2">Comprador (Sujeito Ativo)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={form.sa_nome} onChange={e => set('sa_nome', e.target.value)} /></div>
            <div><Label>NIF</Label><Input value={form.sa_nif} onChange={e => set('sa_nif', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.sa_email} onChange={e => set('sa_email', e.target.value)} /></div>
            <div><Label>Telemóvel</Label><Input value={form.sa_telemovel} onChange={e => set('sa_telemovel', e.target.value)} /></div>
          </div>
          <div><Label>Morada</Label><Input value={form.sa_morada} onChange={e => set('sa_morada', e.target.value)} /></div>

          <h4 className="font-medium text-sm pt-2">Vendedor (Sujeito Passivo)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={form.sp_nome} onChange={e => set('sp_nome', e.target.value)} /></div>
            <div><Label>NIF</Label><Input value={form.sp_nif} onChange={e => set('sp_nif', e.target.value)} /></div>
            <div><Label>Email</Label><Input value={form.sp_email} onChange={e => set('sp_email', e.target.value)} /></div>
            <div><Label>Telemóvel</Label><Input value={form.sp_telemovel} onChange={e => set('sp_telemovel', e.target.value)} /></div>
          </div>
          <div><Label>Morada</Label><Input value={form.sp_morada} onChange={e => set('sp_morada', e.target.value)} /></div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.outras_observacoes} onChange={e => set('outras_observacoes', e.target.value)} rows={3} />
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'A submeter...' : 'Submeter Pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========== MAIN COMPONENT ==========
export const PortalStand: React.FC = () => {
  const [user, setUser] = useState<StandPortalUser | null>(() => {
    try {
      const stored = localStorage.getItem('stand_user');
      const token = localStorage.getItem('stand_token');
      if (stored && token) return JSON.parse(stored);
    } catch {}
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('stand_token');
    localStorage.removeItem('stand_user');
    setUser(null);
  };

  if (!user) return <StandLogin onLogin={setUser} />;
  return <StandDashboard user={user} onLogout={handleLogout} />;
};
