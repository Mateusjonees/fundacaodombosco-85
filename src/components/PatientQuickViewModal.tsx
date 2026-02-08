import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, Mail, MapPin, Calendar, User, Stethoscope, FileText, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { getUnitStyle } from '@/utils/unitUtils';

interface PatientQuickViewModalProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewFullProfile?: (clientId: string) => void;
}

// Unit colors imported from centralized config

export const PatientQuickViewModal = ({ clientId, open, onOpenChange, onViewFullProfile }: PatientQuickViewModalProps) => {
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client-quick-view', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
    staleTime: 60000,
  });

  const { data: nextAppointment } = useQuery({
    queryKey: ['client-next-appointment', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('schedules')
        .select('start_time, title, profiles(name)')
        .eq('client_id', clientId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
    staleTime: 60000,
  });

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const unitStyle = getUnitStyle(client?.unit);

  const handleViewFullProfile = () => {
    onOpenChange(false);
    if (onViewFullProfile && clientId) {
      onViewFullProfile(clientId);
    } else {
      navigate(`/clients?clientId=${clientId}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : client ? (
          <>
            {/* Header com Avatar e Info Principal */}
            <div className={`p-4 sm:p-6 ${unitStyle.bg} border-b`}>
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-white/50 shadow-lg">
                  <AvatarFallback className="text-lg sm:text-xl font-bold bg-primary text-primary-foreground">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-base sm:text-lg truncate">{client.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={client.is_active ? "default" : "secondary"} className="text-[10px]">
                      {client.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline" className={`${unitStyle.bg} ${unitStyle.text} text-[10px]`}>
                      {unitStyle.label}
                    </Badge>
                  </div>
                  {client.birth_date && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {calculateAge(client.birth_date)} anos
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Contato */}
              <div className="space-y-2">
                {client.phone && (
                  <a 
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </a>
                )}
                {client.email && (
                  <a 
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{client.email}</span>
                  </a>
                )}
                {client.cpf && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>CPF: {client.cpf}</span>
                  </div>
                )}
              </div>

              {/* Diagnóstico */}
              {client.diagnosis && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Stethoscope className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Diagnóstico</span>
                  </div>
                  <p className="text-sm">{client.diagnosis}</p>
                </div>
              )}

              {/* Próximo Atendimento */}
              {nextAppointment && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Próximo Atendimento</span>
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(nextAppointment.start_time), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextAppointment.title} - {(nextAppointment.profiles as any)?.name || 'Sem profissional'}
                  </p>
                </div>
              )}

              {/* Responsável */}
              {client.responsible_name && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Responsável</span>
                  </div>
                  <p className="text-sm">{client.responsible_name}</p>
                  {client.responsible_phone && (
                    <a href={`tel:${client.responsible_phone}`} className="text-xs text-primary hover:underline">
                      {client.responsible_phone}
                    </a>
                  )}
                </div>
              )}

              {/* Botão Ver Perfil Completo */}
              <Button 
                className="w-full gap-2" 
                onClick={handleViewFullProfile}
              >
                <ExternalLink className="h-4 w-4" />
                Ver Perfil Completo
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Paciente não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
