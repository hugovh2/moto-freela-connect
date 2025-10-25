-- ============================================
-- CORREÇÃO ESPECÍFICA PARA ACEITAR CORRIDA
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. REMOVER POLÍTICAS CONFLITANTES
-- ============================================

-- Remover todas as políticas antigas de UPDATE na tabela services
DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update assigned services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update own services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can accept available services" ON public.services;
DROP POLICY IF EXISTS "Companies can update own services" ON public.services;

-- 2. CRIAR POLÍTICAS CORRETAS
-- ============================================

-- Política para motoboy ACEITAR serviços (mudar de available para accepted)
CREATE POLICY "Motoboys can accept services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  -- Pode aceitar se o serviço está disponível E tem role de motoboy
  status = 'available' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'motoboy'
  )
)
WITH CHECK (
  -- Ao aceitar, deve definir motoboy_id e status como accepted
  motoboy_id = auth.uid() AND
  status = 'accepted'
);

-- Política para motoboy atualizar seus próprios serviços aceitos
CREATE POLICY "Motoboys can update own services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  -- Pode atualizar apenas seus próprios serviços
  motoboy_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'motoboy'
  )
);

-- Política para empresa atualizar seus próprios serviços
CREATE POLICY "Companies can update own services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  -- Empresa pode atualizar apenas seus próprios serviços
  company_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'company'
  )
);

-- 3. VERIFICAR POLÍTICAS CRIADAS
-- ============================================

SELECT '=== POLÍTICAS DE UPDATE CRIADAS ===' AS info;
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'services' AND cmd = 'UPDATE'
ORDER BY policyname;

-- 4. VERIFICAR SE USUÁRIO TEM ROLE
-- ============================================

SELECT '=== VERIFICAÇÃO DE ROLES ===' AS info;
SELECT 
  u.id,
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = auth.uid();

-- 5. TESTAR ACEITAR SERVIÇO
-- ============================================

-- Verificar se há serviços disponíveis
SELECT '=== SERVIÇOS DISPONÍVEIS ===' AS info;
SELECT 
  id,
  title,
  status,
  company_id,
  motoboy_id,
  created_at
FROM public.services
WHERE status = 'available'
ORDER BY created_at DESC
LIMIT 5;

-- 6. VERIFICAR SE A TABELA USER_ROLES TEM DADOS
-- ============================================

SELECT '=== USUÁRIOS COM ROLES ===' AS info;
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'motoboy' THEN 1 END) as motoboys,
  COUNT(CASE WHEN role = 'company' THEN 1 END) as companies
FROM public.user_roles;

SELECT '=== CORREÇÃO CONCLUÍDA ===' AS info;
