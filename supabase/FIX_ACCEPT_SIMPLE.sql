-- ============================================
-- CORREÇÃO SIMPLES PARA ACEITAR CORRIDA
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS DE UPDATE
-- ============================================

DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update assigned services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update own services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can accept available services" ON public.services;
DROP POLICY IF EXISTS "Companies can update own services" ON public.services;

-- 2. CRIAR POLÍTICA SIMPLES PARA UPDATE
-- ============================================

-- Política permissiva para UPDATE (temporária para debug)
CREATE POLICY "Allow all updates for debugging"
ON public.services
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. VERIFICAR SE USUÁRIO TEM ROLE
-- ============================================

-- Garantir que todos os usuários tenham roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'motoboy'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. VERIFICAR RESULTADO
-- ============================================

SELECT '=== POLÍTICAS CRIADAS ===' AS info;
SELECT policyname, cmd, permissive, roles
FROM pg_policies 
WHERE tablename = 'services' AND cmd = 'UPDATE';

SELECT '=== USUÁRIOS COM ROLES ===' AS info;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'motoboy' THEN 1 END) as motoboys,
  COUNT(CASE WHEN role = 'company' THEN 1 END) as companies
FROM public.user_roles;

SELECT '=== SERVIÇOS DISPONÍVEIS ===' AS info;
SELECT id, title, status, company_id, motoboy_id
FROM public.services
WHERE status = 'available'
ORDER BY created_at DESC
LIMIT 3;

SELECT '=== CORREÇÃO APLICADA ===' AS info;
