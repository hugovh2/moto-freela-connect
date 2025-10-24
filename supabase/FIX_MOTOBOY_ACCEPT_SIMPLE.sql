-- CORREÇÃO SIMPLES E DIRETA PARA MOTOBOY ACEITAR SERVIÇOS

-- Remover políticas antigas de UPDATE que podem estar conflitando
DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update assigned services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can accept available services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update own services" ON public.services;

-- Política para motoboy ACEITAR serviços disponíveis (UPDATE)
CREATE POLICY "Motoboys can accept services"
ON public.services
FOR UPDATE
TO authenticated
USING (
  -- Pode atualizar se o serviço está disponível E tem role de motoboy
  (status = 'available' OR motoboy_id = auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'motoboy'
  )
);

-- Verificar resultado
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'services' AND cmd = 'UPDATE'
ORDER BY policyname;
