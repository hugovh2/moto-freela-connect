-- Add real-time location tracking system

-- Add location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_lat DECIMAL(10,8),
ADD COLUMN current_lng DECIMAL(11,8),
ADD COLUMN location_updated_at TIMESTAMPTZ,
ADD COLUMN is_available BOOLEAN DEFAULT false,
ADD COLUMN last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Create location history table for tracking motoboy movements
CREATE TABLE public.location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(8,2),
  speed DECIMAL(8,2), -- km/h
  heading DECIMAL(5,2), -- degrees
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_location_history_user_id ON public.location_history(user_id);
CREATE INDEX idx_location_history_service_id ON public.location_history(service_id);
CREATE INDEX idx_location_history_created_at ON public.location_history(created_at DESC);
CREATE INDEX idx_profiles_current_location ON public.profiles USING GIST (ll_to_earth(current_lat, current_lng));
CREATE INDEX idx_profiles_available ON public.profiles(is_available);

-- Enable RLS for location history
ALTER TABLE public.location_history ENABLE ROW LEVEL SECURITY;

-- Location history policies
CREATE POLICY "Users can insert own location"
  ON public.location_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own location history"
  ON public.location_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Companies can view motoboy location during active service"
  ON public.location_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.services s
      WHERE s.id = service_id
      AND s.company_id = auth.uid()
      AND s.status IN ('accepted', 'collected', 'in_progress')
    )
  );

-- Function to update user location
CREATE OR REPLACE FUNCTION update_user_location(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_accuracy DECIMAL DEFAULT NULL,
  p_speed DECIMAL DEFAULT NULL,
  p_heading DECIMAL DEFAULT NULL,
  p_service_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update current location in profiles
  UPDATE public.profiles
  SET 
    current_lat = p_lat,
    current_lng = p_lng,
    location_updated_at = NOW(),
    last_seen_at = NOW()
  WHERE id = auth.uid();

  -- Insert into location history
  INSERT INTO public.location_history (
    user_id,
    service_id,
    lat,
    lng,
    accuracy,
    speed,
    heading
  ) VALUES (
    auth.uid(),
    p_service_id,
    p_lat,
    p_lng,
    p_accuracy,
    p_speed,
    p_heading
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set availability status
CREATE OR REPLACE FUNCTION set_availability_status(p_available BOOLEAN)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_available = p_available,
    last_seen_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find nearby services for motoboys
CREATE OR REPLACE FUNCTION get_nearby_services(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  service_type TEXT,
  pickup_location TEXT,
  delivery_location TEXT,
  price DECIMAL,
  status service_status,
  distance_km DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.service_type,
    s.pickup_location,
    s.delivery_location,
    s.price,
    s.status,
    ROUND(
      (earth_distance(
        ll_to_earth(p_lat, p_lng),
        ll_to_earth(s.pickup_lat, s.pickup_lng)
      ) / 1000)::DECIMAL, 2
    ) AS distance_km,
    s.created_at
  FROM public.services s
  WHERE 
    s.status = 'available'
    AND s.pickup_lat IS NOT NULL 
    AND s.pickup_lng IS NOT NULL
    AND earth_distance(
      ll_to_earth(p_lat, p_lng),
      ll_to_earth(s.pickup_lat, s.pickup_lng)
    ) <= (p_radius_km * 1000)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get motoboy's current location for companies
CREATE OR REPLACE FUNCTION get_motoboy_location(p_service_id UUID)
RETURNS TABLE (
  lat DECIMAL,
  lng DECIMAL,
  updated_at TIMESTAMPTZ,
  accuracy DECIMAL,
  speed DECIMAL,
  heading DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.current_lat,
    p.current_lng,
    p.location_updated_at,
    lh.accuracy,
    lh.speed,
    lh.heading
  FROM public.services s
  JOIN public.profiles p ON p.id = s.motoboy_id
  LEFT JOIN LATERAL (
    SELECT accuracy, speed, heading
    FROM public.location_history lh2
    WHERE lh2.user_id = s.motoboy_id
      AND lh2.service_id = s.id
    ORDER BY lh2.created_at DESC
    LIMIT 1
  ) lh ON true
  WHERE s.id = p_service_id
    AND s.company_id = auth.uid()
    AND s.status IN ('accepted', 'collected', 'in_progress');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to clean old location history (keep only last 7 days)
CREATE OR REPLACE FUNCTION cleanup_location_history()
RETURNS void AS $$
BEGIN
  DELETE FROM public.location_history
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (this would typically be done with pg_cron in production)
-- For now, we'll just create the function and it can be called manually or via a scheduled job

-- Enable realtime for location updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_history;
