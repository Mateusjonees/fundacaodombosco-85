import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Bell, Clock, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface TodaySchedule {
  id: string;
  title: string;
  start_time: string;
  clients?: {
    name: string;
  };
  profiles?: {
    name: string;
  };
  status: string;
}
export function ScheduleAlerts() {
  const {
    user
  } = useAuth();
  const [todaySchedules, setTodaySchedules] = useState<TodaySchedule[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadTodaySchedules();
    }
  }, [user]);
  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('employee_role').eq('user_id', user.id).single();
      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };
  const loadTodaySchedules = async () => {
    if (!user) return;
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      let query = supabase.from('schedules').select(`
          id, title, start_time, status,
          clients (name)
        `).gte('start_time', startOfDay).lte('start_time', endOfDay).in('status', ['scheduled', 'confirmed', 'completed', 'cancelled']).order('start_time');

      // Filter based on user role
      if (userProfile) {
        const isReceptionist = ['receptionist', 'administrative'].includes(userProfile.employee_role);
        const isDirectorOrCoordinator = ['director', 'coordinator_madre', 'coordinator_floresta', 'coordinator_atendimento_floresta'].includes(userProfile.employee_role);
        if (!isDirectorOrCoordinator && !isReceptionist) {
          // Staff members see only their appointments
          query = query.eq('employee_id', user.id);
        }
        // Directors, coordinators and receptionists see all appointments
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      setTodaySchedules(data || []);
    } catch (error) {
      console.error('Error loading today schedules:', error);
    }
  };

  // Auto refresh every 2 minutes and when userProfile changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && userProfile) {
        loadTodaySchedules();
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [user, userProfile]);
  if (!isVisible || todaySchedules.length === 0) return null;
  const nextAppointment = todaySchedules.find(schedule => {
    const scheduleTime = new Date(schedule.start_time);
    const now = new Date();
    return scheduleTime > now && ['scheduled', 'confirmed'].includes(schedule.status);
  });
  const currentAppointments = todaySchedules.filter(schedule => {
    const scheduleTime = new Date(schedule.start_time);
    const scheduleEnd = new Date(scheduleTime.getTime() + 60 * 60 * 1000); // Assuming 1 hour appointments
    const now = new Date();
    return now >= scheduleTime && now <= scheduleEnd && ['scheduled', 'confirmed'].includes(schedule.status);
  });

  // Calculate different status counts
  const pendingAppointments = todaySchedules.filter(s => ['scheduled', 'confirmed'].includes(s.status));
  const completedAppointments = todaySchedules.filter(s => s.status === 'completed');
  const cancelledAppointments = todaySchedules.filter(s => s.status === 'cancelled');
  return <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      
    </Card>;
}