import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Process {
    id: number;
    titulo: string | null;
}

interface ProcessComboboxProps {
    processes: Process[];
    value?: number | null;
    onChange: (value: number | null) => void;
    isLoading?: boolean;
}

export function ProcessCombobox({ processes = [], value, onChange, isLoading }: ProcessComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const normalize = (str: string) =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredProcesses = useMemo(() => {
        const normSearch = normalize(search);
        return (processes ?? []).filter((process) => {
            const titulo = process?.titulo || "";
            return normalize(titulo).includes(normSearch);
        });
    }, [processes, search]);

    const selectedProcess = processes.find((p) => p.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedProcess?.titulo ?? "Selecione um processo"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput
                        placeholder="Pesquisar processo..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {isLoading ? (
                            <div className="p-4 text-sm text-muted-foreground">A carregar processos...</div>
                        ) : (
                            <>
                                <CommandEmpty>Nenhum processo encontrado.</CommandEmpty>
                                <CommandItem
                                    onSelect={() => {
                                        onChange(null);
                                        setOpen(false);
                                    }}
                                    className="flex justify-between"
                                >
                                    Sem processo
                                    <Check
                                        className={cn(
                                            "ml-2 h-4 w-4",
                                            value === null || value === undefined ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                                {filteredProcesses.map((process) => (
                                    <CommandItem
                                        key={process.id}
                                        onSelect={() => {
                                            onChange(process.id);
                                            setOpen(false);
                                        }}
                                        className="flex justify-between"
                                    >
                                        {process.titulo}
                                        <Check
                                            className={cn(
                                                "ml-2 h-4 w-4",
                                                process.id === value ? "opacity-100" : "opacity-0"
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
