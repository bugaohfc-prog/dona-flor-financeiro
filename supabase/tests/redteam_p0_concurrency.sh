#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
LOG_DIR="${LOG_DIR:-artifacts/redteam-p0}"
mkdir -p "$LOG_DIR"

EMPRESA="11000000-0000-0000-0000-000000000001"
FILIAL="21000000-0000-0000-0000-000000000001"
VINCULO="41000000-0000-0000-0000-000000000001"
USUARIO="51000000-0000-0000-0000-000000000001"
CONTA="71000000-0000-0000-0000-000000000010"
KEY_A="81000000-0000-0000-0000-000000000001"
KEY_B="81000000-0000-0000-0000-000000000002"

psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
insert into public.df_empresas(id,nome) values ('$EMPRESA','Concorrencia P0-1');
insert into public.df_filiais(id,empresa_id,nome) values ('$FILIAL','$EMPRESA','Filial concorrencia');
insert into public.df_usuarios_empresas(id,empresa_id,user_id,email,perfil,acesso_todas_filiais)
values ('$VINCULO','$EMPRESA','$USUARIO','concorrencia@ci.local','gerente',false);
insert into public.df_usuarios_filiais(empresa_id,usuario_id,filial_id)
values ('$EMPRESA','$VINCULO','$FILIAL');
insert into public.df_contas(id,empresa_id,descricao,valor,data_vencimento,vencimento,filial_id,status,excluido)
values ('$CONTA','$EMPRESA','Conta concorrente',100,current_date,current_date,'$FILIAL','pendente',false);
SQL

run_payment() {
  local key="$1"
  psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
select set_config('request.jwt.claims','{"sub":"$USUARIO","email":"concorrencia@ci.local","role":"authenticated"}',false);
set role authenticated;
select public.registrar_pagamento_parcial_controlado(
  '$EMPRESA','$CONTA',80,current_date,'concorrencia CI','$key'
);
SQL
}

set +e
run_payment "$KEY_A" >"$LOG_DIR/p0-1-session-a.log" 2>&1 &
PID_A=$!
run_payment "$KEY_B" >"$LOG_DIR/p0-1-session-b.log" 2>&1 &
PID_B=$!
wait "$PID_A"; STATUS_A=$?
wait "$PID_B"; STATUS_B=$?
set -e

if [[ "$STATUS_A" -eq 0 && "$STATUS_B" -eq 0 ]] || [[ "$STATUS_A" -ne 0 && "$STATUS_B" -ne 0 ]]; then
  echo "Esperava exatamente uma sessao vencedora; status A=$STATUS_A B=$STATUS_B" >&2
  exit 1
fi

WINNING_KEY="$(psql "$DB_URL" -Atqc "select idempotency_key from public.df_contas_pagamentos where conta_id='$CONTA'")"

psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL | tee "$LOG_DIR/p0-1-concurrency-assertions.log"
do \$\$
declare
  v_count integer;
  v_total numeric;
  v_audit integer;
begin
  select count(*), coalesce(sum(valor_pago),0) into v_count, v_total
  from public.df_contas_pagamentos where conta_id='$CONTA' and not arquivado;
  select count(*) into v_audit from public.df_auditoria_eventos
  where empresa_id='$EMPRESA' and acao='financeiro.pagamento_parcial.criado';
  if v_count <> 1 or v_total <> 80 or v_audit <> 1 then
    raise exception 'Concorrencia insegura: count=%, total=%, audit=%', v_count, v_total, v_audit;
  end if;
end \$\$;
SQL

# A repeticao da tentativa logica usa a chave vencedora e nao cria nova linha.
run_payment "$WINNING_KEY" >"$LOG_DIR/p0-1-idempotency-retry.log" 2>&1
RETRY_RESULT="$(psql "$DB_URL" -Atqc "select case when count(*)=1 and sum(valor_pago)=80 then 'ok' else 'falha' end from public.df_contas_pagamentos where conta_id='$CONTA'")"
printf '%s\n' "$RETRY_RESULT" >"$LOG_DIR/p0-1-idempotency-assertion.log"
[[ "$RETRY_RESULT" == "ok" ]]

printf 'P0-1 concorrencia: APROVADO (sessao A=%s, sessao B=%s, chave vencedora=%s)\n' \
  "$STATUS_A" "$STATUS_B" "$WINNING_KEY" | tee "$LOG_DIR/p0-1-concurrency-summary.txt"
