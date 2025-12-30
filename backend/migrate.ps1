# ============================================================================
# Script unificado para ejecutar migraciones con Knex (PowerShell)
# Uso: .\migrate.ps1 [-Environment <development|production>]
# Ejemplos:
#   .\migrate.ps1                    # Desarrollo (local)
#   .\migrate.ps1 -Environment production  # Producción
# ============================================================================

param(
    [Parameter()]
    [ValidateSet('development', 'production')]
    [string]$Environment = 'development'
)

# Configuración de colores
$colors = @{
    Red = 'Red'
    Green = 'Green'
    Yellow = 'Yellow'
    Blue = 'Cyan'
}

function Write-ColorMessage {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

# Header
Write-ColorMessage "`n╔════════════════════════════════════════════════╗" -Color $colors.Blue
Write-ColorMessage "║   SISTEMA DE MIGRACIONES - MUNDOGRAFIC         ║" -Color $colors.Blue
Write-ColorMessage "╚════════════════════════════════════════════════╝" -Color $colors.Blue
Write-ColorMessage "`n🌍 Entorno: $Environment`n" -Color $colors.Yellow

# Cargar variables de entorno
$envFile = if ($Environment -eq 'production') { '.env.production' } else { '.env' }

if (-not (Test-Path $envFile)) {
    Write-ColorMessage "❌ Error: No existe archivo $envFile" -Color $colors.Red
    exit 1
}

Write-ColorMessage "📄 Cargando variables desde: $envFile" -Color $colors.Yellow

# Cargar variables de entorno
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
}

$DB_HOST = $env:DB_HOST
$DB_NAME = $env:DB_NAME
$DB_USER = $env:DB_USER
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { '5432' }
$DB_PASSWORD = $env:DB_PASSWORD

Write-ColorMessage "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -Color $colors.Blue
Write-Host "  Conexión a Base de Datos:"
Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -Color $colors.Blue
Write-Host "  📡 Host:     $DB_HOST"
Write-Host "  🗄️  Base:     $DB_NAME"
Write-Host "  👤 Usuario:  $DB_USER"
Write-Host "  🔌 Puerto:   $DB_PORT"
Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -Color $colors.Blue

# Verificar conexión a la base de datos
Write-ColorMessage "🔍 Verificando conexión a la base de datos..." -Color $colors.Yellow

$env:PGPASSWORD = $DB_PASSWORD
$testConnection = & psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -c "\q" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-ColorMessage "❌ Error: No se puede conectar a la base de datos" -Color $colors.Red
    Write-ColorMessage "   Verifica que PostgreSQL esté corriendo y las credenciales sean correctas" -Color $colors.Yellow
    exit 1
}

Write-ColorMessage "✅ Conexión exitosa a la base de datos`n" -Color $colors.Green

# Si es producción, preguntar confirmación
if ($Environment -eq 'production') {
    Write-ColorMessage "⚠️  ADVERTENCIA: Estás a punto de ejecutar migraciones en PRODUCCIÓN" -Color $colors.Red
    Write-ColorMessage "   Esto puede modificar la estructura de la base de datos`n" -Color $colors.Yellow
    
    $confirm = Read-Host "   ¿Deseas continuar? (escribe 'SI' para confirmar)"
    
    if ($confirm -ne 'SI') {
        Write-ColorMessage "❌ Operación cancelada por el usuario" -Color $colors.Yellow
        exit 0
    }
    
    # Crear backup antes de migrar en producción
    Write-ColorMessage "`n💾 Creando backup de seguridad..." -Color $colors.Yellow
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_pre_migration_$timestamp.sql"
    $backupDir = "./backups"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    $backupPath = Join-Path $backupDir $backupFile
    
    & pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -F p -f $backupPath 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $backupSize = (Get-Item $backupPath).Length / 1MB
        Write-ColorMessage "✅ Backup creado: $backupPath" -Color $colors.Green
        Write-ColorMessage "   Tamaño: $([math]::Round($backupSize, 2)) MB" -Color $colors.Green
    } else {
        Write-ColorMessage "❌ Error al crear backup. Abortando migraciones." -Color $colors.Red
        exit 1
    }
    
    Write-Host ""
}

# Verificar estado de migraciones
Write-ColorMessage "📋 Verificando estado de migraciones..." -Color $colors.Yellow
& npx knex migrate:status --env $Environment
Write-Host ""

# Listar migraciones pendientes
Write-ColorMessage "🔍 Migraciones pendientes:" -Color $colors.Yellow
& npx knex migrate:list --env $Environment 2>$null
if (-not $?) {
    Write-Host "  (Ninguna pendiente)"
}
Write-Host ""

# Ejecutar migraciones
Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -Color $colors.Blue
Write-ColorMessage "  🚀 EJECUTANDO MIGRACIONES" -Color $colors.Blue
Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -Color $colors.Blue

& npx knex migrate:latest --env $Environment

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -Color $colors.Green
    Write-ColorMessage "  ✅ MIGRACIONES COMPLETADAS EXITOSAMENTE" -Color $colors.Green
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -Color $colors.Green
    
    # Mostrar estado final
    Write-ColorMessage "📊 Estado final de migraciones:" -Color $colors.Yellow
    & npx knex migrate:status --env $Environment
    
    if ($Environment -eq 'production' -and $backupPath) {
        Write-Host ""
        Write-ColorMessage "💾 Backup disponible en: $backupPath" -Color $colors.Green
        Write-ColorMessage "   (Puedes eliminarlo manualmente si todo funciona correctamente)" -Color $colors.Yellow
    }
} else {
    Write-Host ""
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -Color $colors.Red
    Write-ColorMessage "  ❌ ERROR EN LAS MIGRACIONES" -Color $colors.Red
    Write-ColorMessage "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -Color $colors.Red
    
    if ($Environment -eq 'production' -and $backupPath) {
        Write-Host ""
        Write-ColorMessage "🔄 Puedes restaurar el backup con:" -Color $colors.Yellow
        Write-ColorMessage "   `$env:PGPASSWORD='$DB_PASSWORD'; psql -h $DB_HOST -U $DB_USER -d $DB_NAME < $backupPath" -Color $colors.Yellow
    }
    
    exit 1
}

Write-Host ""
Write-ColorMessage "╔════════════════════════════════════════════════╗" -Color $colors.Blue
Write-ColorMessage "║              PROCESO FINALIZADO                ║" -Color $colors.Blue
Write-ColorMessage "╚════════════════════════════════════════════════╝" -Color $colors.Blue
