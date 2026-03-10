import { useState, useMemo, useEffect, useRef } from "react";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn, normalizeString } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import api from "@/services/api";

interface Client {
    id: number | string;
    nome?: string | null;
    nome_empresa?: string | null;
    tipo?: 'singular' | 'coletivo';
    nif?: string | null;
    nif_empresa?: string | null;
    criado_em?: string | null;
    createdAt?: string | null;
    ativo?: boolean | null;
}

interface ClientComboboxProps {
    clients: Client[];
    value?: number | string;
    onChange: (value: number) => void;
    isLoading?: boolean;
    /** Texto do botão quando nenhum cliente está selecionado */
    placeholderEmpty?: string;
    /** @deprecated Já não é necessário */
    insideDialog?: boolean;
}

export function ClientCombobox({ clients = [], value, onChange, isLoading, placeholderEmpty = "Selecione um cliente", insideDialog: _insideDialog = false }: ClientComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [serverResults, setServerResults] = useState<Client[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    // Server-side search when typing 2+ chars
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (search.trim().length < 2) {
            setServerResults(null);
            return;
        }

        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get('/clientes/search', { params: { q: search.trim(), limit: 20 } });
                setServerResults(res.data || []);
            } catch {
                setServerResults(null);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    // Use server results if available, otherwise fall back to local filtering
    const displayClients = useMemo(() => {
        if (serverResults !== null) return serverResults;

        // Local filtering for <2 chars or when server hasn't responded yet
        const normSearch = normalizeString(search);
        const filtered = (clients ?? []).filter((client) => {
            if (client.ativo === false) return false;
            if (!normSearch) return true;
            const nome = client?.nome || client?.nome_empresa || "";
            const nif = client?.tipo === 'coletivo'
                ? (client?.nif_empresa || "")
                : (client?.nif || "");
            return normalizeString(nome).includes(normSearch) ||
                   normalizeString(nif).includes(normSearch);
        });

        return filtered.sort((a, b) => {
            const idA = typeof a.id === 'string' ? parseInt(a.id, 10) : Number(a.id);
            const idB = typeof b.id === 'string' ? parseInt(b.id, 10) : Number(b.id);
            return idB - idA;
        }).slice(0, 50);
    }, [clients, search, serverResults]);

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
                if (!o) { setSearch(""); setServerResults(null); }
            }}
            modal={false}
        >
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {getClientDisplayName(selectedClient)}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Pesquisar por nome ou NIF..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {isLoading || isSearching ? (
                            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                A pesquisar...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                {displayClients.map((client) => {
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
