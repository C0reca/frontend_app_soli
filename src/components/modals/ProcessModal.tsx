import React, { useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProcesses, Process } from "@/hooks/useProcesses";
import { useClients } from "@/hooks/useClients";
import { useEmployees } from "@/hooks/useEmployees";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ClientCombobox } from "@/components/ui/clientcombobox";
import { Loader2, Minimize2 } from "lucide-react";
import { useMinimize } from '@/contexts/MinimizeContext';

const processSchema = z.object({
    titulo: z.string().min(1, "Título é obrigatório"),
    descricao: z.string().optional(),
    tipo: z.string().optional(),
    onde_estao: z.string().optional(),
    cliente_id: z.number().min(1, "Cliente é obrigatório"),
    funcionario_id: z.number().optional(),
    estado: z.enum(["pendente", "em_curso", "concluido"]).default("pendente"),
});

type ProcessFormData = z.infer<typeof processSchema>;

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
    const { employees = [], isLoading: isEmployeesLoading } = useEmployees();

    const { minimize } = useMinimize();

    const form = useForm<ProcessFormData>({
        resolver: zodResolver(processSchema),
        defaultValues: {
            titulo: initialData?.titulo ?? "",
            descricao: initialData?.descricao ?? "",
            tipo: initialData?.tipo ?? "",
            onde_estao: undefined,
            cliente_id: initialData?.cliente_id ?? undefined,
            funcionario_id: initialData?.funcionario_id ?? undefined,
            estado: initialData?.estado ?? "pendente",
        },
    });

    useEffect(() => {
        if (process) {
            form.reset({
                titulo: process.titulo,
                descricao: process.descricao || "",
                tipo: process.tipo || "",
                onde_estao: (process as any).onde_estao || undefined,
                cliente_id: process.cliente_id || undefined,
                funcionario_id: process.funcionario_id || undefined,
                estado: process.estado,
            });
        } else {
            form.reset({
                titulo: initialData?.titulo ?? "",
                descricao: initialData?.descricao ?? "",
                tipo: initialData?.tipo ?? "",
                onde_estao: undefined,
                cliente_id: initialData?.cliente_id ?? undefined,
                funcionario_id: initialData?.funcionario_id ?? undefined,
                estado: initialData?.estado ?? "pendente",
            });
        }
    }, [process, form, initialData]);

    const onSubmit = async (data: ProcessFormData) => {
        try {
            if (process) {
                await updateProcess.mutateAsync({
                    id: process.id,
                    ...data,
                });
            } else {
                await createProcess.mutateAsync(data);
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
                            <FormField
                                control={form.control}
                                name="titulo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título do Processo</FormLabel>
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

                            <FormField
                                control={form.control}
                                name="onde_estao"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Onde estão</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a localização" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Cartorio">Cartorio</SelectItem>
                                                <SelectItem value="Camara/GaiaUrb">Camara/GaiaUrb</SelectItem>
                                                <SelectItem value="DPA Agendado">DPA Agendado</SelectItem>
                                                <SelectItem value="Conservatoria Civil/Comercial">Conservatoria Civil/Comercial</SelectItem>
                                                <SelectItem value="Reuniões">Reuniões</SelectItem>
                                                <SelectItem value="Conservatoria Predial">Conservatoria Predial</SelectItem>
                                                <SelectItem value="Serviço Finanças">Serviço Finanças</SelectItem>
                                                <SelectItem value="Imposto Selo / Participações">Imposto Selo / Participações</SelectItem>
                                                <SelectItem value="Serviço Finanças Pendentes">Serviço Finanças Pendentes</SelectItem>
                                                <SelectItem value="Aguarda Doc Cliente">Aguarda Doc Cliente</SelectItem>
                                                <SelectItem value="Aguarda Doc">Aguarda Doc</SelectItem>
                                                <SelectItem value="Tarefas">Tarefas</SelectItem>
                                                <SelectItem value="Injunções">Injunções</SelectItem>
                                                <SelectItem value="Execuções">Execuções</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cliente_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cliente</FormLabel>
                                            <ClientCombobox
                                                clients={clients ?? []}
                                                value={field.value}
                                                onChange={field.onChange}
                                                isLoading={isClientsLoading}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="funcionario_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Responsável</FormLabel>
                                            <Select
                                                onValueChange={(value) =>
                                                    field.onChange(value ? parseInt(value) : undefined)
                                                }
                                                value={field.value?.toString() ?? ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione um funcionário" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {employees.map((employee) => (
                                                        <SelectItem
                                                            key={employee.id}
                                                            value={employee.id.toString()}
                                                        >
                                                            {employee.nome}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="estado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
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

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createProcess.isPending || updateProcess.isPending}
                                >
                                    {createProcess.isPending || updateProcess.isPending
                                        ? "Salvando..."
                                        : "Salvar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
};
