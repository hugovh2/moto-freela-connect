-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services;
DROP POLICY IF EXISTS "Companies can update own services" ON public.services;

-- Create more flexible policies for service updates
CREATE POLICY "Companies can update own services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (
    company_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'company'
    )
  );

CREATE POLICY "Motoboys can update assigned services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (
    (motoboy_id = auth.uid() OR (motoboy_id IS NULL AND status = 'available')) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'motoboy'
    )
  );

-- Allow motoboys to accept available services
CREATE POLICY "Motoboys can accept available services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (
    status = 'available' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'motoboy'
    )
  )
  WITH CHECK (
    motoboy_id = auth.uid() AND
    status IN ('accepted', 'in_progress', 'completed')
  );
