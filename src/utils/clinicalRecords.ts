// Utilitários das evoluções clínicas: data correta em Brasília e remoção de
// cópias espelhadas (atendimento, prontuário e relatório profissional).
import { BR_TIMEZONE } from '@/lib/utils';

/** Converte data/hora em YYYY-MM-DD no fuso de Brasília (datas puras ficam iguais). */
export const toBrasiliaISODate = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('en-CA', { timeZone: BR_TIMEZONE });
};

interface ClinicalSource {
  schedule_id?: string | null;
  date?: string | null;
  text?: string | null;
}

// Chave por conteúdo para registros antigos sem vínculo com agendamento
const contentKey = ({ date, text }: ClinicalSource) => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 300);
  if (!normalized) return null;
  return `${toBrasiliaISODate(date) || ''}|${normalized}`;
};

/**
 * Mantém cada evolução uma única vez. Os grupos devem vir em ordem de
 * prioridade: o primeiro registro encontrado é mantido e os espelhos são ocultados.
 */
export const dedupeClinicalGroups = <T extends unknown[][]>(
  groups: T,
  describe: (groupIndex: number, item: any) => ClinicalSource,
): T => {
  const seenSchedules = new Set<string>();
  const seenContent = new Set<string>();

  return groups.map((items, groupIndex) =>
    items.filter((item) => {
      const source = describe(groupIndex, item);
      const key = contentKey(source);
      if (source.schedule_id && seenSchedules.has(source.schedule_id)) return false;
      if (key && seenContent.has(key)) return false;
      if (source.schedule_id) seenSchedules.add(source.schedule_id);
      if (key) seenContent.add(key);
      return true;
    }),
  ) as T;
};
