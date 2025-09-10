import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { usePresence } from '@/hooks/usePresence';
import { 
  Hash, 
  Users, 
  Send, 
  MessageCircle, 
  Circle,
  Plus,
  Settings,
  Search
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
}

interface Message {
  id: string;
  message_body: string;
  sender_id: string;
  channel_id?: string;
  recipient_id?: string;
  created_at: string;
  profiles?: {
    name: string;
    employee_role: string;
  };
}

interface DirectMessage {
  user_id: string;
  name: string;
  employee_role: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export const SlackChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { onlineUsers, totalOnline } = usePresence();
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedDM, setSelectedDM] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadChannels();
      loadDirectMessages();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChannel) {
      loadChannelMessages(selectedChannel.id);
      setSelectedDM(null);
    }
  }, [selectedChannel]);

  useEffect(() => {
    if (selectedDM) {
      loadDMMessages(selectedDM);
      setSelectedChannel(null);
    }
  }, [selectedDM]);

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('is_public', true)
        .order('name');

      if (error) throw error;
      setChannels(data || []);
      
      // Auto-select general channel
      const generalChannel = data?.find(c => c.name === 'geral');
      if (generalChannel && !selectedChannel && !selectedDM) {
        setSelectedChannel(generalChannel);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadDirectMessages = async () => {
    try {
      // Get all users for direct messages
      const { data: users, error } = await supabase
        .from('profiles')
        .select('user_id, name, employee_role')
        .neq('user_id', user?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // For each user, get the last message and unread count
      const dmList: DirectMessage[] = [];
      
      for (const dmUser of users || []) {
        // Get last message between current user and this user
        const { data: lastMessage } = await supabase
          .from('internal_messages')
          .select('message_body, created_at')
          .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${dmUser.user_id}),and(sender_id.eq.${dmUser.user_id},recipient_id.eq.${user?.id})`)
          .is('channel_id', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count (messages from this user to current user that are unread)
        const { count: unreadCount } = await supabase
          .from('internal_messages')
          .select('*', { count: 'exact' })
          .eq('sender_id', dmUser.user_id)
          .eq('recipient_id', user?.id)
          .eq('is_read', false)
          .is('channel_id', null);

        dmList.push({
          user_id: dmUser.user_id,
          name: dmUser.name,
          employee_role: dmUser.employee_role,
          last_message: lastMessage?.message_body,
          last_message_time: lastMessage?.created_at,
          unread_count: unreadCount || 0
        });
      }

      setDirectMessages(dmList);
    } catch (error) {
      console.error('Error loading direct messages:', error);
    }
  };

  const loadChannelMessages = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select(`
          *,
          profiles!internal_messages_sender_id_fkey (
            name,
            employee_role
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any) || []);
    } catch (error) {
      console.error('Error loading channel messages:', error);
    }
  };

  const loadDMMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('internal_messages')
        .select(`
          *,
          profiles!internal_messages_sender_id_fkey (
            name,
            employee_role
          )
        `)
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user?.id})`)
        .is('channel_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any) || []);

      // Mark messages as read
      await supabase
        .from('internal_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user?.id)
        .is('channel_id', null);
        
      loadDirectMessages(); // Reload to update unread counts
    } catch (error) {
      console.error('Error loading DM messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
        },
        (payload) => {
          console.log('New message:', payload);
          const newMessage = payload.new as Message;
          
          // If message is for current channel/DM, add it to messages
          if (selectedChannel && newMessage.channel_id === selectedChannel.id) {
            loadChannelMessages(selectedChannel.id);
          } else if (selectedDM && (
            (newMessage.sender_id === selectedDM && newMessage.recipient_id === user?.id) ||
            (newMessage.sender_id === user?.id && newMessage.recipient_id === selectedDM)
          )) {
            loadDMMessages(selectedDM);
          } else {
            // Update DM list to show new message indicators
            loadDirectMessages();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!messageText.trim() || loading) return;

    setLoading(true);
    try {
      const messageData = {
        sender_id: user?.id,
        message_body: messageText.trim(),
        subject: selectedChannel?.name || `Mensagem para ${directMessages.find(dm => dm.user_id === selectedDM)?.name}`,
        channel_id: selectedChannel?.id || null,
        recipient_id: selectedDM || null,
        message_type: 'text'
      };

      const { error } = await supabase
        .from('internal_messages')
        .insert(messageData);

      if (error) throw error;

      setMessageText('');
      
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
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.user_id === userId);
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDMs = directMessages.filter(dm =>
    dm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentChatName = selectedChannel?.name || 
    (selectedDM ? directMessages.find(dm => dm.user_id === selectedDM)?.name : '');

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar canais e pessoas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Online Users Count */}
        <div className="px-4 py-2 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
            <span>{totalOnline} online</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Channels */}
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Canais</span>
              <Plus className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
            </div>
            
            {filteredChannels.map(channel => (
              <Button
                key={channel.id}
                variant={selectedChannel?.id === channel.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 text-left"
                onClick={() => setSelectedChannel(channel)}
              >
                <Hash className="h-4 w-4 mr-2" />
                {channel.name}
              </Button>
            ))}
          </div>

          <Separator />

          {/* Direct Messages */}
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Mensagens Diretas</span>
              <Plus className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
            </div>
            
            {filteredDMs.map(dm => (
              <Button
                key={dm.user_id}
                variant={selectedDM === dm.user_id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1 text-left relative"
                onClick={() => setSelectedDM(dm.user_id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Circle 
                        className={`h-2 w-2 ${
                          isUserOnline(dm.user_id) 
                            ? 'fill-green-500 text-green-500' 
                            : 'fill-gray-400 text-gray-400'
                        }`} 
                      />
                    </div>
                    <span className="truncate">{dm.name}</span>
                  </div>
                  {dm.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {dm.unread_count}
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>

          <Separator />

          {/* Online Users */}
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Online</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            
            {onlineUsers.map(user => (
              <div key={user.user_id} className="flex items-center px-2 py-1 text-sm">
                <Circle className="h-2 w-2 fill-green-500 text-green-500 mr-2" />
                <span className="truncate">{user.profiles?.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-12 border-b bg-background px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedChannel && <Hash className="h-4 w-4" />}
            {selectedDM && <MessageCircle className="h-4 w-4" />}
            <span className="font-medium">{currentChatName}</span>
            {selectedChannel && (
              <span className="text-sm text-muted-foreground">
                ({channels.find(c => c.id === selectedChannel.id)?.description})
              </span>
            )}
          </div>
          <Settings className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                
                return (
                  <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {showAvatar && (
                      <div className={`w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium ${isCurrentUser ? 'order-1' : ''}`}>
                        {message.profiles?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className={`flex-1 ${!showAvatar ? (isCurrentUser ? 'mr-11' : 'ml-11') : ''}`}>
                      {showAvatar && (
                        <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                          <span className="font-medium text-sm">{message.profiles?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`rounded-lg p-3 max-w-md ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground ml-auto' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.message_body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Mensagem ${selectedChannel ? `#${selectedChannel.name}` : currentChatName}...`}
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};