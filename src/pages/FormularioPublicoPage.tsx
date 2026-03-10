import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import axios from 'axios';

interface CampoConfig {
  nome: string;
  label: string;
  tipo: string;
  obrigatorio: boolean;
  opcoes?: string[];
  placeholder?: string;
}

interface FormData {
  titulo: string;
  descricao?: string;
  tipo: string;
  campos_config?: CampoConfig[];
}

function getApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  if (import.meta.env.DEV) return 'http://127.0.0.1:8000/api';
  return `${window.location.origin}/api`;
}

export const FormularioPublicoPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!token) return;
    const fetchForm = async () => {
      try {
        const { data } = await axios.get(`${getApiBase()}/formularios/publico/${token}`);
        setFormData(data);
        // Initialize values
        const init: Record<string, any> = {};
        data.campos_config?.forEach((c: CampoConfig) => {
          init[c.nome] = c.tipo === 'checkbox' ? false : '';
        });
        setValues(init);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Formulário não encontrado ou indisponível.');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [token]);

  const setValue = (nome: string, val: any) => {
    setValues(prev => ({ ...prev, [nome]: val }));
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !token) return;

    // Validate
    const errors: string[] = [];
    formData.campos_config?.forEach(c => {
      if (c.obrigatorio) {
        const v = values[c.nome];
        if (v === undefined || v === null || v === '' || v === false) {
          errors.push(c.label);
        }
      }
    });
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${getApiBase()}/formularios/publico/${token}`, { dados: values });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao submeter formulário.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-lg font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">Obrigado!</h2>
            <p className="text-muted-foreground">O seu formulário foi submetido com sucesso.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">{formData.titulo}</CardTitle>
            {formData.descricao && <CardDescription>{formData.descricao}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formData.campos_config?.map(campo => (
                <div key={campo.nome} className="space-y-1">
                  <Label>
                    {campo.label}
                    {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                  </Label>

                  {campo.tipo === 'text' && (
                    <Input
                      value={values[campo.nome] || ''}
                      onChange={e => setValue(campo.nome, e.target.value)}
                      placeholder={campo.placeholder}
                    />
                  )}

                  {campo.tipo === 'email' && (
                    <Input
                      type="email"
                      value={values[campo.nome] || ''}
                      onChange={e => setValue(campo.nome, e.target.value)}
                      placeholder={campo.placeholder || 'email@exemplo.pt'}
                    />
                  )}

                  {campo.tipo === 'tel' && (
                    <Input
                      type="tel"
                      value={values[campo.nome] || ''}
                      onChange={e => setValue(campo.nome, e.target.value)}
                      placeholder={campo.placeholder || '912 345 678'}
                    />
                  )}

                  {campo.tipo === 'number' && (
                    <Input
                      type="number"
                      value={values[campo.nome] || ''}
                      onChange={e => setValue(campo.nome, e.target.value)}
                    />
                  )}

                  {campo.tipo === 'date' && (
                    <Input
                      type="date"
                      value={values[campo.nome] || ''}
                      onChange={e => setValue(campo.nome, e.target.value)}
                    />
                  )}

                  {campo.tipo === 'textarea' && (
                    <Textarea
                      value={values[campo.nome] || ''}
                      onChange={e => setValue(campo.nome, e.target.value)}
                      placeholder={campo.placeholder}
                      rows={3}
                    />
                  )}

                  {campo.tipo === 'select' && campo.opcoes && (
                    <Select value={values[campo.nome] || ''} onValueChange={v => setValue(campo.nome, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {campo.opcoes.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {campo.tipo === 'checkbox' && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!!values[campo.nome]}
                        onCheckedChange={v => setValue(campo.nome, v)}
                      />
                      <span className="text-sm">{campo.placeholder || 'Sim'}</span>
                    </div>
                  )}
                </div>
              ))}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Campos obrigatórios em falta: {validationErrors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submeter
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Formulário seguro. Os seus dados serão tratados de acordo com o RGPD.
        </p>
      </div>
    </div>
  );
};
