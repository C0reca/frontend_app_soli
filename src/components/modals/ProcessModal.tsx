import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProcesses, Process } from "@/hooks/useProcesses";
import { useClients } from "@/hooks/useClients";
import { useEmployeeList } from "@/hooks/useEmployees";
import { useDossies } from "@/hooks/useDossies";
import { useTiposProcesso, useTipoProcesso, TipoProcessoSimple, WizardConfig, WizardStepConfig, CustomFieldDef } from "@/hooks/useTiposProcesso";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ClientCombobox } from "@/components/ui/clientcombobox";
import { Loader2, Minimize2, ChevronRight, ChevronLeft, Plus, X, ScanSearch, ChevronDown } from "lucide-react";
import { useMinimize } from '@/contexts/MinimizeContext';
import { useExtracaoStatus, useExtrairDocumento } from '@/hooks/useExtracaoDocumento';
import { ExtracaoUploadZone } from '@/components/extraction/ExtracaoUploadZone';

const PROCESS_TYPES_STORAGE_KEY = "app-soli-process-types";
const PROCESS_TYPES_HIDDEN_KEY = "app-soli-process-types-hidden";

const DEFAULT_PROCESS_TYPES = [
    "Registo Predial",
    "Registo Comercial",
    "Registo Automóvel",
    "DPA",
    "RCBE",
    "Imposto de Selo Óbito",
    "Habilitação de Herdeiros",
    "Testamento",
    "AT",
    "Procurações",
    "Tribunal",
    "Notário",
];

