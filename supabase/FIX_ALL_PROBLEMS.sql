-- ============================================
-- CORREÇÃO COMPLETA DE TODOS OS PROBLEMAS
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. CORRIGIR SISTEMA DE ROLES
-- ============================================

-- Garantir que a tabela user_roles existe
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role during signup" ON public.user_roles;
DROP POLICY IF EXISTS "Enable insert for user_roles" ON public.user_roles;

-- Criar políticas corretas
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Garantir que todos os usuários existentes tenham roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'motoboy'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. CORRIGIR SISTEMA DE STATUS
-- ============================================

-- Garantir que o enum service_status tem todos os valores
DO $$
BEGIN
  -- Adicionar 'pending' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'pending';
    RAISE NOTICE '✅ Status "pending" adicionado';
  END IF;

  -- Adicionar 'collected' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'collected' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'collected';
    RAISE NOTICE '✅ Status "collected" adicionado';
  END IF;

  -- Adicionar 'on_route' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'on_route' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'on_route';
    RAISE NOTICE '✅ Status "on_route" adicionado';
  END IF;

  -- Adicionar 'delivered' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'delivered' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'delivered';
    RAISE NOTICE '✅ Status "delivered" adicionado';
  END IF;
END $$;

-- 3. CORRIGIR STORAGE DE FOTOS
-- ============================================

-- Garantir que o bucket service-photos existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-photos', 
  'service-photos', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remover políticas antigas do storage
DROP POLICY IF EXISTS "storage_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Anyone authenticated can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "service_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "service_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "service_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "service_photos_delete" ON storage.objects;

-- Criar políticas corretas para o bucket service-photos
CREATE POLICY "service_photos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "service_photos_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-photos');

CREATE POLICY "service_photos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-photos')
WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "service_photos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos');

-- 4. CORRIGIR TABELAS NECESSÁRIAS
-- ============================================

-- Garantir que a tabela services tem todas as colunas necessárias
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER;

-- Garantir que a tabela transactions existe para o sistema de pagamento
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Garantir que a tabela user_locations existe para rastreamento
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  is_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela user_locations
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Políticas para user_locations
DROP POLICY IF EXISTS "Users can view own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update own location" ON public.user_locations;

CREATE POLICY "Users can view own location"
  ON public.user_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location"
  ON public.user_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
  ON public.user_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar status disponíveis
SELECT '=== STATUS DISPONÍVEIS ===' AS info;
SELECT enumlabel as status, enumsortorder as ordem
FROM pg_enum
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;

-- Verificar usuários e roles
SELECT '=== USUÁRIOS E ROLES ===' AS info;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'motoboy' THEN 1 END) as motoboys,
  COUNT(CASE WHEN role = 'company' THEN 1 END) as companies
FROM public.user_roles;

-- Verificar bucket de fotos
SELECT '=== BUCKET DE FOTOS ===' AS info;
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'service-photos';

-- Verificar serviços existentes
SELECT '=== SERVIÇOS EXISTENTES ===' AS info;
SELECT status, COUNT(*) as quantidade
FROM public.services
GROUP BY status
ORDER BY quantidade DESC;

SELECT '=== CORREÇÃO COMPLETA! ===' AS info;
