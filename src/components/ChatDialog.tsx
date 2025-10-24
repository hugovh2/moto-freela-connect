import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MapPin, Image, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/use-haptics";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'location';
  read_at?: string;
  created_at: string;
  sender_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
}

const ChatDialog = ({ 
  open, 
  onOpenChange, 
  serviceId, 
  receiverId, 
  receiverName,
  receiverAvatar 
}: ChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const haptics = useHaptics();

  useEffect(() => {
    if (open) {
      getCurrentUser();
      fetchMessages();
      markMessagesAsRead();
      setupRealtimeSubscription();
    }
  }, [open, serviceId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser(profile);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:sender_id(full_name, avatar_url)
        `)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error("Erro ao carregar mensagens");
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel(`messages:${serviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `service_id=eq.${serviceId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Haptic feedback for received messages
          if (newMessage.sender_id !== currentUser?.id) {
            haptics.light();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const markMessagesAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.rpc('mark_messages_as_read', {
        p_service_id: serviceId,
        p_user_id: user.id
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          service_id: serviceId,
          sender_id: currentUser.id,
          receiver_id: receiverId,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      haptics.light();
      setNewMessage("");
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const sendLocation = async () => {
    if (!currentUser) return;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationText = `Localização: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          try {
            const { error } = await supabase
              .from('messages')
              .insert({
                service_id: serviceId,
                sender_id: currentUser.id,
                receiver_id: receiverId,
                content: locationText,
                message_type: 'location'
              });

            if (error) throw error;
            haptics.success();
          } catch (error: any) {
            toast.error("Erro ao compartilhar localização");
          }
        },
        () => {
          toast.error("Não foi possível obter sua localização");
        }
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const QuickMessages = () => {
    const quickMessages = [
      "Estou a caminho!",
      "Cheguei no local",
      "Onde exatamente?",
      "Entrega realizada!",
      "Obrigado!"
    ];

    return (
      <div className="flex gap-2 p-2 overflow-x-auto">
        {quickMessages.map((msg, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="whitespace-nowrap text-xs"
            onClick={() => setNewMessage(msg)}
          >
            {msg}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={receiverAvatar} />
              <AvatarFallback>
                {receiverName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-lg">{receiverName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // In a real app, this would initiate a call
                    toast.info("Funcionalidade de ligação em desenvolvimento");
                  }}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Messages */}
        <QuickMessages />

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" style={{ height: '300px' }}>
          <div className="space-y-3">
            {messages.map((message) => {
              const isSender = message.sender_id === currentUser?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] p-3 rounded-lg
                      ${isSender 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                      }
                    `}
                  >
                    {message.message_type === 'location' ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{message.content}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const coords = message.content.split(': ')[1];
                            window.open(`https://maps.google.com/?q=${coords}`, '_blank');
                          }}
                        >
                          Ver no Mapa
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs opacity-70">
                        {formatTime(message.created_at)}
                      </span>
                      {isSender && message.read_at && (
                        <span className="text-xs opacity-70">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="flex gap-2 p-4 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={sendLocation}
          >
            <MapPin className="h-4 w-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          
          <Button 
            type="submit" 
            size="sm"
            disabled={!newMessage.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
