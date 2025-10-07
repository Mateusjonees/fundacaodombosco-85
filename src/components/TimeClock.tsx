import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, LogIn, LogOut, Coffee, Play } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimesheetEntry {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_start: string | null;
  break_end: string | null;
  total_hours: number | null;
  status: string;
}

export function TimeClock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentEntry, setCurrentEntry] = useState<TimesheetEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (user) {
      loadTodayEntry();
    }
  }, [user]);

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTodayEntry = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('employee_timesheet')
        .select('*')
        .eq('employee_id', user?.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      setCurrentEntry(data);
    } catch (error) {
      console.error('Erro ao carregar ponto:', error);
    }
  };

  const calculateTotalHours = (entry: TimesheetEntry): number => {
    if (!entry.clock_in) return 0;
    
    const clockIn = new Date(entry.clock_in);
    const clockOut = entry.clock_out ? new Date(entry.clock_out) : new Date();
    
    let totalMinutes = differenceInMinutes(clockOut, clockIn);
    
    // Subtrair tempo de pausa se houver
    if (entry.break_start && entry.break_end) {
      const breakStart = new Date(entry.break_start);
      const breakEnd = new Date(entry.break_end);
      const breakMinutes = differenceInMinutes(breakEnd, breakStart);
      totalMinutes -= breakMinutes;
    }
    
    return totalMinutes / 60; // Converter para horas
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('employee_timesheet')
        .insert({
          employee_id: user?.id,
          date: today,
          clock_in: now,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(data);
      toast({
        title: "Entrada registrada",
        description: `Ponto batido às ${format(new Date(now), 'HH:mm:ss')}`,
      });
    } catch (error: any) {
      console.error('Erro ao bater ponto:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível registrar a entrada."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEntry) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const totalHours = calculateTotalHours({
        ...currentEntry,
        clock_out: now
      });

      const { error } = await supabase
        .from('employee_timesheet')
        .update({
          clock_out: now,
          total_hours: totalHours
        })
        .eq('id', currentEntry.id);

      if (error) throw error;

      await loadTodayEntry();
      toast({
        title: "Saída registrada",
        description: `Ponto batido às ${format(new Date(now), 'HH:mm:ss')}. Total: ${totalHours.toFixed(2)}h`,
      });
    } catch (error: any) {
      console.error('Erro ao registrar saída:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível registrar a saída."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBreakStart = async () => {
    if (!currentEntry) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('employee_timesheet')
        .update({
          break_start: now
        })
        .eq('id', currentEntry.id);

      if (error) throw error;

      await loadTodayEntry();
      toast({
        title: "Pausa iniciada",
        description: `Início da pausa às ${format(new Date(now), 'HH:mm:ss')}`,
      });
    } catch (error: any) {
      console.error('Erro ao iniciar pausa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível iniciar a pausa."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    if (!currentEntry) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('employee_timesheet')
        .update({
          break_end: now
        })
        .eq('id', currentEntry.id);

      if (error) throw error;

      await loadTodayEntry();
      toast({
        title: "Pausa finalizada",
        description: `Fim da pausa às ${format(new Date(now), 'HH:mm:ss')}`,
      });
    } catch (error: any) {
      console.error('Erro ao finalizar pausa:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível finalizar a pausa."
      });
    } finally {
      setLoading(false);
    }
  };

  const getWorkingTime = () => {
    if (!currentEntry?.clock_in) return '00:00:00';
    
    const clockIn = new Date(currentEntry.clock_in);
    const now = currentEntry.clock_out ? new Date(currentEntry.clock_out) : currentTime;
    
    let totalMinutes = differenceInMinutes(now, clockIn);
    
    // Subtrair tempo de pausa se houver
    if (currentEntry.break_start) {
      const breakStart = new Date(currentEntry.break_start);
      const breakEnd = currentEntry.break_end ? new Date(currentEntry.break_end) : new Date();
      const breakMinutes = differenceInMinutes(breakEnd, breakStart);
      totalMinutes -= breakMinutes;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes * 60) % 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const isOnBreak = currentEntry?.break_start && !currentEntry?.break_end;
  const hasClockIn = !!currentEntry?.clock_in;
  const hasClockOut = !!currentEntry?.clock_out;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ponto Eletrônico
          </div>
          {hasClockIn && !hasClockOut && (
            <Badge variant={isOnBreak ? "secondary" : "default"}>
              {isOnBreak ? 'Em Pausa' : 'Trabalhando'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Relógio atual */}
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>

        {/* Tempo trabalhado hoje */}
        {hasClockIn && (
          <div className="text-center p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Tempo trabalhado hoje</div>
            <div className="text-2xl font-bold">{getWorkingTime()}</div>
          </div>
        )}

        {/* Informações do ponto de hoje */}
        {currentEntry && (
          <div className="space-y-2 text-sm">
            {currentEntry.clock_in && (
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Entrada:</span>
                <span className="font-medium">{format(new Date(currentEntry.clock_in), 'HH:mm:ss')}</span>
              </div>
            )}
            {currentEntry.break_start && (
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Início Pausa:</span>
                <span className="font-medium">{format(new Date(currentEntry.break_start), 'HH:mm:ss')}</span>
              </div>
            )}
            {currentEntry.break_end && (
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Fim Pausa:</span>
                <span className="font-medium">{format(new Date(currentEntry.break_end), 'HH:mm:ss')}</span>
              </div>
            )}
            {currentEntry.clock_out && (
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground">Saída:</span>
                <span className="font-medium">{format(new Date(currentEntry.clock_out), 'HH:mm:ss')}</span>
              </div>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="space-y-2">
          {!hasClockIn && (
            <Button 
              onClick={handleClockIn} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Registrar Entrada
            </Button>
          )}

          {hasClockIn && !hasClockOut && (
            <>
              {!currentEntry?.break_start && (
                <Button 
                  onClick={handleBreakStart} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Coffee className="mr-2 h-4 w-4" />
                  Iniciar Pausa
                </Button>
              )}

              {currentEntry?.break_start && !currentEntry?.break_end && (
                <Button 
                  onClick={handleBreakEnd} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Finalizar Pausa
                </Button>
              )}

              <Button 
                onClick={handleClockOut} 
                disabled={loading || isOnBreak}
                variant="default"
                className="w-full"
                size="lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Registrar Saída
              </Button>
            </>
          )}

          {hasClockOut && (
            <div className="text-center py-4">
              <Badge variant="outline" className="text-base px-4 py-2">
                Ponto do dia finalizado
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                Total trabalhado: {currentEntry.total_hours?.toFixed(2)}h
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
