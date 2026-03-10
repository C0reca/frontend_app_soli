import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface PostalCodeResult {
  codigo_postal: string;
  localidade: string;
  concelho: string;
  distrito: string;
  rua: string;
}

interface CodigoPostalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: PostalCodeResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CodigoPostalInput: React.FC<CodigoPostalInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = '1234-567',
  className,
  disabled,
}) => {
  const [results, setResults] = useState<PostalCodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Format input as user types: XXXX-XXX
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9-]/g, '');

    // Auto-insert dash after 4 digits
    const digits = raw.replace(/-/g, '');
    if (digits.length > 4) {
      raw = `${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
    } else if (digits.length === 4 && !raw.includes('-') && e.target.value.length > (value || '').length) {
      raw = `${digits}-`;
    }

    if (raw.length > 8) raw = raw.slice(0, 8);
    onChange(raw);
  };

  // Search postal codes when user types 4+ digits
  useEffect(() => {
    const clean = (value || '').replace(/[^0-9]/g, '');
    if (clean.length < 4) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/codigos-postais/search', { params: { q: value } });
        setResults(res.data || []);
        setIsOpen((res.data || []).length > 0);
        setSelectedIndex(-1);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: PostalCodeResult) => {
    onChange(result.codigo_postal);
    setIsOpen(false);
    onSelect?.(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={value || ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          maxLength={8}
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border rounded-md shadow-lg">
          {results.map((result, index) => (
            <button
              key={`${result.codigo_postal}-${index}`}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-start gap-2 border-b last:border-b-0',
                selectedIndex === index && 'bg-gray-100',
              )}
              onClick={() => handleSelect(result)}
            >
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <div className="font-medium font-mono">{result.codigo_postal}</div>
                <div className="text-xs text-gray-500 truncate">
                  {[result.rua, result.localidade, result.concelho].filter(Boolean).join(', ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
