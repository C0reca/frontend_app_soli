import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas
 * Útil para pesquisas que devem funcionar com e sem acentos
 * @param str - String a ser normalizada
 * @returns String normalizada sem acentos e em minúsculas
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
