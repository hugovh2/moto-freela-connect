-- Criar enum para tipos de mensagem
CREATE TYPE message_type AS ENUM ('text', 'image', 'location');

-- Criar enum para app_role (sistema de roles seguro)
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'company', 'motoboy');

-- Tabela de roles de usuários (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Função para verificar role (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Tabela de mensagens (chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas de mensagens
CREATE POLICY "Users can view messages where they are sender or receiver"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Tabela de avaliações
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (service_id, rater_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Políticas de avaliações
CREATE POLICY "Anyone can view ratings"
ON public.ratings
FOR SELECT
USING (true);

CREATE POLICY "Users can create ratings for services they participated"
ON public.ratings
FOR INSERT
WITH CHECK (
  auth.uid() = rater_id AND
  EXISTS (
    SELECT 1 FROM public.services 
    WHERE id = service_id 
    AND (company_id = auth.uid() OR motoboy_id = auth.uid())
  )
);

-- Tabela de localizações de usuários
CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy NUMERIC,
  is_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Políticas de localização
CREATE POLICY "Motoboys can view locations of available motoboys"
ON public.user_locations
FOR SELECT
USING (
  is_available = true OR 
  auth.uid() = user_id
);

CREATE POLICY "Users can update own location"
ON public.user_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location data"
ON public.user_locations
FOR UPDATE
USING (auth.uid() = user_id);

-- Função para atualizar localização do usuário
CREATE OR REPLACE FUNCTION public.update_user_location(
  _latitude NUMERIC,
  _longitude NUMERIC,
  _accuracy NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_locations (user_id, latitude, longitude, accuracy, updated_at)
  VALUES (auth.uid(), _latitude, _longitude, _accuracy, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    updated_at = now();
END;
$$;

-- Função para definir status de disponibilidade
CREATE OR REPLACE FUNCTION public.set_availability_status(_is_available BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_locations
  SET is_available = _is_available, updated_at = now()
  WHERE user_id = auth.uid();
  
  IF NOT FOUND THEN
    INSERT INTO public.user_locations (user_id, latitude, longitude, is_available)
    VALUES (auth.uid(), 0, 0, _is_available);
  END IF;
END;
$$;

-- Função para buscar serviços próximos
CREATE OR REPLACE FUNCTION public.get_nearby_services(
  _latitude NUMERIC,
  _longitude NUMERIC,
  _radius_km NUMERIC DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  title TEXT,
  description TEXT,
  service_type TEXT,
  pickup_location TEXT,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  delivery_location TEXT,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  price NUMERIC,
  status service_status,
  distance_km NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.company_id,
    s.title,
    s.description,
    s.service_type,
    s.pickup_location,
    s.pickup_lat,
    s.pickup_lng,
    s.delivery_location,
    s.delivery_lat,
    s.delivery_lng,
    s.price,
    s.status,
    (
      6371 * acos(
        cos(radians(_latitude)) * cos(radians(s.pickup_lat)) *
        cos(radians(s.pickup_lng) - radians(_longitude)) +
        sin(radians(_latitude)) * sin(radians(s.pickup_lat))
      )
    ) AS distance_km
  FROM public.services s
  WHERE s.status = 'available'
  AND (
    6371 * acos(
      cos(radians(_latitude)) * cos(radians(s.pickup_lat)) *
      cos(radians(s.pickup_lng) - radians(_longitude)) +
      sin(radians(_latitude)) * sin(radians(s.pickup_lat))
    )
  ) <= _radius_km
  ORDER BY distance_km;
END;
$$;

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(_service_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages
  SET read = true
  WHERE service_id = _service_id
  AND receiver_id = auth.uid()
  AND read = false;
END;
$$;

-- Trigger para atualizar updated_at em user_locations
CREATE TRIGGER update_user_locations_updated_at
BEFORE UPDATE ON public.user_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Habilitar realtime para serviços
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;

-- Habilitar realtime para localizações
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;