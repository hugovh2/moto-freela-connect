-- Add ratings system to existing tables

-- Add rating fields to services table for bilateral ratings
ALTER TABLE public.services 
ADD COLUMN company_rating INTEGER CHECK (company_rating >= 1 AND company_rating <= 5),
ADD COLUMN company_rating_comment TEXT,
ADD COLUMN motoboy_rating INTEGER CHECK (motoboy_rating >= 1 AND motoboy_rating <= 5),
ADD COLUMN motoboy_rating_comment TEXT,
ADD COLUMN company_rated_at TIMESTAMPTZ,
ADD COLUMN motoboy_rated_at TIMESTAMPTZ;

-- Create detailed ratings table for comprehensive review system
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  criteria JSONB, -- For specific criteria like punctuality, professionalism, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update user ratings when new rating is added
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  new_rating DECIMAL(3,2);
  rating_count INTEGER;
BEGIN
  -- Calculate new average rating for the rated user
  SELECT 
    ROUND(AVG(rating), 2),
    COUNT(*)
  INTO new_rating, rating_count
  FROM public.ratings
  WHERE to_user_id = NEW.to_user_id;

  -- Update the user's profile with new rating and count
  UPDATE public.profiles
  SET 
    rating = new_rating,
    total_jobs = rating_count,
    updated_at = NOW()
  WHERE id = NEW.to_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update ratings
CREATE TRIGGER update_user_rating_trigger
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- Create indexes for performance
CREATE INDEX idx_ratings_service_id ON public.ratings(service_id);
CREATE INDEX idx_ratings_from_user ON public.ratings(from_user_id);
CREATE INDEX idx_ratings_to_user ON public.ratings(to_user_id);

-- Enable RLS for ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Ratings policies
CREATE POLICY "Users can view ratings they gave or received"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create ratings for completed services"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_id 
      AND s.status = 'completed'
      AND (s.company_id = auth.uid() OR s.motoboy_id = auth.uid())
    )
  );

-- Create notification triggers for ratings
CREATE OR REPLACE FUNCTION notify_rating_received()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message
  ) VALUES (
    NEW.to_user_id,
    'new_rating',
    'Nova Avaliação Recebida',
    CASE 
      WHEN NEW.rating >= 4 THEN 'Você recebeu uma excelente avaliação!'
      ELSE 'Você recebeu uma nova avaliação'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger for rating notifications
CREATE TRIGGER notify_rating_received_trigger
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION notify_rating_received();
