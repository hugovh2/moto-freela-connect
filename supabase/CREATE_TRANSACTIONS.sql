-- ============================================
-- CRIAR TABELA TRANSACTIONS (WALLET/CRÉDITOS)
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'withdraw', 'refund')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_service_id ON public.transactions(service_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 3. HABILITAR RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "users_view_own_transactions" ON public.transactions;
DROP POLICY IF EXISTS "system_insert_transactions" ON public.transactions;
DROP POLICY IF EXISTS "users_update_own_transactions" ON public.transactions;

-- 5. CRIAR POLÍTICAS RLS

-- Usuários podem ver suas próprias transações
CREATE POLICY "users_view_own_transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Sistema pode inserir transações (SECURITY DEFINER functions)
CREATE POLICY "system_insert_transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários podem atualizar suas transações (ex: cancelar)
CREATE POLICY "users_update_own_transactions"
ON public.transactions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 6. CRIAR VIEW DE SALDO (WALLET BALANCE)
CREATE OR REPLACE VIEW public.wallet_balances AS
SELECT 
  user_id,
  SUM(
    CASE 
      WHEN type = 'credit' AND status = 'completed' THEN amount
      WHEN type = 'debit' AND status = 'completed' THEN -amount
      ELSE 0
    END
  ) as balance,
  COUNT(*) as total_transactions,
  MAX(created_at) as last_transaction_at
FROM public.transactions
GROUP BY user_id;

-- 7. FUNÇÃO PARA OBTER SALDO
CREATE OR REPLACE FUNCTION public.get_user_balance(p_user_id UUID)
RETURNS DECIMAL(10, 2)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN type = 'credit' AND status = 'completed' THEN amount
        WHEN type = 'debit' AND status = 'completed' THEN -amount
        ELSE 0
      END
    ), 0
  )
  FROM public.transactions
  WHERE user_id = p_user_id;
$$;

-- 8. FUNÇÃO PARA CREDITAR MOTOBOY (chamada pelo ActiveRideCard)
CREATE OR REPLACE FUNCTION public.credit_motoboy(
  p_user_id UUID,
  p_service_id UUID,
  p_amount DECIMAL,
  p_description TEXT DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction public.transactions;
BEGIN
  -- Validar amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than 0';
  END IF;

  -- Criar transação
  INSERT INTO public.transactions (
    user_id,
    service_id,
    amount,
    type,
    status,
    description
  ) VALUES (
    p_user_id,
    p_service_id,
    p_amount,
    'credit',
    'completed',
    COALESCE(p_description, 'Crédito de corrida')
  )
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$;

-- 9. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at_trigger ON public.transactions;
CREATE TRIGGER update_transactions_updated_at_trigger
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transactions_updated_at();

-- 10. VERIFICAÇÃO
SELECT '=== TABELA TRANSACTIONS ===' AS info;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'transactions'
) AS tabela_existe;

SELECT '=== COLUNAS ===' AS info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

SELECT '=== POLÍTICAS RLS ===' AS info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'transactions'
ORDER BY policyname;

SELECT '=== FUNÇÕES ===' AS info;
SELECT proname 
FROM pg_proc 
WHERE proname IN ('get_user_balance', 'credit_motoboy');

SELECT '✅ TABELA TRANSACTIONS CRIADA COM SUCESSO!' AS resultado;