function loadCustomTypes(): string[] {
    try {
        const raw = localStorage.getItem(PROCESS_TYPES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveCustomTypes(list: string[]) {
    try {
        localStorage.setItem(PROCESS_TYPES_STORAGE_KEY, JSON.stringify(list));
    } catch {
        //
    }
}

function loadHiddenTypes(): string[] {
    try {
        const raw = localStorage.getItem(PROCESS_TYPES_HIDDEN_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveHiddenTypes(list: string[]) {
    try {
        localStorage.setItem(PROCESS_TYPES_HIDDEN_KEY, JSON.stringify(list));
    } catch {
        //
    }
}

// Schema base - cliente_id é opcional para edição
const processSchemaBase = z.object({
    titulo: z.string().min(1, "Título é obrigatório"),
    descricao: z.string().optional(),
    tipo: z.string().optional(),
    onde_estao: z.string().optional(),
    cliente_id: z.number().optional(),
    dossie_id: z.number().optional(),
    funcionario_id: z.number().optional(),
    titular_id: z.number().optional().nullable(),
    tipo_processo_id: z.number().optional().nullable(),
    parent_processo_id: z.number().optional().nullable(),
    estado: z.enum(["pendente", "em_curso", "concluido"]).default("pendente"),
    valor: z.coerce.number().nullable().optional(),
});

// Schema para criação - cliente_id é obrigatório
const processSchemaCreate = processSchemaBase.extend({
    cliente_id: z.number({ required_error: "Entidade principal é obrigatória" }),
});

// Schema para edição - cliente_id é opcional
const processSchemaUpdate = processSchemaBase;

type ProcessFormData = z.infer<typeof processSchemaBase>;

interface ProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    process?: Process | null;
    initialData?: Partial<ProcessFormData> | null;
}

export const ProcessModal: React.FC<ProcessModalProps> = ({
                                                              isOpen,
                                                              onClose,
                                                              process,
                                                              initialData = null,
                                                          }) => {
    const { createProcess, updateProcess } = useProcesses();
    const { clients = [], isLoading: isClientsLoading } = useClients();
    const { data: employees = [], isLoading: isEmployeesLoading } = useEmployeeList();
    const { minimize } = useMinimize();
    const { data: tiposProcesso = [] } = useTiposProcesso(true);

    const [step, setStep] = useState(0);
    const isWizard = !process;
    const [selectedTipoProcessoId, setSelectedTipoProcessoId] = useState<number | null>(null);
    const { data: selectedTipoDetail } = useTipoProcesso(selectedTipoProcessoId);

    const wizardSteps: WizardStepConfig[] = useMemo(() => {
        const wc = selectedTipoDetail?.wizard_config;
        if (wc?.steps && wc.steps.length > 0) return wc.steps;
        return [
            { id: 'entidade', title: 'Entidade e Arquivo', fields: [{ key: 'cliente_id', required: true }] },
            { id: 'detalhes', title: 'Detalhes do Processo', fields: [
                { key: 'titulo', required: true },
                { key: 'descricao', required: false },
                { key: 'estado', required: true },
                { key: 'funcionario_id', required: false },
                { key: 'titular_id', required: false },
                { key: 'valor', required: false },
                { key: 'onde_estao', required: false },
            ]},
        ];
    }, [selectedTipoDetail?.wizard_config]);

    const totalSteps = 1 + wizardSteps.length;

    const [customTypes, setCustomTypes] = useState<string[]>(() => loadCustomTypes());
    const [hiddenDefaultTypes, setHiddenDefaultTypes] = useState<string[]>(() => loadHiddenTypes());
    const [newTypeInput, setNewTypeInput] = useState("");
    const [showManageTypes, setShowManageTypes] = useState(false);

    const visibleTypeList = useMemo(() => {
        // Se há tipos configurados no backend, usar esses
        if (tiposProcesso.length > 0) {
            const backendNames = tiposProcesso.map(t => t.nome);
            // Adicionar tipos locais que não existem no backend
            const localOnly = [...DEFAULT_PROCESS_TYPES.filter(t => !hiddenDefaultTypes.includes(t)), ...customTypes]
                .filter(t => !backendNames.some(bn => bn.toLowerCase() === t.toLowerCase()));
            return [...backendNames, ...localOnly];
        }
        const defaults = DEFAULT_PROCESS_TYPES.filter((t) => !hiddenDefaultTypes.includes(t));
        return [...defaults, ...customTypes];
    }, [hiddenDefaultTypes, customTypes, tiposProcesso]);

    const removeFromList = (label: string) => {
        if (form.getValues("tipo") === label) {
            form.setValue("tipo", "");
        }
        if (DEFAULT_PROCESS_TYPES.includes(label)) {
            const next = hiddenDefaultTypes.includes(label) ? hiddenDefaultTypes : [...hiddenDefaultTypes, label];
            setHiddenDefaultTypes(next);
            saveHiddenTypes(next);
        } else {
            const next = customTypes.filter((t) => t !== label);
            setCustomTypes(next);
            saveCustomTypes(next);
        }
    };

    const addCustomType = () => {
        const value = newTypeInput.trim();
        if (!value || visibleTypeList.some((t) => t.toLowerCase() === value.toLowerCase())) return;
        const next = [...customTypes, value];
        setCustomTypes(next);
        saveCustomTypes(next);
        setNewTypeInput("");
    };

    const restoreDefaultTypes = () => {
        setHiddenDefaultTypes([]);
        saveHiddenTypes([]);
        setCustomTypes([]);
        saveCustomTypes([]);
    };

    const [selectedClienteId, setSelectedClienteId] = React.useState<number | undefined>();
    const selectedCliente = useMemo(() => {
        if (!selectedClienteId) return null;
        return clients.find(c => c.id === selectedClienteId) || null;
    }, [selectedClienteId, clients]);

    // Obter o dossiê único da entidade selecionada (uma chamada só; backend devolve null se não tiver arquivo)
    const { dossie: dossieEntidade, isLoading: isDossieLoading, createDossie } = useDossies(selectedCliente?.id);

    const [createdDossieId, setCreatedDossieId] = useState<number | null>(null);
    const [showExtracao, setShowExtracao] = useState(false);
    const [camposPersonalizados, setCamposPersonalizados] = useState<Record<string, any>>({});

    // Custom field definitions from wizard config
    const customFieldDefs = useMemo(() => {
        return selectedTipoDetail?.wizard_config?.custom_fields ?? [];
    }, [selectedTipoDetail?.wizard_config?.custom_fields]);
    const { data: extracaoStatus } = useExtracaoStatus();
    const extracao = useExtrairDocumento();

    const isEditing = !!process;
    const schema = isEditing ? processSchemaUpdate : processSchemaCreate;

    const form = useForm<ProcessFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            titulo: initialData?.titulo ?? "",
            descricao: initialData?.descricao ?? "",
            tipo: initialData?.tipo ?? "",
            onde_estao: undefined,
            cliente_id: initialData?.cliente_id ?? undefined,
            dossie_id: (initialData as any)?.dossie_id ?? undefined,
            funcionario_id: initialData?.funcionario_id ?? undefined,
            titular_id: (initialData as any)?.titular_id ?? null,
            tipo_processo_id: (initialData as any)?.tipo_processo_id ?? null,
            parent_processo_id: (initialData as any)?.parent_processo_id ?? null,
            estado: initialData?.estado ?? "pendente",
            valor: (initialData as any)?.valor ?? null,
        },
    });

    const clienteId = form.watch("cliente_id");
    const dossieId = form.watch("dossie_id");
    const watchedTipoProcessoId = form.watch("tipo_processo_id");

    React.useEffect(() => {
        setSelectedTipoProcessoId(watchedTipoProcessoId ?? null);
    }, [watchedTipoProcessoId]);

    React.useEffect(() => {
        setSelectedClienteId(clienteId);
    }, [clienteId]);

    // Quando um dossiê é selecionado, garantir que o cliente_id também está definido
    React.useEffect(() => {
        if (dossieId && selectedCliente && !clienteId) {
            form.setValue("cliente_id", selectedCliente.id);
        }
    }, [dossieId, selectedCliente, clienteId, form]);

    // Find which wizard step (1-based) contains cliente_id
    const entityStepIdx = useMemo(() => {
        const idx = wizardSteps.findIndex(s => s.fields.some(f => f.key === 'cliente_id'));
        return idx >= 0 ? idx + 1 : -1; // +1 because step 0 is tipo selection
    }, [wizardSteps]);

    const showNoDossiePrompt = Boolean(
        isWizard && step === entityStepIdx && selectedClienteId && !isDossieLoading && dossieEntidade == null
    );

    useEffect(() => {
        if (step !== entityStepIdx) setCreatedDossieId(null);
    }, [step, entityStepIdx]);

    // Associar automaticamente o dossiê da entidade ao processo (arquivo selecionado automaticamente)
    useEffect(() => {
        if (!isWizard || !selectedClienteId) return;
        if (dossieEntidade?.id != null) {
            form.setValue("dossie_id", dossieEntidade.id);
        } else {
            form.setValue("dossie_id", undefined);
        }
    }, [isWizard, selectedClienteId, dossieEntidade?.id, form]);

    useEffect(() => {
        if (process) {
            form.reset({
                titulo: process.titulo,
                descricao: process.descricao || "",
                tipo: process.tipo || "",
                onde_estao: (process as any).onde_estao === 'Tarefas' ? 'Pendentes' : ((process as any).onde_estao || undefined),
                cliente_id: process.cliente_id || undefined,
                dossie_id: (process as any).dossie_id ?? undefined,
                funcionario_id: process.funcionario_id || undefined,
                titular_id: process.titular_id ?? null,
                tipo_processo_id: process.tipo_processo_id ?? null,
                parent_processo_id: process.parent_processo_id ?? null,
                estado: process.estado,
                valor: (process as any).valor ?? null,
            });
            if (process.cliente_id) {
                setSelectedClienteId(process.cliente_id);
            }
        } else {
            form.reset({
                titulo: initialData?.titulo ?? "",
                descricao: initialData?.descricao ?? "",
                tipo: initialData?.tipo ?? "",
                onde_estao: undefined,
                cliente_id: initialData?.cliente_id ?? undefined,
                dossie_id: (initialData as any)?.dossie_id ?? undefined,
                funcionario_id: initialData?.funcionario_id ?? undefined,
                titular_id: (initialData as any)?.titular_id ?? null,
                tipo_processo_id: (initialData as any)?.tipo_processo_id ?? null,
                parent_processo_id: (initialData as any)?.parent_processo_id ?? null,
                estado: initialData?.estado ?? "pendente",
                valor: (initialData as any)?.valor ?? null,
            });
            if (initialData?.cliente_id) {
                setSelectedClienteId(initialData.cliente_id);
            }
        }
    }, [process, form, initialData]);

    useEffect(() => {
        if (isOpen && !process) {
            setStep(0);
            setSelectedClienteId(undefined);
            setSelectedTipoProcessoId(null);
            setCamposPersonalizados({});
            setShowExtracao(false);
            setShowManageTypes(false);
            setNewTypeInput("");
            setCreatedDossieId(null);
            form.reset({
                titulo: initialData?.titulo ?? "",
                descricao: initialData?.descricao ?? "",
                tipo: initialData?.tipo ?? "",
                onde_estao: undefined,
                cliente_id: initialData?.cliente_id ?? undefined,
                dossie_id: (initialData as any)?.dossie_id ?? undefined,
                funcionario_id: initialData?.funcionario_id ?? undefined,
                titular_id: (initialData as any)?.titular_id ?? null,
                tipo_processo_id: (initialData as any)?.tipo_processo_id ?? null,
                parent_processo_id: (initialData as any)?.parent_processo_id ?? null,
                estado: initialData?.estado ?? "pendente",
                valor: (initialData as any)?.valor ?? null,
            });
        }
    }, [isOpen, process]);

    const onSubmit = async (data: ProcessFormData) => {
        try {
            if (process) {
                await updateProcess.mutateAsync({
                    id: process.id,
                    ...data,
                });
            } else {
                // Build campos_personalizados from custom field values
                const cp = Object.keys(camposPersonalizados).length > 0 ? camposPersonalizados : undefined;
                await createProcess.mutateAsync({
                    titulo: data.titulo ?? "",
                    descricao: data.descricao,
                    tipo: data.tipo,
                    onde_estao: data.onde_estao,
                    cliente_id: data.cliente_id,
                    dossie_id: data.dossie_id,
                    funcionario_id: data.funcionario_id,
                    titular_id: data.titular_id,
                    tipo_processo_id: data.tipo_processo_id,
                    parent_processo_id: data.parent_processo_id,
                    estado: data.estado ?? "pendente",
                    campos_personalizados: cp,
                } as any);
            }
            onClose();
        } catch (error) {
            // Error handled in hook
        }
    };

    const isLoading = isClientsLoading || isEmployeesLoading;

    // ── Dynamic field rendering based on wizard config ─────────────────────
    const renderField = (fieldKey: string, required: boolean) => {
        switch (fieldKey) {
            case 'cliente_id':
                return (
                    <React.Fragment key="cliente_id">
                        {showNoDossiePrompt ? (
                            <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                                <p className="text-sm">
                                    A entidade <strong>{selectedCliente?.nome || selectedCliente?.nome_empresa || "selecionada"}</strong> nao tem dossie. Deseja criar um?
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const nome = selectedCliente ? (selectedCliente.nome || selectedCliente.nome_empresa || "Entidade") : "Entidade";
                                            createDossie
                                                .mutateAsync({ entidade_id: selectedClienteId!, nome: `Arquivo - ${nome}` })
                                                .then((data: { id?: number }) => {
                                                    if (data?.id) {
                                                        form.setValue("dossie_id", data.id);
                                                        setCreatedDossieId(data.id);
                                                    }
                                                })
                                                .catch(() => {});
                                        }}
                                        disabled={createDossie.isPending}
                                    >
                                        {createDossie.isPending ? "A criar..." : "Sim, criar"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            form.setValue("cliente_id", undefined);
                                            form.setValue("dossie_id", undefined);
                                            setSelectedClienteId(undefined);
                                            setCreatedDossieId(null);
                                        }}
                                    >
                                        Nao, voltar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {createdDossieId != null && (
                                    <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
                                        Dossie criado. ID: <strong>{createdDossieId}</strong>
                                    </div>
                                )}
                                <FormField
                                    control={form.control}
                                    name="cliente_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Entidade {required ? '*' : ''}</FormLabel>
                                            <ClientCombobox
                                                clients={clients ?? []}
                                                value={field.value}
                                                onChange={(value) => {
                                                    field.onChange(value);
                                                    setSelectedClienteId(value);
                                                    setCreatedDossieId(null);
                                                }}
                                                isLoading={isClientsLoading}
                                                insideDialog
                                            />
                                            <FormMessage />
                                            {isWizard && selectedCliente && dossieEntidade && (
                                                <p className="text-xs text-muted-foreground">
                                                    O arquivo da entidade sera associado automaticamente ao processo.
                                                </p>
                                            )}
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                        {/* Inline extraction */}
                        {isWizard && extracaoStatus?.habilitado && (
                            <div className="mt-4 border border-gray-200 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setShowExtracao(!showExtracao)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                                >
                                    <span className="flex items-center gap-2">
                                        <ScanSearch className="h-4 w-4" />
                                        Preencher a partir de documento
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showExtracao ? 'rotate-180' : ''}`} />
                                </button>
                                {showExtracao && (
                                    <div className="px-3 pb-3">
                                        <ExtracaoUploadZone
                                            onExtrair={(ficheiro, tipo) => {
                                                extracao.mutate(
                                                    { ficheiro, tipo_processo: tipo },
                                                    {
                                                        onSuccess: (data) => {
                                                            if (data.processo?.titulo_sugerido) form.setValue("titulo", data.processo.titulo_sugerido);
                                                            if (data.processo?.tipo_sugerido) form.setValue("tipo", data.processo.tipo_sugerido);
                                                            if (data.processo?.descricao) form.setValue("descricao", data.processo.descricao);
                                                            setShowExtracao(false);
                                                        },
                                                    },
                                                );
                                            }}
                                            isLoading={extracao.isPending}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </React.Fragment>
                );
            case 'titulo':
                return (
                    <FormField
                        key="titulo"
                        control={form.control}
                        name="titulo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Titulo do Processo {required ? '*' : ''}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Digite o titulo do processo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'descricao':
                return (
                    <FormField
                        key="descricao"
                        control={form.control}
                        name="descricao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descricao</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Digite a descricao do processo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'estado':
                return (
                    <FormField
                        key="estado"
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o estado" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="em_curso">Em Curso</SelectItem>
                                        <SelectItem value="concluido">Concluido</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'funcionario_id':
                return (
                    <FormField
                        key="funcionario_id"
                        control={form.control}
                        name="funcionario_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Responsavel</FormLabel>
                                <Select
                                    onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                                    value={field.value?.toString() || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {employees.map((emp: any) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'titular_id':
                return (
                    <FormField
                        key="titular_id"
                        control={form.control}
                        name="titular_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Titular</FormLabel>
                                <Select
                                    onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                                    value={field.value?.toString() || undefined}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {employees.map((emp: any) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'valor':
                return (
                    <FormField
                        key="valor"
                        control={form.control}
                        name="valor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor (EUR)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            case 'onde_estao':
                return (
                    <FormField
                        key="onde_estao"
                        control={form.control}
                        name="onde_estao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Localizacao</FormLabel>
                                <FormControl>
                                    <DynamicSelect
                                        categoria="onde_estao"
                                        value={field.value != null && field.value !== "" ? field.value : undefined}
                                        onValueChange={(v) => field.onChange(v)}
                                        placeholder="Selecione a localizacao"
                                        fallbackOptions={[
                                            { value: "Casa", label: "Casa" },
                                            { value: "Cartorio", label: "Cartorio" },
                                            { value: "Camara/GaiaUrb", label: "Camara/GaiaUrb" },
                                            { value: "DPA Agendado", label: "DPA Agendado" },
                                            { value: "Armario DPA", label: "Armario DPA" },
                                            { value: "PEPEX", label: "PEPEX" },
                                            { value: "Conservatoria Civil/Comercial", label: "Conservatoria Civil/Comercial" },
                                            { value: "Reunioes", label: "Reunioes" },
                                            { value: "Conservatoria Predial", label: "Conservatoria Predial" },
                                            { value: "Servico Financas", label: "Servico Financas" },
                                            { value: "Imposto Selo / Participacoes", label: "Imposto Selo / Participacoes" },
                                            { value: "Servico Financas Pendentes", label: "Servico Financas Pendentes" },
                                            { value: "Aguarda Doc Cliente/Informacoes", label: "Aguarda Doc Cliente/Informacoes" },
                                            { value: "Aguarda Doc", label: "Aguarda Doc" },
                                            { value: "Decorre Prazo", label: "Decorre Prazo" },
                                            { value: "Pendentes", label: "Pendentes" },
                                            { value: "Injuncoes", label: "Injuncoes" },
                                            { value: "Execucoes", label: "Execucoes" },
                                            { value: "Inventario Judicial", label: "Inventario Judicial" },
                                        ]}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                );
            default:
                // Custom field
                if (fieldKey.startsWith('custom_')) {
                    const cfDef = customFieldDefs.find((cf: CustomFieldDef) => cf.key === fieldKey);
                    if (!cfDef) return null;
                    return (
                        <div key={fieldKey} className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                {cfDef.label} {required ? '*' : ''}
                            </label>
                            {cfDef.type === 'text' && (
                                <Input
                                    placeholder={cfDef.placeholder || `Introduza ${cfDef.label.toLowerCase()}`}
                                    value={camposPersonalizados[fieldKey] ?? ''}
                                    onChange={(e) => setCamposPersonalizados(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                />
                            )}
                            {cfDef.type === 'number' && (
                                <Input
                                    type="number"
                                    step="any"
                                    placeholder={cfDef.placeholder || '0'}
                                    value={camposPersonalizados[fieldKey] ?? ''}
                                    onChange={(e) => setCamposPersonalizados(prev => ({ ...prev, [fieldKey]: e.target.value ? Number(e.target.value) : '' }))}
                                />
                            )}
                            {cfDef.type === 'date' && (
                                <Input
                                    type="date"
                                    value={camposPersonalizados[fieldKey] ?? ''}
                                    onChange={(e) => setCamposPersonalizados(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                />
                            )}
                            {cfDef.type === 'textarea' && (
                                <Textarea
                                    placeholder={cfDef.placeholder || `Introduza ${cfDef.label.toLowerCase()}`}
                                    value={camposPersonalizados[fieldKey] ?? ''}
                                    onChange={(e) => setCamposPersonalizados(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                />
                            )}
                            {cfDef.type === 'select' && cfDef.options && (
                                <Select
                                    onValueChange={(v) => setCamposPersonalizados(prev => ({ ...prev, [fieldKey]: v }))}
                                    value={camposPersonalizados[fieldKey] ?? undefined}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={cfDef.placeholder || `Selecione ${cfDef.label.toLowerCase()}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cfDef.options.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    );
                }
                return null;
        }
    };

    const renderWizardStepFields = (stepConfig: WizardStepConfig) => {
        // Group funcionario_id + titular_id side by side if both in same step
        const fields = stepConfig.fields;
        const result: React.ReactNode[] = [];
        let i = 0;
        while (i < fields.length) {
            const f = fields[i];
            // Check if we should pair funcionario + titular
            if (f.key === 'funcionario_id' && i + 1 < fields.length && fields[i + 1].key === 'titular_id') {
                result.push(
                    <div key="func-tit-pair" className="grid grid-cols-2 gap-4">
                        {renderField('funcionario_id', f.required)}
                        {renderField('titular_id', fields[i + 1].required)}
                    </div>
                );
                i += 2;
            } else if (f.key === 'titular_id' && i + 1 < fields.length && fields[i + 1].key === 'funcionario_id') {
                result.push(
                    <div key="tit-func-pair" className="grid grid-cols-2 gap-4">
                        {renderField('titular_id', f.required)}
                        {renderField('funcionario_id', fields[i + 1].required)}
                    </div>
                );
                i += 2;
            } else {
                result.push(renderField(f.key, f.required));
                i++;
            }
        }
        return result;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>{process ? "Editar Processo" : "Novo Processo"}</DialogTitle>
                            <DialogDescription>
                                {process
                                    ? "Edite os dados do processo."
                                    : "Preencha os dados para criar um novo processo."}
                            </DialogDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-12 top-4"
                            onClick={() => {
                                const data = form.getValues();
                                minimize({ type: 'process', title: process ? `Editar: ${process.titulo}` : 'Novo Processo', payload: { data, process } });
                                onClose();
                            }}
                            aria-label={'Minimizar'}
                        >
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        A carregar dados...
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {isWizard && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 py-2">
                                        {Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
                                            <span key={i} className="flex items-center">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                                                        step === i ? "bg-primary text-primary-foreground" : step > i ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    {step > i ? "✓" : i + 1}
                                                </div>
                                                {i < totalSteps - 1 && <div className="h-px flex-1 bg-border max-w-[40px]" />}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Passo {step + 1} de {totalSteps}: {step === 0 ? 'Tipo de Processo' : wizardSteps[step - 1]?.title ?? ''}
                                    </p>
                                </div>
                            )}

                            {/* Passo 1: Tipo de processo */}
                            {(!isWizard || step === 0) && (
                                <div className="space-y-4">
                                    {isWizard ? (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="tipo"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tipo de processo *</FormLabel>
                                                        <Select
                                                            onValueChange={(val) => {
                                                                field.onChange(val);
                                                                // Associar tipo_processo_id se for do backend
                                                                const backendTipo = tiposProcesso.find(t => t.nome === val);
                                                                form.setValue("tipo_processo_id", backendTipo?.id ?? null);
                                                            }}
                                                            value={field.value && visibleTypeList.includes(field.value) ? field.value : undefined}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione o tipo de processo" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {visibleTypeList.map((t) => (
                                                                    <SelectItem key={t} value={t}>
                                                                        {t}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowManageTypes((v) => !v)}
                                            >
                                                {showManageTypes ? "Ocultar lista de tipos" : "Gerir tipos"}
                                            </Button>
                                            {showManageTypes && (
                                                <div className="space-y-3 rounded-md border p-3 bg-muted/30">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-medium text-muted-foreground">Gerir lista de tipos</p>
                                                        <Button type="button" variant="ghost" size="sm" onClick={restoreDefaultTypes}>
                                                            Restaurar lista predefinida
                                                        </Button>
                                                    </div>
                                                    <div className="rounded-md border bg-background max-h-[180px] overflow-y-auto">
                                                        <ul className="divide-y divide-border">
                                                            {visibleTypeList.length === 0 ? (
                                                                <li className="px-3 py-2 text-sm text-muted-foreground">
                                                                    Nenhum tipo na lista. Adicione um abaixo.
                                                                </li>
                                                            ) : (
                                                                visibleTypeList.map((t) => (
                                                                    <li
                                                                        key={t}
                                                                        className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                                                                    >
                                                                        <span className="truncate">{t}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeFromList(t)}
                                                                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                                                                            aria-label={`Remover ${t}`}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </li>
                                                                ))
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Novo tipo (ex: Outro)"
                                                            value={newTypeInput}
                                                            onChange={(e) => setNewTypeInput(e.target.value)}
                                                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomType())}
                                                            className="flex-1"
                                                        />
                                                        <Button type="button" variant="outline" size="sm" onClick={addCustomType}>
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Adicionar
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <FormField
                                            control={form.control}
                                            name="tipo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Digite o tipo do processo" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Dynamic wizard steps */}
                            {isWizard && step > 0 && step <= wizardSteps.length && (
                                <div className="space-y-4">
                                    {renderWizardStepFields(wizardSteps[step - 1])}
                                </div>
                            )}

                            {/* Edit mode - show all fields */}
                            {!isWizard && (
                                <div className="space-y-4">
                                    {renderField('cliente_id', false)}
                                    {renderField('titulo', false)}
                                    {renderField('descricao', false)}
                                    {renderField('onde_estao', false)}
                                    {renderField('estado', false)}
                                    <div className="grid grid-cols-2 gap-4">
                                        {renderField('funcionario_id', false)}
                                        {renderField('titular_id', false)}
                                    </div>
                                    {renderField('valor', false)}
                                </div>
                            )}

                            <DialogFooter className="gap-2 sm:gap-0">
                                {isWizard && step > 0 ? (
                                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Anterior
                                    </Button>
                                ) : (
                                    <Button type="button" variant="outline" onClick={onClose}>
                                        Cancelar
                                    </Button>
                                )}
                                {isWizard && step < totalSteps - 1 ? (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (step === 0) {
                                                const tipo = form.getValues("tipo");
                                                if (!tipo || !tipo.trim()) {
                                                    form.setError("tipo", { type: "manual", message: "Selecione ou adicione um tipo de processo." });
                                                    return;
                                                }
                                            }
                                            // Validate required fields in dynamic wizard steps
                                            if (step > 0 && step <= wizardSteps.length) {
                                                const currentStep = wizardSteps[step - 1];
                                                for (const f of currentStep.fields) {
                                                    if (!f.required) continue;
                                                    if (f.key === 'cliente_id') {
                                                        const cid = form.getValues("cliente_id");
                                                        if (cid == null || cid === 0) {
                                                            form.setError("cliente_id", { type: "manual", message: "Selecione a entidade." });
                                                            return;
                                                        }
                                                        const did = form.getValues("dossie_id");
                                                        if (did == null || did === 0) {
                                                            form.setError("cliente_id", { type: "manual", message: "A entidade nao tem arquivo. Crie um arquivo primeiro." });
                                                            return;
                                                        }
                                                    } else if (f.key === 'titulo') {
                                                        const titulo = form.getValues("titulo");
                                                        if (!titulo?.trim()) {
                                                            form.setError("titulo", { type: "manual", message: "Titulo e obrigatorio." });
                                                            return;
                                                        }
                                                    } else if (f.key.startsWith('custom_')) {
                                                        const val = camposPersonalizados[f.key];
                                                        if (val == null || val === '') {
                                                            // Can't use form.setError for custom fields, use alert
                                                            const cfDef = customFieldDefs.find((cf: CustomFieldDef) => cf.key === f.key);
                                                            alert(`Campo "${cfDef?.label ?? f.key}" e obrigatorio.`);
                                                            return;
                                                        }
                                                    }
                                                }
                                            }
                                            setStep(step + 1);
                                        }}
                                    >
                                        Seguinte
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={createProcess.isPending || updateProcess.isPending}
                                    >
                                        {createProcess.isPending || updateProcess.isPending
                                            ? "Salvando..."
                                            : process
                                                ? "Salvar"
                                                : "Criar processo"}
                                    </Button>
                                )}
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
};
