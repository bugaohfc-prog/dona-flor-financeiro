# Dona Flor Financeiro — Deploy Auth Manual Provisioning
# Execute no PowerShell dentro da pasta do projeto.

Write-Host "== Dona Flor Financeiro | Deploy Supabase Auth 11.9.1 ==" -ForegroundColor Cyan

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host "Supabase CLI não encontrada. Instalando via npm..." -ForegroundColor Yellow
  npm install -g supabase
}

$projectRef = Read-Host "Cole o PROJECT REF do Supabase"
$serviceRole = Read-Host "Cole a SERVICE_ROLE_KEY do Supabase"

supabase login
supabase link --project-ref $projectRef
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$serviceRole"
supabase functions deploy criar-usuario-manual
supabase functions deploy convidar-usuario

Write-Host "Deploy concluído. Atualize o sistema e teste Criar acesso manual." -ForegroundColor Green
