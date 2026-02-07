import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PatientPortal = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['patient-portal', token],
    queryFn: async () => {
      if (!token) throw new Error('Token inválido');

      // Validate token
      const { data: tokenData, error: tokenError } = await supabase
        .from('patient_portal_tokens')
        .select('*, clients(id, name)')
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (tokenError || !tokenData) throw new Error('Link inválido ou expirado');

      // Fetch upcoming schedules
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('id, appointment_date, appointment_time, service_type, status, is_online, meeting_link')
        .eq('client_id', tokenData.client_id)
        .gte('appointment_date', format(new Date(), 'yyyy-MM-dd'))
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true });

      if (schedError) throw schedError;

      return { client: tokenData.clients, schedules: schedules || [] };
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-medium text-destructive mb-2">Link inválido</p>
            <p className="text-sm text-muted-foreground">Este link pode ter expirado ou ser inválido. Entre em contato com a clínica.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <img src="/lovable-uploads/1e0ba652-7476-47a6-b6a0-0f2c90e306bd.png" alt="Logo" className="h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground">Seus Agendamentos</h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <User className="h-4 w-4" />{data.client?.name}
          </p>
        </div>

        {data.schedules.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum agendamento futuro encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.schedules.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="font-medium">{s.service_type || 'Consulta'}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(s.appointment_date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />{s.appointment_time}
                      </div>
                      {s.is_online && s.meeting_link && (
                        <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                          <MapPin className="h-4 w-4" />Entrar na sala virtual
                        </a>
                      )}
                    </div>
                    <Badge variant={s.status === 'confirmed' ? 'default' : 'outline'}>
                      {s.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Fundação Dom Bosco • Clínica de Saúde
        </p>
      </div>
    </div>
  );
};

export default PatientPortal;
