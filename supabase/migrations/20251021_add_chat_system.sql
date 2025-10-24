-- Create chat system for real-time communication

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_messages_service_id ON public.messages(service_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies - only participants can see messages
CREATE POLICY "Users can view messages they sent or received"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages in active services"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_id 
      AND s.status IN ('accepted', 'collected', 'in_progress')
      AND (s.company_id = auth.uid() OR s.motoboy_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_service_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET read_at = NOW()
  WHERE service_id = p_service_id
    AND receiver_id = p_user_id
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.messages
    WHERE receiver_id = p_user_id
      AND read_at IS NULL
  )::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message
  ) VALUES (
    NEW.receiver_id,
    'new_message',
    'Nova Mensagem',
    'Você recebeu uma nova mensagem sobre seu serviço'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
