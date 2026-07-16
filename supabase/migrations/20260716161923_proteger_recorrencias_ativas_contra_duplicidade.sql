DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.df_contas
    WHERE recorrencia_id IS NOT NULL
      AND COALESCE(excluido, false) = false
      AND COALESCE(deletado, false) = false
    GROUP BY recorrencia_id, data_vencimento
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Não é possível proteger recorrências: existem contas ativas duplicadas por recorrencia_id e data_vencimento.';
  END IF;
END
$$;

CREATE UNIQUE INDEX uq_df_contas_recorrencia_vencimento_ativas
  ON public.df_contas (recorrencia_id, data_vencimento)
  WHERE recorrencia_id IS NOT NULL
    AND COALESCE(excluido, false) = false
    AND COALESCE(deletado, false) = false;

-- Rollback:
-- DROP INDEX IF EXISTS public.uq_df_contas_recorrencia_vencimento_ativas;
