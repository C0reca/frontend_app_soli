import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExtracaoUploadZoneProps {
  onExtrair: (ficheiro: File, tipo: string) => void;
  isLoading: boolean;
}

const TIPOS_PROCESSO = [
  { value: 'generico', label: 'Genérico (auto-detectar)' },
  { value: 'auto', label: 'Automóvel' },
  { value: 'predial', label: 'Registo Predial' },
  { value: 'herdeiros', label: 'Habilitação de Herdeiros' },
];

export const ExtracaoUploadZone: React.FC<ExtracaoUploadZoneProps> = ({ onExtrair, isLoading }) => {
  const [ficheiro, setFicheiro] = useState<File | null>(null);
  const [tipo, setTipo] = useState('generico');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const validTypes = [
      'application/pdf',
      'image/png', 'image/jpeg', 'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ];
    const validExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.docx', '.doc'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    setFicheiro(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : ficheiro
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {ficheiro ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-700">{ficheiro.name}</p>
              <p className="text-sm text-green-600">
                {(ficheiro.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFicheiro(null);
              }}
              className="ml-2 p-1 rounded-full hover:bg-green-200"
            >
              <X className="h-4 w-4 text-green-600" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600">
              Arraste um documento ou clique para selecionar
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, Word, PNG, JPG — máx. 10 MB
            </p>
          </>
        )}
      </div>

      {/* Tipo + Botão */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de processo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PROCESSO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => ficheiro && onExtrair(ficheiro, tipo)}
          disabled={!ficheiro || isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              A extrair...
            </div>
          ) : (
            'Extrair Dados'
          )}
        </Button>
      </div>
    </div>
  );
};
