import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  MessageCircle, 
  ArrowLeft,
  Search,
  Users,
  Phone,
  Video
} from 'lucide-react';

interface Contact {
  user_id: string;
  name: string;
  employee_role: string;
  email: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  message_body: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
  is_read: boolean;
}

export const MessagingApp = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    console.log('MessagingApp: Iniciando...');
    if (user?.id) {
      console.log('MessagingApp: Usuário logado:', user.id);
      loadContacts();
      setupRealtimeSubscription();
    } else {
      console.log('MessagingApp: Usuário não logado');
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact && user?.id) {
      console.log('MessagingApp: Carregando mensagens para:', selectedContact);
      loadMessages(selectedContact);
    }
  }, [selectedContact, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadContacts = async () => {
    try {
      console.log('MessagingApp: Carregando contatos...');
      
      // Buscar todos os usuários ativos exceto o usuário atual
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role, email')
        .neq('user_id', user?.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('MessagingApp: Erro ao carregar profiles:', error);
        throw error;
      }

      console.log('MessagingApp: Profiles carregados:', profiles?.length || 0);

      if (!profiles || profiles.length === 0) {
        console.log('MessagingApp: Nenhum profile encontrado');
        setContacts([]);
        return;
      }

      // Para cada contato, buscar última mensagem e contagem não lidas
      const contactsWithMessages = await Promise.all(
        profiles.map(async (profile) => {
          try {
            // Última mensagem entre os usuários
            const { data: lastMessage, error: msgError } = await supabase
              .from('internal_messages')
              .select('message_body, created_at')
              .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${profile.user_id}),and(sender_id.eq.${profile.user_id},recipient_id.eq.${user?.id})`)
              .is('channel_id', null)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (msgError) {
              console.error('MessagingApp: Erro ao buscar última mensagem:', msgError);
            }

            // Mensagens não lidas deste usuário para mim
            const { count: unreadCount, error: countError } = await supabase
              .from('internal_messages')
              .select('*', { count: 'exact' })
              .eq('sender_id', profile.user_id)
              .eq('recipient_id', user?.id)
              .eq('is_read', false)
              .is('channel_id', null);

            if (countError) {
              console.error('MessagingApp: Erro ao contar mensagens não lidas:', countError);
            }

            return {
              user_id: profile.user_id,
              name: profile.name || 'Usuário',
              employee_role: profile.employee_role || 'staff',
              email: profile.email || '',
              last_message: lastMessage?.message_body,
              last_message_time: lastMessage?.created_at,
              unread_count: unreadCount || 0
            } as Contact;
          } catch (contactError) {
            console.error('MessagingApp: Erro ao processar contato:', contactError);
            return {
              user_id: profile.user_id,
              name: profile.name || 'Usuário',
              employee_role: profile.employee_role || 'staff',
              email: profile.email || '',
              unread_count: 0
            } as Contact;
          }
        })
      );

      // Ordenar contatos: não lidas primeiro, depois por última mensagem
      contactsWithMessages.sort((a, b) => {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        
        if (a.last_message_time && b.last_message_time) {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        }
        if (a.last_message_time) return -1;
        if (b.last_message_time) return 1;
        return a.name.localeCompare(b.name);
      });

      console.log('MessagingApp: Contatos processados:', contactsWithMessages.length);
      setContacts(contactsWithMessages);
      
    } catch (error) {
      console.error('MessagingApp: Erro geral ao carregar contatos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os contatos.",
      });
    }
  };

  const loadMessages = async (contactUserId: string) => {
    try {
      console.log('MessagingApp: Carregando mensagens entre:', user?.id, 'e', contactUserId);
      
      const { data, error } = await supabase
        .from('internal_messages')
        .select('id, message_body, sender_id, recipient_id, created_at, is_read')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${contactUserId}),and(sender_id.eq.${contactUserId},recipient_id.eq.${user?.id})`)
        .is('channel_id', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('MessagingApp: Erro ao carregar mensagens:', error);
        throw error;
      }

      console.log('MessagingApp: Mensagens carregadas:', data?.length || 0);
      setMessages(data || []);

      // Marcar mensagens como lidas
      const { error: updateError } = await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('sender_id', contactUserId)
        .eq('recipient_id', user?.id)
        .eq('is_read', false)
        .is('channel_id', null);

      if (updateError) {
        console.error('MessagingApp: Erro ao marcar como lida:', updateError);
      } else {
        console.log('MessagingApp: Mensagens marcadas como lidas');
        // Recarregar contatos para atualizar contadores
        loadContacts();
      }

    } catch (error) {
      console.error('MessagingApp: Erro geral ao carregar mensagens:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as mensagens.",
      });
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('MessagingApp: Configurando subscription em tempo real...');
    
    const subscription = supabase
      .channel('messaging_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
        },
        async (payload) => {
          console.log('MessagingApp: Nova mensagem recebida:', payload);
          
          const newMessage = payload.new as ChatMessage;
          
          // Se a mensagem é para mim ou de mim para o contato selecionado
          if (selectedContact && (
            (newMessage.sender_id === selectedContact && newMessage.recipient_id === user?.id) ||
            (newMessage.sender_id === user?.id && newMessage.recipient_id === selectedContact)
          )) {
            console.log('MessagingApp: Atualizando conversa atual');
            await loadMessages(selectedContact);
          }
          
          // Sempre recarregar contatos para atualizar contadores
          await loadContacts();
        }
      )
      .subscribe((status) => {
        console.log('MessagingApp: Status da subscription:', status);
      });

    return () => {
      console.log('MessagingApp: Removendo subscription');
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!messageText.trim() || loading || !selectedContact || !user?.id) {
      console.log('MessagingApp: Não é possível enviar - dados inválidos');
      return;
    }

    setLoading(true);
    console.log('MessagingApp: Enviando mensagem...');

    try {
      const messageData = {
        sender_id: user.id,
        recipient_id: selectedContact,
        message_body: messageText.trim(),
        subject: 'Mensagem direta',
        message_type: 'text',
        is_read: false
      };

      console.log('MessagingApp: Dados da mensagem:', messageData);

      const { data, error } = await supabase
        .from('internal_messages')
        .insert(messageData)
        .select('*')
        .single();

      if (error) {
        console.error('MessagingApp: Erro ao inserir mensagem:', error);
        throw error;
      }

      console.log('MessagingApp: Mensagem enviada:', data);

      // Adicionar mensagem à lista atual
      if (data) {
        setMessages(prev => [...prev, {
          id: data.id,
          message_body: data.message_body,
          sender_id: data.sender_id,
          recipient_id: data.recipient_id,
          created_at: data.created_at,
          is_read: data.is_read
        }]);
      }

      setMessageText('');
      
      // Recarregar contatos para atualizar ordem
      await loadContacts();
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso!",
      });

    } catch (error) {
      console.error('MessagingApp: Erro geral ao enviar mensagem:', error);
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
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      director: 'bg-purple-600',
      coordinator_madre: 'bg-blue-600',
      coordinator_floresta: 'bg-green-600',
      physiotherapist: 'bg-orange-600',
      therapist: 'bg-teal-600',
      receptionist: 'bg-pink-600',
      staff: 'bg-gray-600'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-600';
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

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedContactInfo = contacts.find(c => c.user_id === selectedContact);

  // Layout mobile: mostrar lista ou chat
  const showChatInMobile = isMobile && selectedContact;
  const showContactsList = !isMobile || !selectedContact;

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background border rounded-lg overflow-hidden">
      {/* Lista de Contatos */}
      {showContactsList && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} border-r bg-background flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Mensagens
              </h2>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de Contatos */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum contato encontrado</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredContacts.map((contact) => (
                    <Button
                      key={contact.user_id}
                      variant={selectedContact === contact.user_id ? "secondary" : "ghost"}
                      className="w-full justify-start p-3 h-auto hover:bg-muted/80"
                      onClick={() => setSelectedContact(contact.user_id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-12 w-12 border-2 border-background">
                          <AvatarFallback className={`text-white font-semibold ${getRoleColor(contact.employee_role)}`}>
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium truncate text-foreground">
                              {contact.name}
                            </span>
                            {contact.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs min-w-[20px] h-5">
                                {contact.unread_count > 99 ? '99+' : contact.unread_count}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-1">
                            {getRoleLabel(contact.employee_role)}
                          </p>
                          
                          {contact.last_message && (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate flex-1 mr-2">
                                {contact.last_message.length > 35 
                                  ? `${contact.last_message.substring(0, 35)}...` 
                                  : contact.last_message
                                }
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTime(contact.last_message_time!)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Área de Chat */}
      {(!isMobile || showChatInMobile) && (
        <div className="flex-1 flex flex-col bg-background">
          {selectedContact && selectedContactInfo ? (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedContact(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`text-white ${getRoleColor(selectedContactInfo.employee_role)}`}>
                        {selectedContactInfo.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {selectedContactInfo.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getRoleLabel(selectedContactInfo.employee_role)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-muted/20 to-background">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Nenhuma mensagem ainda</p>
                    <p className="text-sm">Envie a primeira mensagem para {selectedContactInfo.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.sender_id === user?.id;
                      
                      return (
                        <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                            <Card className={`${
                              isCurrentUser 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'bg-card border'
                            } shadow-sm`}>
                              <CardContent className="p-3">
                                <p className="text-sm whitespace-pre-wrap break-words mb-1">
                                  {message.message_body}
                                </p>
                                <span className={`text-xs ${
                                  isCurrentUser 
                                    ? 'text-primary-foreground/70' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {formatTime(message.created_at)}
                                </span>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input de Mensagem */}
              <div className="p-4 border-t bg-background">
                <div className="flex gap-3">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Mensagem para ${selectedContactInfo.name}...`}
                    className="flex-1 bg-muted/50 border-muted"
                    disabled={loading}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={loading || !messageText.trim()}
                    size="lg"
                    className="px-6"
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
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-muted/20 to-background">
              <div className="text-center text-muted-foreground max-w-md">
                <MessageCircle className="h-20 w-20 mx-auto mb-6 opacity-30" />
                <h3 className="text-xl font-semibold mb-3">Bem-vindo ao Chat</h3>
                <p className="text-sm leading-relaxed">
                  Selecione um contato na lista à esquerda para iniciar uma conversa. 
                  Você pode enviar mensagens diretas para qualquer membro da equipe.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};