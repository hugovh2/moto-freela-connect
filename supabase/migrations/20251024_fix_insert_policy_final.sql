-- Corrigir política de INSERT para garantir que o company_id corresponda ao usuário autenticado
-- O problema atual é que qualquer empresa pode criar serviços, mas não há verificação
-- de que o company_id seja o mesmo do usuário que está criando o serviço

-- Remover política atual
DROP POLICY IF EXISTS "Companies can create services" ON public.services;

-- Criar nova política com verificação correta
CREATE POLICY "Companies can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  -- Garantir que o company_id seja o mesmo do usuário autenticado
  company_id = auth.uid() AND
  -- Verificar se o usuário tem role de company
  public.has_role(auth.uid(), 'company')
);
