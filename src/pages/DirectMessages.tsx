import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, MessageCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
  user_id: string;
  name: string;
  employee_role: string;
  is_active: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  message_body: string;
  message_type?: string;
  priority?: string;
  created_at: string;
  is_read: boolean;
  metadata?: any;
  sender?: User;
}

interface Conversation {
  user: User;
  lastMessage?: Message;
  unreadCount: number;
}

export default function DirectMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.user_id);
      markMessagesAsRead(selectedUser.user_id);
    }
  }, [selectedUser]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('direct-messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `recipient_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          
          // Se a mensagem é do usuário selecionado, adicionar à lista
          if (payload.new.sender_id === selectedUser?.user_id) {
            loadMessages(selectedUser.user_id);
            markMessagesAsRead(selectedUser.user_id);
          }
          
          // Atualizar lista de conversas
          loadConversations();
          
          // Notificação
          toast({
            title: "Nova mensagem",
            description: "Você recebeu uma nova mensagem",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUsers = async () => {
    try {
      console.log('🔍 Carregando usuários disponíveis...');
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role, is_active')
        .eq('is_active', true)
        .neq('user_id', user?.id)
        .order('name');

      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        throw error;
      }
      
      console.log('✅ Usuários carregados:', data?.length || 0, data);
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários disponíveis.",
      });
    }
  };

  const loadConversations = async () => {
    try {
      // Buscar todas as mensagens onde o usuário é remetente ou destinatário
      const { data: messagesData, error } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messagesData || messagesData.length === 0) {
        setConversations([]);
        return;
      }

      // Buscar informações dos usuários envolvidos
      const userIds = [...new Set([
        ...messagesData.map(m => m.sender_id),
        ...messagesData.map(m => m.recipient_id)
      ])].filter(id => id !== user?.id);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role, is_active')
        .in('user_id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.user_id, u]));

      // Agrupar por conversação
      const conversationsMap = new Map<string, Conversation>();
      
      messagesData.forEach((msg) => {
        const otherUserId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
        const otherUser = usersMap.get(otherUserId);
        
        if (!otherUser) return;
        
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            user: otherUser,
            lastMessage: msg as Message,
            unreadCount: 0
          });
        }
        
        // Contar mensagens não lidas
        if (msg.recipient_id === user?.id && !msg.is_read) {
          const conv = conversationsMap.get(otherUserId);
          if (conv) {
            conv.unreadCount++;
          }
        }
      });

      setConversations(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error('Erro ao carregar conversações:', error);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Buscar informações dos remetentes
      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: sendersData } = await supabase
          .from('profiles')
          .select('user_id, name, employee_role, is_active')
          .in('user_id', senderIds);
        
        const sendersMap = new Map(sendersData?.map(s => [s.user_id, s]));
        
        const messagesWithSender = data.map(msg => ({
          ...msg,
          sender: sendersMap.get(msg.sender_id)
        })) as Message[];
        
        setMessages(messagesWithSender);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    try {
      await supabase
        .from('internal_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user?.id)
        .eq('sender_id', senderId)
        .eq('is_read', false);
      
      loadConversations();
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, digite uma mensagem",
      });
      return;
    }

    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado",
      });
      return;
    }

    try {
      console.log('Enviando mensagem:', {
        sender_id: user.id,
        recipient_id: selectedUser.user_id,
        message_body: newMessage.trim()
      });

      const { data, error } = await supabase
        .from('internal_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedUser.user_id,
          subject: 'Mensagem Direta',
          message_body: newMessage.trim(),
          message_type: 'general',
          priority: 'normal'
        })
        .select();

      if (error) {
        console.error('Erro detalhado ao enviar mensagem:', error);
        throw error;
      }

      console.log('Mensagem enviada com sucesso:', data);

      setNewMessage('');
      await loadMessages(selectedUser.user_id);
      await loadConversations();
      
      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada para ${selectedUser.name}`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: error.message || "Não foi possível enviar a mensagem. Tente novamente.",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Mensagens Diretas</h1>
          <p className="text-muted-foreground">Converse com outros usuários do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Conversas
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {/* Conversas existentes */}
              {conversations.length > 0 && (
                <div className="border-b">
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                    CONVERSAS RECENTES
                  </div>
                  {conversations.map((conv) => (
                    <button
                      key={conv.user.user_id}
                      onClick={() => setSelectedUser(conv.user)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                        selectedUser?.user_id === conv.user.user_id ? 'bg-muted' : ''
                      }`}
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(conv.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{conv.user.name}</p>
                          <div className="flex items-center gap-1">
                            {conv.lastMessage?.message_type === 'appointment_notification' && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400">
                                🔔
                              </Badge>
                            )}
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.message_body}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Todos os usuários */}
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                  TODOS OS USUÁRIOS ({filteredUsers.length})
                </div>
                {filteredUsers.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum usuário encontrado
                  </div>
                )}
                {filteredUsers.map((u) => (
                  <button
                    key={u.user_id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                      selectedUser?.user_id === u.user_id ? 'bg-muted' : ''
                    }`}
                  >
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.employee_role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="lg:col-span-2">
          {selectedUser ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedUser.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedUser.employee_role}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4" ref={scrollAreaRef}>
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Carregando mensagens...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Nenhuma mensagem ainda. Comece a conversar!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        const isNotification = msg.message_type === 'appointment_notification';
                        
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            {isNotification && !isOwn ? (
                              // Mensagem de notificação especial
                              <div className="max-w-[85%] rounded-lg border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-4 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="default" className="bg-blue-600">
                                    🔔 Notificação de Agendamento
                                  </Badge>
                                  {msg.priority === 'high' && (
                                    <Badge variant="destructive" className="text-xs">
                                      Importante
                                    </Badge>
                                  )}
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <pre className="whitespace-pre-wrap font-sans text-sm bg-white/50 dark:bg-black/20 p-3 rounded">
                                    {msg.message_body}
                                  </pre>
                                </div>
                                <p className="text-xs mt-2 text-muted-foreground">
                                  {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            ) : (
                              // Mensagem normal
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.message_body}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
