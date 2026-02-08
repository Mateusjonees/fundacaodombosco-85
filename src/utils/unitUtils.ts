/**
 * Utilidades para gerenciamento de unidades do sistema
 * Fonte centralizada de cores e estilos por unidade
 */

import { Building2, Brain, Stethoscope, Clipboard, type LucideIcon } from 'lucide-react';

export type Unit = 'madre' | 'floresta' | 'atendimento_floresta';

export interface UnitConfig {
  value: Unit;
  label: string;
  shortLabel?: string;
}

export interface UnitStyleConfig {
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  // Gradient para barras decorativas
  gradient: string;
  // Fundo claro
  bgLight: string;
  // Texto principal
  textColor: string;
  // Borda
  borderColor: string;
  // Fundo com opacidade (cards, badges)
  bg: string;
  // Texto alternativo
  text: string;
  // Borda com opacidade
  border: string;
  // Badge combinado (bg + text + border)
  badge: string;
  // Avatar sólido
  avatar: string;
}

export const UNITS: UnitConfig[] = [
  { value: 'madre', label: 'MADRE (Clínica Social)', shortLabel: 'MADRE' },
  { value: 'floresta', label: 'Floresta (Neuroavaliação)', shortLabel: 'Floresta' },
  { value: 'atendimento_floresta', label: 'Atendimento Floresta', shortLabel: 'Atendimento Floresta' },
];

/**
 * Cores padronizadas por unidade:
 * MADRE = Azul (blue)
 * Floresta = Verde (emerald)
 * Atendimento Floresta = Roxo (purple)
 */
const UNIT_STYLES: Record<string, UnitStyleConfig> = {
  madre: {
    label: 'Clínica Social',
    shortLabel: 'MADRE',
    Icon: Building2,
    gradient: 'from-blue-500 to-cyan-500',
    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
    avatar: 'bg-blue-500 text-white',
  },
  floresta: {
    label: 'Neuroavaliação',
    shortLabel: 'FLORESTA',
    Icon: Brain,
    gradient: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    avatar: 'bg-emerald-500 text-white',
  },
  atendimento_floresta: {
    label: 'Atend. Floresta',
    shortLabel: 'ATEND. FLORESTA',
    Icon: Stethoscope,
    gradient: 'from-purple-500 to-violet-500',
    bgLight: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-500/20',
    badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
    avatar: 'bg-purple-500 text-white',
  },
};

const DEFAULT_UNIT_STYLE: UnitStyleConfig = {
  label: 'N/A',
  shortLabel: 'N/A',
  Icon: Clipboard,
  gradient: 'from-gray-400 to-gray-500',
  bgLight: 'bg-muted/50',
  textColor: 'text-muted-foreground',
  borderColor: 'border-border',
  bg: 'bg-muted',
  text: 'text-muted-foreground',
  border: 'border-border',
  badge: 'bg-muted text-muted-foreground border-border',
  avatar: 'bg-primary text-primary-foreground',
};

/**
 * Retorna o objeto de estilo completo para uma unidade
 */
export const getUnitStyle = (unit?: string | null): UnitStyleConfig => {
  if (!unit) return DEFAULT_UNIT_STYLE;
  return UNIT_STYLES[unit] || DEFAULT_UNIT_STYLE;
};

/**
 * Retorna o label formatado de uma unidade
 */
export const getUnitLabel = (unit?: string | null, short: boolean = false): string => {
  if (!unit) return 'N/A';
  const style = UNIT_STYLES[unit];
  if (!style) return unit;
  return short ? style.shortLabel : style.label;
};

/**
 * Retorna classes de badge para uma unidade (bg + text + border combinados)
 */
export const getUnitBadgeClasses = (unit?: string | null): string => {
  return getUnitStyle(unit).badge;
};

/**
 * Retorna a variante de badge para uma unidade
 */
export const getUnitBadgeVariant = (unit?: string | null): 'default' | 'secondary' | 'outline' => {
  if (unit === 'madre') return 'default';
  if (unit === 'floresta') return 'secondary';
  if (unit === 'atendimento_floresta') return 'outline';
  return 'default';
};
