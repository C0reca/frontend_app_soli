import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, Edit, AlertCircle } from 'lucide-react';
import { ProcessoTemplateCompleto, TemplateCampo, TemplatePasso } from '@/hooks/useProcessoTemplates';

// ── NIF validation (Portuguese) ─────────────────────────────────────────

function validarNIF(nif: string): boolean {
  if (!/^\d{9}$/.test(nif)) return false;
  const check = [9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += parseInt(nif[i]) * check[i];
  const mod = sum % 11;
  const control = mod < 2 ? 0 : 11 - mod;
  return control === parseInt(nif[8]);
}

function validarIBAN(iban: string): boolean {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return /^PT50\d{21}$/.test(clean);
}

// ── Types ───────────────────────────────────────────────────────────────

interface ProcessoWizardProps {
  isOpen: boolean;
  template: ProcessoTemplateCompleto;
  processoId?: number | null;
  initialData?: Record<string, any>;
  onConcluir: (dadosWizard: Record<string, any>) => void;
  onCancelar: () => void;
}

// ── Field renderer ──────────────────────────────────────────────────────

function WizardField({
  campo,
  value,
  error,
  onChange,
}: {
  campo: TemplateCampo;
  value: any;
  error?: string;
  onChange: (val: any) => void;
}) {
  const baseProps = {
    id: campo.campo_key,
    placeholder: campo.placeholder || '',
  };

  let input: React.ReactNode;

  switch (campo.tipo) {
    case 'textarea':
      input = <Textarea {...baseProps} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'numero':
      input = <Input {...baseProps} type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')} />;
      break;
    case 'data':
      input = <Input {...baseProps} type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'email':
      input = <Input {...baseProps} type="email" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'telefone':
      input = <Input {...baseProps} type="tel" value={value || ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'nif':
      input = <Input {...baseProps} maxLength={9} value={value || ''} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 9))} />;
      break;
    case 'iban':
      input = <Input {...baseProps} value={value || ''} onChange={(e) => onChange(e.target.value.toUpperCase())} placeholder="PT50..." />;
      break;
    case 'checkbox':
      input = (
        <div className="flex items-center gap-2 pt-2">
          <Checkbox checked={!!value} onCheckedChange={(v) => onChange(!!v)} id={campo.campo_key} />
          <label htmlFor={campo.campo_key} className="text-sm cursor-pointer">{campo.label}</label>
        </div>
      );
      break;
    case 'selecao':
      input = (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder={campo.placeholder || 'Selecionar...'} /></SelectTrigger>
          <SelectContent>
            {(campo.opcoes || []).map((o, i) => (
              <SelectItem key={i} value={o.valor}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      break;
    case 'multi_selecao':
      input = (
        <div className="space-y-1 pt-1">
          {(campo.opcoes || []).map((o, i) => {
            const selected = Array.isArray(value) ? value : [];
            return (
              <div key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={selected.includes(o.valor)}
                  onCheckedChange={(checked) => {
                    onChange(checked ? [...selected, o.valor] : selected.filter((v: string) => v !== o.valor));
                  }}
                />
                <span className="text-sm">{o.label}</span>
              </div>
            );
          })}
        </div>
      );
      break;
    case 'ficheiro':
      input = <Input {...baseProps} type="file" onChange={(e) => onChange(e.target.files?.[0]?.name || '')} />;
      break;
    default: // texto
      input = <Input {...baseProps} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
  }

  if (campo.tipo === 'checkbox') {
    return (
      <div>
        {input}
        {campo.tooltip && <p className="text-xs text-muted-foreground mt-0.5">{campo.tooltip}</p>}
        {error && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={campo.campo_key} className="text-sm">
        {campo.label}
        {campo.obrigatorio && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div className="mt-1">{input}</div>
      {campo.tooltip && <p className="text-xs text-muted-foreground mt-0.5">{campo.tooltip}</p>}
      {error && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

// ── Main Wizard ─────────────────────────────────────────────────────────

export function ProcessoWizard({
  isOpen,
  template,
  processoId,
  initialData,
  onConcluir,
  onCancelar,
}: ProcessoWizardProps) {
  const passos = template.passos || [];
  const totalSteps = passos.length + 1; // +1 for review step
  const [currentStep, setCurrentStep] = useState(0);
  const [dados, setDados] = useState<Record<string, any>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  // Reset when template changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setDados(initialData);
    }
  }, [initialData]);

  const updateField = useCallback((key: string, value: any) => {
    setDados(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // Validate current step
  const validateStep = useCallback((stepIndex: number): boolean => {
    if (stepIndex >= passos.length) return true; // review step
    const passo = passos[stepIndex];
    if (passo.opcional) return true;

    const newErrors: Record<string, string> = {};

    for (const campo of passo.campos) {
      const val = dados[campo.campo_key];

      if (campo.obrigatorio) {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[campo.campo_key] = 'Campo obrigatório';
          continue;
        }
      }

      if (val && campo.tipo === 'nif' && !validarNIF(val)) {
        newErrors[campo.campo_key] = 'NIF inválido';
      }
      if (val && campo.tipo === 'iban' && !validarIBAN(val)) {
        newErrors[campo.campo_key] = 'IBAN inválido (formato: PT50 + 21 dígitos)';
      }
      if (val && campo.tipo === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        newErrors[campo.campo_key] = 'Email inválido';
      }
      if (val && campo.validacao?.regex) {
        try {
          if (!new RegExp(campo.validacao.regex).test(val)) {
            newErrors[campo.campo_key] = campo.validacao.mensagem_erro || 'Formato inválido';
          }
        } catch { /* invalid regex in config */ }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [passos, dados]);

  const goNext = () => {
    if (!validateStep(currentStep)) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const goPrev = () => {
    setTouched(false);
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleConcluir = () => {
    onConcluir(dados);
  };

  const isReviewStep = currentStep >= passos.length;
  const currentPasso = isReviewStep ? null : passos[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancelar(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{template.nome}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Passo {currentStep + 1} de {totalSteps}
          </p>
        </DialogHeader>

        {/* Progress bar with step names */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex gap-1 overflow-x-auto">
            {passos.map((p, i) => (
              <button
                key={p.id}
                className={`text-xs px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                  i === currentStep ? 'bg-primary text-primary-foreground' :
                  i < currentStep ? 'bg-primary/20 text-primary cursor-pointer' :
                  'bg-muted text-muted-foreground'
                }`}
                onClick={() => { if (i < currentStep) { setCurrentStep(i); setErrors({}); } }}
                disabled={i > currentStep}
              >
                {p.titulo}
              </button>
            ))}
            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
              isReviewStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              Revisão
            </span>
          </div>
        </div>

        <Separator />

        {/* Step content */}
        {currentPasso && (
          <div className="space-y-4">
            <h3 className="font-medium">{currentPasso.titulo}</h3>
            {currentPasso.descricao && (
              <p className="text-sm text-muted-foreground">{currentPasso.descricao}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPasso.campos.map(campo => (
                <div key={campo.id} className={campo.tipo === 'textarea' ? 'col-span-full' : ''}>
                  <WizardField
                    campo={campo}
                    value={dados[campo.campo_key]}
                    error={touched ? errors[campo.campo_key] : undefined}
                    onChange={(val) => updateField(campo.campo_key, val)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review step */}
        {isReviewStep && (
          <div className="space-y-4">
            <h3 className="font-medium">Revisão dos dados</h3>
            <p className="text-sm text-muted-foreground">Verifique os dados antes de concluir.</p>
            {passos.map((passo, i) => {
              const filledCampos = passo.campos.filter(c => {
                const v = dados[c.campo_key];
                return v !== undefined && v !== null && v !== '';
              });
              if (!filledCampos.length && passo.opcional) return null;
              return (
                <Card key={passo.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{passo.titulo}</CardTitle>
                      <Button size="sm" variant="ghost" onClick={() => { setCurrentStep(i); setErrors({}); }}>
                        <Edit className="h-3 w-3 mr-1" /> Editar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {passo.campos.map(campo => {
                        const val = dados[campo.campo_key];
                        const display = val === undefined || val === null || val === ''
                          ? '—'
                          : Array.isArray(val) ? val.join(', ')
                          : typeof val === 'boolean' ? (val ? 'Sim' : 'Não')
                          : String(val);
                        return (
                          <div key={campo.id}>
                            <span className="text-muted-foreground">{campo.label}:</span>{' '}
                            <span className="font-medium">{display}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goPrev} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>
            {isReviewStep ? (
              <Button onClick={handleConcluir}>
                <Check className="h-4 w-4 mr-1" /> Concluir
              </Button>
            ) : (
              <Button onClick={goNext}>
                Seguinte <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
