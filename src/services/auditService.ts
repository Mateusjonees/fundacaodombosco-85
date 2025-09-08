export interface AuditLogEntry {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  old_data?: any;
  new_data?: any;
  metadata?: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export class AuditService {
  static async logAction(data: {
    entityType: string;
    entityId?: string;
    action: string;
    oldData?: any;
    newData?: any;
    metadata?: any;
  }) {
    try {
      // For now, just log to console until audit_logs table is created
      console.log('Audit Service Log:', {
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
  }

  static async getUserAuditLogs(userId?: string, limit = 100): Promise<AuditLogEntry[]> {
    // Return empty array until audit_logs table is created
    console.log('getUserAuditLogs called for userId:', userId);
    return [];
  }

  static async getEntityAuditLogs(entityType: string, entityId: string, limit = 50): Promise<AuditLogEntry[]> {
    // Return empty array until audit_logs table is created
    console.log('getEntityAuditLogs called for:', entityType, entityId);
    return [];
  }

  // Update user session activity
  static async updateUserActivity() {
    try {
      // For now, just log to console until user_sessions table is created
      console.log('User activity updated at:', new Date().toISOString());
    } catch (error) {
      console.error('Unexpected error updating user activity:', error);
    }
  }
}