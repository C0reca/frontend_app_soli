import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, normalizeString } from "@/lib/utils";
import { Check } from "lucide-react";

interface Client {
    id: number | string;
    nome?: string | null;
    nome_empresa?: string | null;
    tipo?: 'singular' | 'coletivo';
    nif?: string | null;
    nif_empresa?: string | null;
    criado_em?: string | null;
    createdAt?: string | null;
}

interface ClientComboboxProps {
    clients: Client[];
    value?: number | string;
    onChange: (value: number) => void;
    isLoading?: boolean;
    /** Texto do botão quando nenhum cliente está selecionado (ex. "Selecione uma entidade") */
    placeholderEmpty?: string;
    /** Usar quando o combobox está dentro de um Dialog (evita conflito de foco e z-index) */
    insideDialog?: boolean;
}

export function ClientCombobox({ clients = [], value, onChange, isLoading, placeholderEmpty = "Selecione um cliente", insideDialog = false }: ClientComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredClients = useMemo(() => {
        const normSearch = normalizeString(search);
        const filtered = (clients ?? []).filter((client) => {
            const nome = client?.nome || client?.nome_empresa || "";
            const nif = client?.tipo === 'coletivo' 
                ? (client?.nif_empresa || "")
                : (client?.nif || "");
            
            return normalizeString(nome).includes(normSearch) || 
                   normalizeString(nif).includes(normSearch);
        });
        
        // Ordenar do maior ID para o menor (mais recentes primeiro)
        return filtered.sort((a, b) => {
            const idA = typeof a.id === 'string' ? parseInt(a.id, 10) : Number(a.id);
            const idB = typeof b.id === 'string' ? parseInt(b.id, 10) : Number(b.id);
            return idB - idA;
        });
    }, [clients, search]);

    const selectedClient = clients.find((c) => String(c.id) === String(value));
    const getClientDisplayName = (client: Client | undefined) => {
        if (!client) return placeholderEmpty;
        return client.nome || client.nome_empresa || `Cliente #${client.id}`;
    };

    return (
        <Popover
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o) setSearch("");
            }}
            modal={!insideDialog}
        >
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {getClientDisplayName(selectedClient)}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn("w-[var(--radix-popover-trigger-width)] p-0", insideDialog && "z-[100]")}
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Pesquisar por nome ou NIF..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="p-4 text-sm text-muted-foreground">A carregar clientes...</div>
                        ) : (
                            <>
                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                {filteredClients.map((client) => {
                                    const nome = client.nome || client.nome_empresa || `Cliente #${client.id}`;
                                    const nif = client.tipo === 'coletivo' 
                                        ? (client.nif_empresa || '')
                                        : (client.nif || '');
                                    const clientId = typeof client.id === 'string' ? parseInt(client.id, 10) : client.id;
                                    return (
                                        <CommandItem
                                            key={client.id}
                                            onSelect={() => {
                                                onChange(clientId);
                                                setOpen(false);
                                            }}
                                            className="flex justify-between items-center"
                                        >
                                            <div className="flex flex-col">
                                                <span>{nome}</span>
                                                {nif && (
                                                    <span className="text-xs text-muted-foreground">NIF: {nif}</span>
                                                )}
                                            </div>
                                            <Check
                                                className={cn(
                                                    "ml-2 h-4 w-4",
                                                    String(client.id) === String(value) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    );
                                })}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}