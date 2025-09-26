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
    <Button 
      variant="outline" 
      size="sm" 
      onClick={() => navigate('/attendance-validation')}
      className="relative gap-2 bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
    >
      <AlertCircle className="h-4 w-4" />
      <span className="hidden sm:inline">Validar Atendimentos</span>
      <Badge variant="destructive" className="absolute -top-2 -right-2 px-1 py-0 text-xs min-w-[20px] h-5">
        {pendingCount}
      </Badge>
    </Button>
  );
}