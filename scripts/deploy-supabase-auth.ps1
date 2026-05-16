Set-Location (Join-Path $PSScriptRoot '..')
$localCli = Join-Path (Get-Location) 'supabase.exe'
$supabase = if (Test-Path $localCli) { $localCli } else { 'supabase' }

Write-Host '== Dona Flor Financeiro | Deploy Supabase Auth 11.9.2 =='
& $supabase --version
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Supabase CLI nao encontrada. Coloque supabase.exe na raiz do projeto ou instale a CLI.' -ForegroundColor Red
  Read-Host 'Pressione ENTER para sair'
  exit 1
}

$projectRef = Read-Host 'Cole o PROJECT REF do Supabase'
$serviceRole = Read-Host 'Cole a service_role key do Supabase'

& $supabase link --project-ref $projectRef
& $supabase secrets set SERVICE_ROLE_KEY="$serviceRole"
& $supabase functions deploy criar-usuario-manual

Write-Host 'Deploy concluido. Atualize o sistema e teste Criar acesso manual.' -ForegroundColor Green
Read-Host 'Pressione ENTER para sair'
