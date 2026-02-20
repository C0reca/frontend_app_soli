import { useOpcoes } from '@/hooks/useConfiguracaoOpcoes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FallbackOption {
  value: string;
  label: string;
}

interface DynamicSelectProps {
  categoria: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  fallbackOptions?: FallbackOption[];
  disabled?: boolean;
  className?: string;
}

export function DynamicSelect({
  categoria,
  value,
  onValueChange,
  placeholder = 'Selecionar...',
  fallbackOptions = [],
  disabled,
  className,
}: DynamicSelectProps) {
  const { data: opcoes, isLoading, isError } = useOpcoes(categoria);

  // Use API options when available, fallback to hardcoded during loading/error
  const items = (opcoes && opcoes.length > 0)
    ? opcoes.map((o) => ({ value: o.valor, label: o.label }))
    : fallbackOptions;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? 'A carregar...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
        {items.length === 0 && !isLoading && (
          <SelectItem value="__none__" disabled>
            Sem opções disponíveis
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
