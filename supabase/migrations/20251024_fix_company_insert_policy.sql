-- Corrigir política de INSERT para empresas criarem serviços
-- O problema é que a política verifica apenas se o usuário é empresa,
-- mas também precisa garantir que o company_id seja o mesmo do usuário autenticado

-- Remover política antiga
DROP POLICY IF EXISTS "Companies can create services" ON public.services;

-- Criar nova política com verificação correta
CREATE POLICY "Companies can create services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verifica se o company_id é o mesmo do usuário autenticado
    company_id = auth.uid() AND
    -- Verifica se o usuário tem role de company
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'company'
    )
  );
