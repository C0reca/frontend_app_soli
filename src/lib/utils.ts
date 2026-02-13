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
