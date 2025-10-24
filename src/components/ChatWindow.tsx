import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Phone, MapPin, X, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  service_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'location' | 'image';
  read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
}

interface ChatWindowProps {
  serviceId: string;
  receiverId: string;
  receiverName: string;
  onClose?: () => void;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ChatWindow = ({ 
  serviceId, 
  receiverId, 
  receiverName,
  onClose,
  minimized = false,
  onToggleMinimize
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Mensagens rápidas
  const quickMessages = [
    '🏍️ Estou a caminho!',
    '📍 Cheguei no local',
    '✅ Coleta realizada',
    '🎉 Entrega concluída',
    '⏰ Atraso de 5 minutos',
  ];

  useEffect(() => {
    loadMessages();
    getCurrentUser();
    subscribeToMessages();
    subscribeToTyping();
  }, [serviceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      markAsRead();
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${serviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `service_id=eq.${serviceId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          
          // Marcar como lida se for recebida
          if (newMsg.sender_id !== currentUserId) {
            markAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = () => {
    const channel = supabase
      .channel(`typing:${serviceId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== currentUserId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendTypingIndicator = () => {
    supabase.channel(`typing:${serviceId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId },
    });
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    // Throttle typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    sendTypingIndicator();
    
    typingTimeoutRef.current = setTimeout(() => {
      // Stop typing after 2 seconds
    }, 2000);
  };

  const sendMessage = async (content: string, type: 'text' | 'location' = 'text') => {
    if (!content.trim() && type === 'text') return;
    
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('messages')
        .insert({
          service_id: serviceId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          message_type: type,
        });

      if (error) throw error;
      
      setNewMessage('');
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem: ' + error.message);
      console.error('Erro ao enviar:', error);
    } finally {
      setIsSending(false);
    }
  };

  const sendLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const locationText = `📍 Localização: https://www.google.com/maps?q=${latitude},${longitude}`;
      
      await sendMessage(locationText, 'location');
      toast.success('Localização compartilhada!');
    } catch (error) {
      toast.error('Erro ao obter localização');
      console.error('Erro localização:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('service_id', serviceId)
        .eq('receiver_id', currentUserId)
        .eq('read', false);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  if (minimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-primary text-white rounded-lg p-4 shadow-lg cursor-pointer hover:bg-primary/90 transition-colors"
        onClick={onToggleMinimize}
      >
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{receiverName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{receiverName}</p>
            <p className="text-xs opacity-90">Clique para abrir</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-0 right-0 md:bottom-4 md:right-4 w-full md:w-96 h-screen md:h-[600px] md:rounded-lg shadow-2xl flex flex-col z-50 rounded-none">
      <CardHeader className="border-b p-3 md:p-4 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{receiverName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{receiverName}</CardTitle>
              {isTyping && (
                <p className="text-xs text-muted-foreground">digitando...</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => window.open(`tel:${receiverId}`)}>
              <Phone className="h-4 w-4" />
            </Button>
            {onToggleMinimize && (
              <Button variant="ghost" size="icon" onClick={onToggleMinimize}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isSender = message.sender_id === currentUserId;
              const isLocation = message.message_type === 'location';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isSender
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {isLocation ? (
                      <a
                        href={message.content.split(': ')[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 underline"
                      >
                        <MapPin className="h-4 w-4" />
                        Ver localização
                      </a>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Quick Messages */}
        <div className="border-t p-2 shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar">
            {quickMessages.map((msg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="whitespace-nowrap text-xs px-2 py-1 h-auto shrink-0"
                onClick={() => sendMessage(msg)}
                disabled={isSending}
              >
                {msg}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 px-2 py-1 h-auto"
              onClick={sendLocation}
              disabled={isSending}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-3 md:p-4 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(newMessage);
                }
              }}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
