import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, Briefcase, MapPin, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserAvatar } from '@/components/UserAvatar';

interface ProfessionalQuickViewModalProps {
  professionalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<string, string> = {
  director: 'Diretor(a)',
  coordinator_madre: 'Coordenador(a) Madre',
  coordinator_floresta: 'Coordenador(a) Floresta',
  coordinator_atendimento_floresta: 'Coordenador(a) Atend. Floresta',
  receptionist: 'Recepcionista',
  staff: 'Profissional',
  psicologo: 'Psicólogo(a)',
  psicopedagogo: 'Psicopedagogo(a)',
  fonoaudiologo: 'Fonoaudiólogo(a)',
  terapeuta_ocupacional: 'Terapeuta Ocupacional',
  terapeuta_ocupacional_integracao: 'T.O. Integração Sensorial',
  neuropsicologo: 'Neuropsicólogo(a)',
  neuropsicopedagogo: 'Neuropsicopedagogo(a)',
  musicoterapeuta: 'Musicoterapeuta',
  psicomotricista: 'Psicomotricista',
  fisioterapeuta: 'Fisioterapeuta',
  psiquiatra: 'Psiquiatra',
  neuropediatra: 'Neuropediatra',
};

const unitLabels: Record<string, string> = {
  madre: 'Unidade Madre',
  floresta: 'Unidade Floresta',
  atendimento_floresta: 'Atend. Floresta',
};

export const ProfessionalQuickViewModal = ({ professionalId, open, onOpenChange }: ProfessionalQuickViewModalProps) => {
  const { data: professional, isLoading } = useQuery({
    queryKey: ['professional-quick-view', professionalId],
    queryFn: async () => {
      if (!professionalId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', professionalId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId && open,
    staleTime: 60000,
  });

  // Buscar contagem de pacientes atribuídos
  const { data: assignedClientsCount } = useQuery({
    queryKey: ['professional-clients-count', professionalId],
    queryFn: async () => {
      if (!professionalId) return 0;
      const { count, error } = await supabase
        .from('client_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', professionalId)
        .eq('is_active', true);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!professionalId && open,
    staleTime: 60000,
  });

  // Buscar agendamentos de hoje
  const { data: todayAppointmentsCount } = useQuery({
    queryKey: ['professional-today-appointments', professionalId],
    queryFn: async () => {
      if (!professionalId) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count, error } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', professionalId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString());
      if (error) return 0;
      return count || 0;
    },
    enabled: !!professionalId && open,
    staleTime: 30000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-sm p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ) : professional ? (
          <>
            {/* Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-b">
              <div className="flex items-start gap-4">
                <UserAvatar 
                  name={professional.name} 
                  size="lg" 
                  role={professional.employee_role}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base sm:text-lg truncate">{professional.name}</h2>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs mt-1">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {roleLabels[professional.employee_role] || professional.employee_role}
                  </Badge>
                  {professional.unit && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {unitLabels[professional.unit] || professional.unit}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Estatísticas rápidas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assignedClientsCount}</p>
                  <p className="text-[10px] text-muted-foreground">Pacientes Vinculados</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{todayAppointmentsCount}</p>
                  <p className="text-[10px] text-muted-foreground">Atendimentos Hoje</p>
                </div>
              </div>

              {/* Contato */}
              <div className="space-y-2">
                {professional.phone && (
                  <a 
                    href={`tel:${professional.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{professional.phone}</span>
                  </a>
                )}
                {professional.email && (
                  <a 
                    href={`mailto:${professional.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{professional.email}</span>
                  </a>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Profissional não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
