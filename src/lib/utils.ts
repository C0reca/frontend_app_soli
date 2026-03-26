import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza uma string para pesquisa: remove acentos, converte para minúsculas e remove espaços.
 * Permite pesquisar com e sem acentos, maiúsculas/minúsculas e com ou sem espaços.
 * @param str - String a ser normalizada
 * @returns String normalizada (sem acentos, minúscula, sem espaços)
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, '');
}

/**
 * Extrai mensagem de erro legível de uma resposta API (suporta string, array Pydantic, etc).
 */
export function extractApiError(error: any, fallback: string = 'Ocorreu um erro.'): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d: any) => typeof d === 'string' ? d : d?.msg || JSON.stringify(d)).join('; ');
  if (detail && typeof detail === 'object') return JSON.stringify(detail);
  return fallback;
}

/**
 * Formata um valor monetário em EUR (pt-PT).
 */
export function formatCurrency(value: any): string {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
}

/**
 * Formata uma data em formato português (dd/mm/aaaa).
 */
export function formatDate(value?: string | Date | null, opts?: { time?: boolean }): string {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  if (opts?.time) {
    return d.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
