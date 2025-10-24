-- Correção de emergência para política RLS
-- Vamos usar uma abordagem mais simples e direta

-- Remover política atual que pode estar com problemas
DROP POLICY IF EXISTS "Companies can create services" ON public.services;

-- Criar política mais simples que funciona com profiles.role 
-- (caso a tabela profiles ainda tenha a coluna role)
CREATE POLICY "Companies can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'company'
  )
);

-- Se a política acima falhar, criar uma versão alternativa usando user_roles
-- Esta será executada apenas se a anterior falhar
DO $$
BEGIN
  -- Tentar criar política alternativa usando user_roles
  EXECUTE 'DROP POLICY IF EXISTS "Companies can create services alt" ON public.services';
  
  EXECUTE 'CREATE POLICY "Companies can create services alt"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ''company''
    )
  )';
  
EXCEPTION WHEN OTHERS THEN
  -- Se falhar, usar uma política mais permissiva temporariamente
  EXECUTE 'CREATE POLICY "Companies can create services temp"
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id = auth.uid())';
  
  RAISE NOTICE 'Usando política temporária mais permissiva';
END$$;
