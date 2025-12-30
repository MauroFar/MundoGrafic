# ============================================================================
# Script de verificación pre-migración
# Uso: .\check-migrations.ps1
# ============================================================================

param(
    [Parameter()]
    [ValidateSet('development', 'production')]
    [string]$Environment = 'development'
)

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERIFICACIÓN DE MIGRACIONES - MUNDOGRAFIC     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "🌍 Entorno: $Environment`n" -ForegroundColor Yellow

# Cargar variables de entorno
$envFile = if ($Environment -eq 'production') { '.env.production' } else { '.env' }

if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  Archivo $envFile no encontrado, usando .env por defecto" -ForegroundColor Yellow
    $envFile = '.env'
}

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    Write-Host "✅ Variables cargadas desde: $envFile`n" -ForegroundColor Green
}

# Información de la BD
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  INFORMACIÓN DE LA BASE DE DATOS"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🗄️  Base:     $($env:DB_NAME)"
Write-Host "  📡 Host:     $($env:DB_HOST)"
Write-Host "  👤 Usuario:  $($env:DB_USER)"
Write-Host "  🔌 Puerto:   $($env:DB_PORT)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Verificar conexión
Write-Host "🔍 Verificando conexión a la base de datos..." -ForegroundColor Yellow
$env:PGPASSWORD = $env:DB_PASSWORD
$testConnection = & psql -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME -p $env:DB_PORT -c "\q" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Conexión exitosa`n" -ForegroundColor Green
} else {
    Write-Host "❌ Error de conexión`n" -ForegroundColor Red
    exit 1
}

# Estado actual
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ESTADO ACTUAL DE MIGRACIONES"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

& npx knex migrate:status --env $Environment
Write-Host ""

# Listar archivos de migración
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ARCHIVOS DE MIGRACIÓN DISPONIBLES"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$migrationsDir = "src/db/migrations"
if (Test-Path $migrationsDir) {
    $migrations = Get-ChildItem $migrationsDir -Filter "*.js" | Sort-Object Name
    
    $count = 1
    foreach ($migration in $migrations) {
        $name = $migration.Name
        $date = $migration.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
        
        Write-Host "  $count. $name" -ForegroundColor White
        Write-Host "     📅 $date" -ForegroundColor Gray
        
        # Leer primera línea del archivo para ver descripción
        $content = Get-Content $migration.FullName -TotalCount 5 -ErrorAction SilentlyContinue
        $description = $content | Where-Object { $_ -match '^\s*\*.*Descripción:(.*)' } | Select-Object -First 1
        if ($description) {
            $desc = ($description -replace '^\s*\*.*Descripción:', '' -replace '\*/', '').Trim()
            Write-Host "     📝 $desc" -ForegroundColor DarkGray
        }
        
        Write-Host ""
        $count++
    }
    
    Write-Host "  Total: $($migrations.Count) archivos de migración`n" -ForegroundColor Yellow
}
else {
    Write-Host "  ⚠️  Directorio de migraciones no encontrado`n" -ForegroundColor Yellow
}

# Verificar si hay backups
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  BACKUPS DISPONIBLES"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$backupDir = "./backups"
if (Test-Path $backupDir) {
    $backups = Get-ChildItem $backupDir -Filter "*.sql*" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 5
    
    if ($backups -and $backups.Count -gt 0) {
        foreach ($backup in $backups) {
            $size = "{0:N2} MB" -f ($backup.Length / 1MB)
            $date = $backup.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
            Write-Host "  📦 $($backup.Name)" -ForegroundColor Green
            Write-Host "     💾 $size | 📅 $date" -ForegroundColor Gray
            Write-Host ""
        }
    }
    else {
        Write-Host "  ℹ️  No hay backups disponibles`n" -ForegroundColor Gray
    }
}
else {
    Write-Host "  ℹ️  Directorio de backups no existe`n" -ForegroundColor Gray
}

# Resumen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  PRÓXIMOS PASOS"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "  Para ejecutar migraciones:" -ForegroundColor Yellow
Write-Host "    .\migrate.ps1                    # Desarrollo" -ForegroundColor White
Write-Host "    .\migrate.ps1 -Environment production  # Producción`n" -ForegroundColor White

Write-Host "  Para crear una nueva migración:" -ForegroundColor Yellow
Write-Host "    npm run migrate:make nombre_descriptivo`n" -ForegroundColor White

Write-Host "  Para ver el estado:" -ForegroundColor Yellow
Write-Host "    npm run migrate:status`n" -ForegroundColor White

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           VERIFICACIÓN COMPLETA                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
