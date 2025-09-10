import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  MessageCircle, 
  Circle,
  Search,
  Users
} from 'lucide-react';

interface User {
  user_id: string;
  name: string;
  employee_role: string;
  email: string;
  is_online?: boolean;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface Message {
  id: string;
  message_body: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
  sender_name?: string;
}

export const DirectMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadUsers();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role, email')
        .neq('user_id', user?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Para cada usuário, buscar a última mensagem e contagem de não lidas
      const usersWithMessages = await Promise.all(
        (data || []).map(async (dbUser) => {
          // Última mensagem entre os usuários
          const { data: lastMessage } = await supabase
            .from('internal_messages')
            .select('message_body, created_at')
            .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${dbUser.user_id}),and(sender_id.eq.${dbUser.user_id},recipient_id.eq.${user?.id})`)
            .is('channel_id', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Mensagens não lidas deste usuário
          const { count: unreadCount } = await supabase
            .from('internal_messages')
            .select('*', { count: 'exact' })
            .eq('sender_id', dbUser.user_id)
            .eq('recipient_id', user?.id)
            .eq('is_read', false)
            .is('channel_id', null);

          return {
            user_id: dbUser.user_id,
            name: dbUser.name,
            employee_role: dbUser.employee_role,
            email: dbUser.email,
            last_message: lastMessage?.message_body,
            last_message_time: lastMessage?.created_at,
            unread_count: unreadCount || 0
          } as User;
        })
      );

      // Ordenar por mensagens não lidas primeiro, depois por última mensagem
      usersWithMessages.sort((a, b) => {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        
        if (a.last_message_time && b.last_message_time) {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        }
        if (a.last_message_time) return -1;
        if (b.last_message_time) return 1;
        return a.name.localeCompare(b.name);
      });

      setUsers(usersWithMessages);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
      });
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select(`
          id, 
          message_body, 
          sender_id, 
          recipient_id, 
          created_at, 
          is_read,
          sender:profiles!internal_messages_sender_id_fkey(name)
        `)
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user?.id})`)
        .is('channel_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithSender = (data || []).map(msg => ({
        ...msg,
        sender_name: (msg as any).sender?.name || 'Usuário'
      }));

      setMessages(messagesWithSender as Message[]);

      // Marcar mensagens como lidas
      await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user?.id)
        .is('channel_id', null);

      // Recarregar lista de usuários para atualizar contadores
      loadUsers();
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
      });
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('direct_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${user?.id}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Se a mensagem é da conversa atual, recarregar
          if (selectedUser && payload.new.sender_id === selectedUser) {
            await loadMessages(selectedUser);
          }
          
          // Sempre recarregar lista de usuários para atualizar contadores
          await loadUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!messageText.trim() || loading || !selectedUser) return;

    setLoading(true);
    try {
      const messageData = {
        sender_id: user?.id,
        recipient_id: selectedUser,
        message_body: messageText.trim(),
        subject: `Mensagem direta`,
        message_type: 'text',
        is_read: false
      };

      const { data: insertedMessage, error } = await supabase
        .from('internal_messages')
        .insert(messageData)
        .select('*')
        .single();

      if (error) throw error;

      // Adicionar mensagem à lista atual
      const messageWithSender = {
        ...insertedMessage,
        sender_name: user?.user_metadata?.name || user?.email || 'Você'
      };

      setMessages(prev => [...prev, messageWithSender as Message]);
      setMessageText('');
      
      // Recarregar lista de usuários
      loadUsers();
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'agora';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      director: 'bg-purple-500',
      coordinator_madre: 'bg-blue-500',
      coordinator_floresta: 'bg-green-500',
      physiotherapist: 'bg-orange-500',
      therapist: 'bg-teal-500',
      receptionist: 'bg-pink-500',
      staff: 'bg-gray-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      director: 'Diretor',
      coordinator_madre: 'Coord. Madre',
      coordinator_floresta: 'Coord. Floresta',
      physiotherapist: 'Fisioterapeuta',
      therapist: 'Terapeuta',
      receptionist: 'Recepção',
      staff: 'Funcionário'
    };
    return labels[role as keyof typeof labels] || 'Funcionário';
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserInfo = users.find(u => u.user_id === selectedUser);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background">
      {/* Lista de Usuários */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Mensagens Diretas
          </CardTitle>
        </CardHeader>
        
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {filteredUsers.map(dmUser => (
              <Button
                key={dmUser.user_id}
                variant={selectedUser === dmUser.user_id ? "secondary" : "ghost"}
                className="w-full justify-start p-3 h-auto"
                onClick={() => setSelectedUser(dmUser.user_id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`text-white text-sm ${getRoleColor(dmUser.employee_role)}`}>
                        {dmUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Circle className="h-3 w-3 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{dmUser.name}</span>
                      {dmUser.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs ml-2 flex-shrink-0">
                          {dmUser.unread_count > 99 ? '99+' : dmUser.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {getRoleLabel(dmUser.employee_role)}
                    </p>
                    {dmUser.last_message && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate max-w-40">
                          {dmUser.last_message.length > 30 
                            ? `${dmUser.last_message.substring(0, 30)}...` 
                            : dmUser.last_message
                          }
                        </p>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatTime(dmUser.last_message_time!)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className="h-16 border-b bg-background px-6 flex items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`text-white text-sm ${getRoleColor(selectedUserInfo?.employee_role || 'staff')}`}>
                    {selectedUserInfo?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedUserInfo?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getRoleLabel(selectedUserInfo?.employee_role || 'staff')}
                  </p>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem ainda.</p>
                  <p className="text-sm">Inicie uma conversa!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    
                    return (
                      <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'justify-end' : ''}`}>
                        <div className={`max-w-md ${isCurrentUser ? 'order-2' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground">
                              {isCurrentUser ? 'Você' : message.sender_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 ${
                            isCurrentUser 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-card border'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message_body}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="border-t p-4 bg-background">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Mensagem para ${selectedUserInfo?.name}...`}
                  className="flex-1"
                  disabled={loading}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={loading || !messageText.trim()}
                  size="sm"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
              <p className="text-sm">Escolha um usuário na lista para iniciar uma conversa.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};