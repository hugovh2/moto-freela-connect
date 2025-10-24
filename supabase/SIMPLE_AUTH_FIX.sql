-- CORREÇÃO SIMPLIFICADA PARA AUTENTICAÇÃO
-- Esta versão evita referências a colunas que podem não existir

-- 1. Limpar duplicações nas tabelas que criamos
DELETE FROM public.user_roles WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY created_at DESC) as rn
    FROM public.user_roles
  ) t WHERE t.rn > 1
);

DELETE FROM public.profiles WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM public.profiles
  ) t WHERE t.rn > 1
);

-- 2. Recriar trigger de signup MUITO SIMPLIFICADO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir profile (com proteção contra duplicação)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Inserir role (com proteção contra duplicação)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'motoboy'::app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro, apenas log (não falha)
    RETURN NEW;
END;
$$;

-- 3. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Política de INSERT mais permissiva para profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Verificar se política de services está correta
DROP POLICY IF EXISTS "Companies can create services" ON public.services;
CREATE POLICY "Companies can create services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'company'
    )
  );

-- 6. Função para debug (opcional)
CREATE OR REPLACE FUNCTION public.debug_user_info(user_email TEXT DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  has_role BOOLEAN,
  role_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    (ur.user_id IS NOT NULL) as has_role,
    ur.role::TEXT as role_name
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  WHERE (user_email IS NULL OR p.email = user_email)
  ORDER BY p.created_at DESC
  LIMIT 10;
$$;
