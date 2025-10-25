-- ============================================
-- CORREÇÃO COMPLETA DO SISTEMA DE ROLES
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Garantir que a tabela user_roles existe
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 2. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role during signup" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for user_roles" ON public.user_roles;

-- 4. Criar políticas corretas
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own role"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Garantir que todos os usuários existentes tenham roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'motoboy'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Verificar se a função handle_new_user está correta
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'motoboy')
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha
    RAISE LOG 'Erro no handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 7. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Verificar se a tabela profiles tem a coluna role (opcional)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;

-- 9. Sincronizar roles da tabela profiles para user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.profiles
WHERE role IS NOT NULL
  AND id NOT IN (SELECT user_id FROM public.user_roles WHERE role = profiles.role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 10. Verificar resultado
SELECT '=== VERIFICAÇÃO FINAL ===' AS info;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'motoboy' THEN 1 END) as motoboys,
  COUNT(CASE WHEN role = 'company' THEN 1 END) as companies
FROM public.user_roles;

-- 11. Mostrar usuários sem roles
SELECT '=== USUÁRIOS SEM ROLES ===' AS info;
SELECT u.id, u.email, p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE ur.user_id IS NULL;
