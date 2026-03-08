/**
 * Tipos de atendimento/serviço disponíveis no sistema
 * - private: Demanda Própria
 * - sus: SUS
 * - external: Demanda Externa
 * - laudo: Laudo
 */
export type ServiceType = 'private' | 'sus' | 'external' | 'laudo';

export const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'private', label: 'Demanda Própria' },
  { value: 'sus', label: 'SUS' },
  { value: 'external', label: 'Demanda Externa' },
  { value: 'laudo', label: 'Laudo' },
];

/**
 * Retorna o label do tipo de atendimento
 */
export const getServiceTypeLabel = (type?: string | null): string => {
  switch (type) {
    case 'sus': return 'SUS';
    case 'private': return 'Demanda Própria';
    case 'external': return 'Demanda Externa';
    case 'laudo': return 'Laudo';
    default: return 'Demanda Própria';
  }
};

/**
 * Retorna as classes CSS do badge por tipo de atendimento
 */
export const getServiceTypeBadgeClasses = (type?: string | null): string => {
  switch (type) {
    case 'sus': 
      return 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30';
    case 'external': 
      return 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30';
    case 'laudo': 
      return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
    case 'private':
    default: 
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
  }
};
