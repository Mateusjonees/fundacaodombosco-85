import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata data sem problema de timezone (para datas tipo YYYY-MM-DD)
 * Evita o bug onde datas são exibidas com 1 dia a menos devido à conversão UTC -> horário local
 */
export const formatDateBR = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  // Para datas no formato YYYY-MM-DD, extrair componentes diretamente
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Para datas com timestamp (YYYY-MM-DDTHH:mm:ss), extrair apenas a data
  if (dateString.includes('T')) {
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Fallback para outros formatos
  return dateString;
};

/**
 * Retorna a data de hoje no formato YYYY-MM-DD usando o fuso local.
 * Evita o bug de 1 dia a menos ao usar toISOString() (UTC).
 */
export const getTodayLocalISODate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calcula idade a partir de uma data de nascimento (formato YYYY-MM-DD)
 * Evita problema de timezone
 */
export const calculateAgeBR = (birthDateString: string | null | undefined): number | null => {
  if (!birthDateString) return null;
  
  // Extrair ano, mês e dia diretamente da string
  const match = birthDateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  
  const [, yearStr, monthStr, dayStr] = match;
  const birthYear = parseInt(yearStr, 10);
  const birthMonth = parseInt(monthStr, 10);
  const birthDay = parseInt(dayStr, 10);
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  let age = todayYear - birthYear;
  
  // Se ainda não fez aniversário este ano, subtrai 1
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age--;
  }
  
  return age;
};
