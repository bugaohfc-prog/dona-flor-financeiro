@echo off
echo == Dona Flor Financeiro ^| Deploy Supabase Auth 11.9.1 ==
where supabase >nul 2>nul
if %errorlevel% neq 0 (
  echo Supabase CLI nao encontrada. Instalando via npm...
  npm install -g supabase
)
set /p PROJECT_REF=Cole o PROJECT REF do Supabase: 
set /p SERVICE_ROLE_KEY=Cole a SERVICE_ROLE_KEY do Supabase: 
supabase login
supabase link --project-ref %PROJECT_REF%
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="%SERVICE_ROLE_KEY%"
supabase functions deploy criar-usuario-manual
supabase functions deploy convidar-usuario
echo Deploy concluido. Atualize o sistema e teste Criar acesso manual.
pause
