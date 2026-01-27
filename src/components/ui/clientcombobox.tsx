import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
}

export function ClientCombobox({ clients = [], value, onChange, isLoading }: ClientComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const normalize = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredClients = useMemo(() => {
        const normSearch = normalize(search);
        const filtered = (clients ?? []).filter((client) => {
            const nome = client?.nome || client?.nome_empresa || "";
            const nif = client?.tipo === 'coletivo' 
                ? (client?.nif_empresa || "")
                : (client?.nif || "");
            
            return normalize(nome).includes(normSearch) || 
                   normalize(nif).includes(normSearch);
        });
        
        // Ordenar do mais recente para o mais antigo (por data de criação ou ID)
        return filtered.sort((a, b) => {
            // Tentar ordenar por data de criação primeiro
            const dateA = a.criado_em || a.createdAt;
            const dateB = b.criado_em || b.createdAt;
            
            if (dateA && dateB) {
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            }
            
            // Se não houver data, ordenar por ID (mais recente = maior ID)
            const idA = typeof a.id === 'string' ? parseInt(a.id, 10) : a.id;
            const idB = typeof b.id === 'string' ? parseInt(b.id, 10) : b.id;
            return idB - idA;
        });
    }, [clients, search]);

    const selectedClient = clients.find((c) => String(c.id) === String(value));
    const getClientDisplayName = (client: Client | undefined) => {
        if (!client) return "Selecione um cliente";
        return client.nome || client.nome_empresa || `Cliente #${client.id}`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {getClientDisplayName(selectedClient)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
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