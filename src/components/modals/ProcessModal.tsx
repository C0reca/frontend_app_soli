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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ClientCombobox } from "@/components/ui/clientcombobox";
import { Loader2, Minimize2, ChevronRight, ChevronLeft, Plus, X } from "lucide-react";
import { useMinimize } from '@/contexts/MinimizeContext';

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
    estado: z.enum(["pendente", "em_curso", "concluido"]).default("pendente"),
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

    const [step, setStep] = useState(0);
    const isWizard = !process;
    const totalSteps = 3;

    const [customTypes, setCustomTypes] = useState<string[]>(() => loadCustomTypes());
    const [hiddenDefaultTypes, setHiddenDefaultTypes] = useState<string[]>(() => loadHiddenTypes());
    const [newTypeInput, setNewTypeInput] = useState("");
    const [showManageTypes, setShowManageTypes] = useState(false);

    const visibleTypeList = useMemo(() => {
        const defaults = DEFAULT_PROCESS_TYPES.filter((t) => !hiddenDefaultTypes.includes(t));
        return [...defaults, ...customTypes];
    }, [hiddenDefaultTypes, customTypes]);

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
            estado: initialData?.estado ?? "pendente",
        },
    });

    const clienteId = form.watch("cliente_id");
    const dossieId = form.watch("dossie_id");
    
    React.useEffect(() => {
        setSelectedClienteId(clienteId);
    }, [clienteId]);

    // Quando um dossiê é selecionado, garantir que o cliente_id também está definido
    React.useEffect(() => {
        if (dossieId && selectedCliente && !clienteId) {
            form.setValue("cliente_id", selectedCliente.id);
        }
    }, [dossieId, selectedCliente, clienteId, form]);

    const showNoDossiePrompt = Boolean(
        isWizard && step === 0 && selectedClienteId && !isDossieLoading && dossieEntidade == null
    );

    useEffect(() => {
        if (step !== 0) setCreatedDossieId(null);
    }, [step]);

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
                estado: process.estado,
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
                estado: initialData?.estado ?? "pendente",
            });
            if (initialData?.cliente_id) {
                setSelectedClienteId(initialData.cliente_id);
            }
        }
    }, [process, form, initialData]);

    useEffect(() => {
        if (isOpen && !process) setStep(0);
    }, [isOpen, process]);

    const onSubmit = async (data: ProcessFormData) => {
        try {
            if (process) {
                await updateProcess.mutateAsync({
                    id: process.id,
                    ...data,
                });
            } else {
                await createProcess.mutateAsync({
                    titulo: data.titulo ?? "",
                    descricao: data.descricao,
                    tipo: data.tipo,
                    onde_estao: data.onde_estao,
                    cliente_id: data.cliente_id,
                    dossie_id: data.dossie_id,
                    funcionario_id: data.funcionario_id,
                    estado: data.estado ?? "pendente",
                });
            }
            onClose();
        } catch (error) {
            // Error handled in hook
        }
    };

    const isLoading = isClientsLoading || isEmployeesLoading;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                                    <span className="ml-2 text-sm text-muted-foreground">Passo {step + 1} de {totalSteps}</span>
                                </div>
                            )}

                            {/* Passo 1: Entidade e Arquivo */}
                            {(!isWizard || step === 0) && (
                                <div className="space-y-4">
                                    {showNoDossiePrompt ? (
                                        <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                                            <p className="text-sm">
                                                A entidade <strong>{selectedCliente?.nome || selectedCliente?.nome_empresa || "selecionada"}</strong> não tem dossiê. Deseja criar um?
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
                                                    Não, voltar à escolha da entidade
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                    {createdDossieId != null && (
                                        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground">
                                            Dossiê criado. ID atribuído: <strong>{createdDossieId}</strong>
                                        </div>
                                    )}
                            <FormField
                                control={form.control}
                                name="cliente_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {isEditing ? 'Cliente' : 'Entidade *'}
                                        </FormLabel>
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
                                                O arquivo da entidade será associado automaticamente ao processo.
                                            </p>
                                        )}
                                    </FormItem>
                                )}
                            />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Passo 2: Tipo de processo */}
                            {(!isWizard || step === 1) && (
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
                                                            onValueChange={field.onChange}
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

                            {/* Passo 3: Título, descrição, localização, estado */}
                            {(!isWizard || step === 2) && (
                                <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="titulo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título do Processo *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Digite o título do processo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="descricao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Digite a descrição do processo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="onde_estao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Localização</FormLabel>
                                        <FormControl>
                                            <DynamicSelect
                                                categoria="onde_estao"
                                                value={field.value != null && field.value !== "" ? field.value : undefined}
                                                onValueChange={(v) => field.onChange(v)}
                                                placeholder="Selecione a localização"
                                                fallbackOptions={[
                                                    { value: "Casa", label: "Casa" },
                                                    { value: "Cartorio", label: "Cartorio" },
                                                    { value: "Camara/GaiaUrb", label: "Camara/GaiaUrb" },
                                                    { value: "DPA Agendado", label: "DPA Agendado" },
                                                    { value: "Armário DPA", label: "Armário DPA" },
                                                    { value: "PEPEX", label: "PEPEX" },
                                                    { value: "Conservatoria Civil/Comercial", label: "Conservatoria Civil/Comercial" },
                                                    { value: "Reuniões", label: "Reuniões" },
                                                    { value: "Conservatoria Predial", label: "Conservatoria Predial" },
                                                    { value: "Serviço Finanças", label: "Serviço Finanças" },
                                                    { value: "Imposto Selo / Participações", label: "Imposto Selo / Participações" },
                                                    { value: "Serviço Finanças Pendentes", label: "Serviço Finanças Pendentes" },
                                                    { value: "Aguarda Doc Cliente/Informações", label: "Aguarda Doc Cliente/Informações" },
                                                    { value: "Aguarda Doc", label: "Aguarda Doc" },
                                                    { value: "Decorre Prazo", label: "Decorre Prazo" },
                                                    { value: "Pendentes", label: "Pendentes" },
                                                    { value: "Injunções", label: "Injunções" },
                                                    { value: "Execuções", label: "Execuções" },
                                                    { value: "Inventário Judicial", label: "Inventário Judicial" },
                                                ]}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="estado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o estado" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pendente">Pendente</SelectItem>
                                                <SelectItem value="em_curso">Em Curso</SelectItem>
                                                <SelectItem value="concluido">Concluído</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                                const cid = form.getValues("cliente_id");
                                                if (cid == null || cid === 0) {
                                                    form.setError("cliente_id", { type: "manual", message: "Selecione a entidade." });
                                                    return;
                                                }
                                                const did = form.getValues("dossie_id");
                                                if (did == null || did === 0) {
                                                    form.setError("cliente_id", { type: "manual", message: "A entidade não tem arquivo. Crie um arquivo primeiro." });
                                                    return;
                                                }
                                            }
                                            if (step === 1) {
                                                const tipo = form.getValues("tipo");
                                                if (!tipo || !tipo.trim()) {
                                                    form.setError("tipo", { type: "manual", message: "Selecione ou adicione um tipo de processo." });
                                                    return;
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
