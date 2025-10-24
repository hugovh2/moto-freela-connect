-- Drop ALL existing policies on user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role during signup" ON public.user_roles;

-- Drop old RLS policies that reference the removed 'role' column
DROP POLICY IF EXISTS "Companies can create services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services;

-- Recreate policies using the user_roles table instead
CREATE POLICY "Companies can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'company')
);

CREATE POLICY "Motoboys can accept services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  status = 'available' AND 
  public.has_role(auth.uid(), 'motoboy')
);

-- Add missing enum value 'company' to app_role if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
                 JOIN pg_enum e ON t.oid = e.enumtypid 
                 WHERE t.typname = 'app_role' AND e.enumlabel = 'company') THEN
    ALTER TYPE app_role ADD VALUE 'company';
  END IF;
END $$;

-- Add policy to allow users to insert their own roles during signup
CREATE POLICY "Users can insert own role during signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add policy to allow users to view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update profiles trigger to use user_roles table and handle role insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to 'motoboy'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'motoboy'::app_role);
  
  -- Insert profile (without role column)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Remove role column from profiles if it still exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'profiles' 
             AND column_name = 'role') THEN
    ALTER TABLE public.profiles DROP COLUMN role;
  END IF;
END $$;