-- CORRIGIR POLÍTICA PARA MOTOBOY ACEITAR SERVIÇOS

-- 1. Remover políticas antigas de UPDATE
DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update assigned services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can accept available services" ON public.services;

-- 2. Criar política correta para motoboy aceitar serviços
CREATE POLICY "Motoboys can accept services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  -- Motoboy pode atualizar serviços disponíveis
  status = 'available' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'motoboy'
  )
)
WITH CHECK (
  -- Ao atualizar, deve ser para aceitar (mudar status e adicionar motoboy_id)
  motoboy_id = auth.uid() AND
  status = 'accepted'
);

-- 3. Política para motoboy atualizar serviços já aceitos
CREATE POLICY "Motoboys can update own services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  -- Motoboy pode atualizar apenas seus próprios serviços
  motoboy_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'motoboy'
  )
);

-- 4. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'services'
ORDER BY policyname;
