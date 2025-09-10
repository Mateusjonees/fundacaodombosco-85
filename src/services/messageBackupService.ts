import { supabase } from '@/integrations/supabase/client';

export interface MessageBackup {
  id: string;
  message_body: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id?: string;
  recipient_name?: string;
  channel_id?: string;
  channel_name?: string;
  created_at: string;
  message_type: string;
  is_read: boolean;
}

export class MessageBackupService {
  
  // Backup all messages to JSON format
  static async backupAllMessages(): Promise<Blob> {
    try {
      // Get all messages with profile information
      const { data: messages, error } = await supabase
        .from('internal_messages')
        .select(`
          *,
          sender:profiles!internal_messages_sender_id_fkey(name, employee_role),
          recipient:profiles!internal_messages_recipient_id_fkey(name, employee_role),
          channel:channels(name)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Format messages for backup
      const backupData: MessageBackup[] = (messages || []).map(msg => ({
        id: msg.id,
        message_body: msg.message_body,
        sender_id: msg.sender_id,
        sender_name: (msg as any).sender?.name || 'Usuário Desconhecido',
        sender_role: (msg as any).sender?.employee_role || 'staff',
        recipient_id: msg.recipient_id,
        recipient_name: (msg as any).recipient?.name,
        channel_id: msg.channel_id,
        channel_name: (msg as any).channel?.name,
        created_at: msg.created_at,
        message_type: msg.message_type,
        is_read: msg.is_read
      }));

      // Create backup object
      const backup = {
        backup_date: new Date().toISOString(),
        total_messages: backupData.length,
        messages: backupData
      };

      // Convert to JSON blob
      const jsonString = JSON.stringify(backup, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
      
    } catch (error) {
      console.error('Erro ao fazer backup das mensagens:', error);
      throw error;
    }
  }

  // Backup messages by date range
  static async backupMessagesByDate(startDate: string, endDate: string): Promise<Blob> {
    try {
      const { data: messages, error } = await supabase
        .from('internal_messages')
        .select(`
          *,
          sender:profiles!internal_messages_sender_id_fkey(name, employee_role),
          recipient:profiles!internal_messages_recipient_id_fkey(name, employee_role),
          channel:channels(name)
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const backupData: MessageBackup[] = (messages || []).map(msg => ({
        id: msg.id,
        message_body: msg.message_body,
        sender_id: msg.sender_id,
        sender_name: (msg as any).sender?.name || 'Usuário Desconhecido',
        sender_role: (msg as any).sender?.employee_role || 'staff',
        recipient_id: msg.recipient_id,
        recipient_name: (msg as any).recipient?.name,
        channel_id: msg.channel_id,
        channel_name: (msg as any).channel?.name,
        created_at: msg.created_at,
        message_type: msg.message_type,
        is_read: msg.is_read
      }));

      const backup = {
        backup_date: new Date().toISOString(),
        date_range: { start: startDate, end: endDate },
        total_messages: backupData.length,
        messages: backupData
      };

      const jsonString = JSON.stringify(backup, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
      
    } catch (error) {
      console.error('Erro ao fazer backup das mensagens por data:', error);
      throw error;
    }
  }

  // Download backup file
  static downloadBackup(blob: Blob, filename?: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `backup_mensagens_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Auto backup (run daily or on demand)
  static async createAutoBackup(): Promise<void> {
    try {
      const blob = await this.backupAllMessages();
      
      // Store backup info in local storage for tracking
      const backupInfo = {
        date: new Date().toISOString(),
        size: blob.size,
        messageCount: JSON.parse(await blob.text()).total_messages
      };
      
      localStorage.setItem('last_message_backup', JSON.stringify(backupInfo));
      
      // Optionally auto-download or save to storage bucket
      this.downloadBackup(blob, `backup_auto_${new Date().toISOString().split('T')[0]}.json`);
      
    } catch (error) {
      console.error('Erro no backup automático:', error);
      throw error;
    }
  }
}