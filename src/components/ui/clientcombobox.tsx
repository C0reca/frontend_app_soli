import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Client {
    id: number;
    nome: string | null;
}

interface ClientComboboxProps {
    clients: Client[];
    value?: number;
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
        return (clients ?? []).filter((client) => {
            const nome = client?.nome || "";
            return normalize(nome).includes(normSearch);
        });
    }, [clients, search]);

    const selectedClient = clients.find((c) => c.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedClient?.nome ?? "Selecione um cliente"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput
                        placeholder="Pesquisar cliente..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="p-4 text-sm text-muted-foreground">A carregar clientes...</div>
                        ) : (
                            <>
                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                {filteredClients.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        onSelect={() => {
                                            onChange(client.id);
                                            setOpen(false);
                                        }}
                                        className="flex justify-between"
                                    >
                                        {client.nome}
                                        <Check
                                            className={cn(
                                                "ml-2 h-4 w-4",
                                                client.id === value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}