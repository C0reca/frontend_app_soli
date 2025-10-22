import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ClientComboboxProps {
    clients: { id: number; nome: string | null }[];
    value?: number;
    onChange: (id: number) => void;
}

export const ClientCombobox: React.FC<ClientComboboxProps> = ({
                                                                  clients,
                                                                  value,
                                                                  onChange,
                                                              }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Função para normalizar texto (remove acentos e põe em minúsculas)
    function normalize(str: string | null | undefined): string {
        return (str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    // Filtro que ignora acentos e é case-insensitive
    const filteredClients = clients.filter((client) =>
        normalize(client.nome).includes(normalize(search))
    );

    const selectedClient = clients.find((c) => c.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                >
                    {selectedClient ? selectedClient.nome : "Selecione um cliente"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Pesquisar cliente..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                        {filteredClients.map((client) => (
                            <CommandItem
                                key={client.id}
                                value={client.nome ?? ""}
                                onSelect={() => {
                                    onChange(client.id);
                                    setOpen(false);
                                    setSearch(""); // limpa o input após seleção
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        client.id === value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {client.nome ?? "Sem nome"}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
};