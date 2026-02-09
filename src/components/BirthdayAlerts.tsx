import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Cake, Gift, PartyPopper, Mail, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInYears, isSameDay, isAfter, isBefore, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BirthdayClient {
  id: string;
  name: string;
  birth_date: string;
  email?: string;
  age: number;
  daysUntil: number;
  isToday: boolean;
}

export const BirthdayAlerts = () => {
  const [birthdays, setBirthdays] = useState<BirthdayClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailsSent, setEmailsSent] = useState<Set<string>>(new Set());
  const { profile } = useCurrentUser();
  const { toast } = useToast();

  useEffect(() => {
    const loadBirthdays = async () => {
      if (!profile?.user_id) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = addDays(today, 7);

      const isDirectorOrCoordinator = ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'].includes(profile.employee_role || '');

      let query = supabase
        .from('clients')
        .select('id, name, birth_date, email')
        .eq('is_active', true)
        .not('birth_date', 'is', null);

      if (!isDirectorOrCoordinator) {
        const { data: assignments } = await supabase
          .from('client_assignments')
          .select('client_id')
          .eq('employee_id', profile.user_id)
          .eq('is_active', true);

        if (!assignments || assignments.length === 0) {
          setBirthdays([]);
          setLoading(false);
          return;
        }

        const clientIds = assignments.map(a => a.client_id).filter(Boolean);
        query = query.in('id', clientIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar aniversários:', error);
        setLoading(false);
        return;
      }

      const upcomingBirthdays = (data || [])
        .map(client => {
          const birthDate = parseISO(client.birth_date);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          
          let targetDate = thisYearBirthday;
          if (isBefore(thisYearBirthday, today) && !isSameDay(thisYearBirthday, today)) {
            targetDate = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
          }

          const isToday = isSameDay(targetDate, today);
          const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const age = differenceInYears(today, birthDate) + (isToday ? 0 : 1);

          return {
            id: client.id,
            name: client.name,
            birth_date: client.birth_date,
            email: client.email || undefined,
            age,
            daysUntil: isToday ? 0 : daysUntil,
            isToday
          };
        })
        .filter(client => client.daysUntil >= 0 && client.daysUntil <= 7)
        .sort((a, b) => a.daysUntil - b.daysUntil);

      setBirthdays(upcomingBirthdays);
      setLoading(false);
    };

    loadBirthdays();
  }, [profile?.user_id, profile?.employee_role]);

  const handleSendBirthdayEmail = async (client: BirthdayClient) => {
    if (!client.email) {
      toast({
        variant: "destructive",
        title: "Sem e-mail",
        description: `${client.name} não possui e-mail cadastrado.`,
      });
      return;
    }

    setSendingEmail(client.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-birthday-email', {
        body: {
          clientEmail: client.email,
          clientName: client.name,
          age: client.age,
        },
      });

      if (error) throw error;

      setEmailsSent(prev => new Set(prev).add(client.id));
      toast({
        title: "E-mail enviado! 🎂",
        description: `Parabéns enviado para ${client.name}.`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar e-mail de aniversário:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: error?.message || "Não foi possível enviar o e-mail.",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500/10 via-card to-pink-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            <span>Aniversários</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (birthdays.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500/10 via-card to-pink-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            <span>Aniversários</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Nenhum aniversário nos próximos 7 dias</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500/10 via-card to-pink-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            <span>Aniversários</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {birthdays.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {birthdays.map((client) => (
                <div
                  key={client.id}
                  className={`p-2 rounded-lg border transition-all ${
                    client.isToday 
                      ? 'bg-pink-500/20 border-pink-500/30 animate-pulse' 
                      : 'bg-card/50 border-border/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {client.isToday ? (
                        <PartyPopper className="h-4 w-4 text-pink-500 shrink-0" />
                      ) : (
                        <Gift className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{client.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {client.isToday && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {emailsSent.has(client.id) ? (
                              <Button size="icon" variant="ghost" className="h-6 w-6" disabled>
                                <Check className="h-3 w-3 text-green-500" />
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                disabled={sendingEmail === client.id || !client.email}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendBirthdayEmail(client);
                                }}
                              >
                                {sendingEmail === client.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Mail className="h-3 w-3 text-pink-500" />
                                )}
                              </Button>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {emailsSent.has(client.id)
                              ? 'E-mail enviado!'
                              : client.email
                                ? 'Enviar parabéns por e-mail'
                                : 'Sem e-mail cadastrado'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {client.isToday ? (
                        <Badge className="bg-pink-500 text-white text-[10px] px-1.5">
                          Hoje! 🎉
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {client.daysUntil === 1 ? 'Amanhã' : `${client.daysUntil} dias`}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {client.age} anos
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
