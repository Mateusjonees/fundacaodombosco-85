import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function PendingAttendancesNotification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, [user]);

  useEffect(() => {
    if (hasPermission) {
      loadPendingCount();
      // Recarregar a cada 30 segundos
      const interval = setInterval(loadPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [hasPermission]);

  const checkPermissions = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('employee_role')
        .eq('user_id', user.id)
        .single();

      const allowedRoles = ['director', 'coordinator_madre', 'coordinator_floresta'];
      setHasPermission(profile && allowedRoles.includes(profile.employee_role));
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('attendance_reports')
        .select('*', { count: 'exact', head: true })
        .eq('validation_status', 'pending_validation');

      if (error) throw error;
      setPendingCount(count || 0);
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  if (!hasPermission || pendingCount === 0) {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/attendance-validation')}
      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent rounded-md transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-medium">Atendimentos Pendentes</span>
      </div>
      <Badge variant="destructive" className="px-2 py-0 text-xs min-w-[20px] h-[20px] flex items-center justify-center">
        {pendingCount}
      </Badge>
    </button>
  );
}