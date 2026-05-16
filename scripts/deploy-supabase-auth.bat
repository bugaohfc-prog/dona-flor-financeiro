@echo off
setlocal
cd /d "%~dp0.."
set SUPABASE_CMD=supabase
if exist "%CD%\supabase.exe" set SUPABASE_CMD=""%CD%\supabase.exe""

echo == Dona Flor Financeiro | Deploy Supabase Auth 11.9.2 ==
%SUPABASE_CMD% --version
if errorlevel 1 (
  echo Supabase CLI nao encontrada. Coloque supabase.exe na raiz do projeto ou instale a CLI.
  pause
  exit /b 1
)

set /p PROJECT_REF=Cole o PROJECT REF do Supabase: 
set /p SERVICE_ROLE_KEY=Cole a service_role key do Supabase: 

%SUPABASE_CMD% link --project-ref %PROJECT_REF%
%SUPABASE_CMD% secrets set SERVICE_ROLE_KEY="%SERVICE_ROLE_KEY%"
%SUPABASE_CMD% functions deploy criar-usuario-manual
%SUPABASE_CMD% functions deploy listar-usuarios-empresa

echo.
echo Deploy concluido. Atualize o sistema e teste Criar acesso manual.
pause
