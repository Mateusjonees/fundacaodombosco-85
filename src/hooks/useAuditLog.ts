import { useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export interface AuditLogData {
  entityType: string;
  entityId?: string;
  action: string;
  oldData?: any;
  newData?: any;
  metadata?: any;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = useCallback(async (data: AuditLogData) => {
    if (!user) return;

    try {
      // For now, just log to console until audit_logs table is created
      console.log('Audit Log:', {
        user_id: user.id,
        entity_type: data.entityType,
        entity_id: data.entityId,
        action: data.action,
        old_data: data.oldData,
        new_data: data.newData,
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Unexpected error logging audit action:', error);
    }
  }, [user]);

  return { logAction };
};