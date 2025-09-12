# SCRIPT DE VERIFICACION - PROYECTO DJ JOSEP BACKEND
# Version: 1.2
# Ejecutar desde la raiz del proyecto

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"
SCRIPT DE VERIFICACION DEL PROYECTO DJ JOSEP BACKEND

USO:
    powershell -ExecutionPolicy Bypass -File verificar-proyecto.ps1

    O cambiar la politica de ejecucion permanentemente:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

DESCRIPCION:
    Este script verifica que todos los archivos y directorios necesarios
    esten presentes en el proyecto antes de ejecutar el servidor.

"@ -ForegroundColor Green
    exit 0
}

Write-Host "VERIFICANDO ESTRUCTURA DEL PROYECTO DJ JOSEP BACKEND" -ForegroundColor Cyan
Write-Host ("=" * 65) -ForegroundColor Gray

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: No se encuentra package.json" -ForegroundColor Red
    Write-Host "   Asegurate de ejecutar este script desde la raiz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Verificar archivos principales
$mainFiles = @{
    "server.js"    = "Servidor principal (CRITICO!)"
    "package.json" = "Configuracion de Node.js (CRITICO!)"
    ".env"         = "Variables de entorno (CRITICO!)"
    ".gitignore"   = "Configuracion de Git (RECOMENDADO)"
    "README.md"    = "Documentacion del proyecto (RECOMENDADO)"
}

Write-Host "`nARCHIVOS PRINCIPALES:" -ForegroundColor Yellow
$missingCritical = 0
foreach ($file in $mainFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "  OK $file" -ForegroundColor Green
        Write-Host "     - $($mainFiles[$file])" -ForegroundColor Gray
    }
    else {
        if ($mainFiles[$file].Contains("CRITICO!")) {
            Write-Host "  ERROR $file (FALTA - CRITICO)" -ForegroundColor Red
            $missingCritical++
        }
        else {
            Write-Host "  AVISO $file (FALTA - RECOMENDADO)" -ForegroundColor Yellow
        }
        Write-Host "     - $($mainFiles[$file])" -ForegroundColor Gray
    }
}

# Verificar directorios
$directories = @{
    "src"            = "Codigo fuente principal"
    "src\middleware" = "Middleware personalizado"
    "src\routes"     = "Rutas de la API"
    "uploads"        = "Archivos subidos por usuarios"
    "logs"           = "Archivos de registro (se crea automaticamente)"
}

Write-Host "`nESTRUCTURA DE DIRECTORIOS:" -ForegroundColor Yellow
foreach ($dir in $directories.Keys) {
    if (Test-Path $dir -PathType Container) {
        Write-Host "  OK $dir\" -ForegroundColor Green
        Write-Host "     - $($directories[$dir])" -ForegroundColor Gray
    }
    else {
        if ($dir -eq "logs") {
            Write-Host "  INFO $dir\ (SE CREARA AUTOMATICAMENTE)" -ForegroundColor Gray
        }
        else {
            Write-Host "  ERROR $dir\ (FALTA)" -ForegroundColor Red
            $missingCritical++
        }
        Write-Host "     - $($directories[$dir])" -ForegroundColor Gray
    }
}

# Verificar middleware - SOLO si existe el directorio src
$middlewareFiles = @{
    "src\middleware\errorHandler.js" = "Manejo de errores"
    "src\middleware\security.js"     = "Middleware de seguridad"
}

Write-Host "`nARCHIVOS DE MIDDLEWARE:" -ForegroundColor Yellow
foreach ($file in $middlewareFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "  OK $file" -ForegroundColor Green
        Write-Host "     - $($middlewareFiles[$file])" -ForegroundColor Gray
    }
    else {
        # Solo marcar como error critico si el directorio src existe pero falta el archivo
        $dirExists = Test-Path "src" -PathType Container
        if ($dirExists) {
            Write-Host "  ERROR $file (FALTA)" -ForegroundColor Red
            Write-Host "     - $($middlewareFiles[$file])" -ForegroundColor Gray
            $missingCritical++
        }
        else {
            Write-Host "  INFO $file (NO VERIFICADO - FALTA DIRECTORIO SRC)" -ForegroundColor Gray
            Write-Host "     - $($middlewareFiles[$file])" -ForegroundColor Gray
        }
    }
}

# Verificar rutas implementadas - SOLO si existe el directorio src
$routeFiles = @{
    "src\routes\analytics.js" = "Rutas de analytics y estadisticas"
    "src\routes\content.js"   = "Rutas de gestion de contenido"
    "src\routes\contact.js"   = "Rutas de formulario de contacto"
}

Write-Host "`nRUTAS IMPLEMENTADAS:" -ForegroundColor Yellow
foreach ($file in $routeFiles.Keys) {
    if (Test-Path $file) {
        Write-Host "  OK $file" -ForegroundColor Green
        Write-Host "     - $($routeFiles[$file])" -ForegroundColor Gray
    }
    else {
        # Solo marcar como error critico si el directorio src existe pero falta el archivo
        $dirExists = Test-Path "src" -PathType Container
        if ($dirExists) {
            Write-Host "  ERROR $file (FALTA)" -ForegroundColor Red
            Write-Host "     - $($routeFiles[$file])" -ForegroundColor Gray
            $missingCritical++
        }
        else {
            Write-Host "  INFO $file (NO VERIFICADO - FALTA DIRECTORIO SRC)" -ForegroundColor Gray
            Write-Host "     - $($routeFiles[$file])" -ForegroundColor Gray
        }
    }
}

# Verificar rutas pendientes - SOLO si existe el directorio src
$pendingRoutes = @{
    "src\routes\media.js"    = "Gestion de archivos multimedia"
    "src\routes\events.js"   = "Gestion de eventos y shows"
    "src\routes\settings.js" = "Configuracion de la aplicacion"
}

Write-Host "`nRUTAS PENDIENTES DE IMPLEMENTAR:" -ForegroundColor Yellow
foreach ($file in $pendingRoutes.Keys) {
    if (Test-Path $file) {
        Write-Host "  AVISO $file (YA EXISTE - VERIFICAR IMPLEMENTACION)" -ForegroundColor Yellow
        Write-Host "     - $($pendingRoutes[$file])" -ForegroundColor Gray
    }
    else {
        # Solo mostrar info si el directorio src existe
        $dirExists = Test-Path "src" -PathType Container
        if ($dirExists) {
            Write-Host "  INFO $file (POR IMPLEMENTAR)" -ForegroundColor Gray
            Write-Host "     - $($pendingRoutes[$file])" -ForegroundColor Gray
        }
        else {
            Write-Host "  INFO $file (NO VERIFICADO - FALTA DIRECTORIO SRC)" -ForegroundColor Gray
            Write-Host "     - $($pendingRoutes[$file])" -ForegroundColor Gray
        }
    }
}

# Verificar dependencias
Write-Host "`nDEPENDENCIAS DE NODE.JS:" -ForegroundColor Yellow
if (Test-Path "node_modules" -PathType Container) {
    Write-Host "  OK node_modules\ (INSTALADAS)" -ForegroundColor Green

    # Contar paquetes instalados
    try {
        $packagesCount = (Get-ChildItem "node_modules" -Directory -ErrorAction Stop | Measure-Object).Count
        Write-Host "     - $packagesCount paquetes instalados" -ForegroundColor Gray
    }
    catch {
        Write-Host "     - No se pudo contar los paquetes" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  ERROR node_modules\ (NO INSTALADAS)" -ForegroundColor Red
    Write-Host "     - EJECUTAR: npm install" -ForegroundColor Yellow
    $missingCritical++
}

if (Test-Path "package-lock.json") {
    Write-Host "  OK package-lock.json (LOCK FILE PRESENTE)" -ForegroundColor Green
}
else {
    Write-Host "  AVISO package-lock.json (SE CREARA CON npm install)" -ForegroundColor Yellow
}

# Verificar archivo .env
Write-Host "`nCONFIGURACION DE ENTORNO:" -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  OK .env (PRESENTE)" -ForegroundColor Green

    # Verificar variables criticas
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    $criticalVars = @("DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME")
    $envErrors = 0

    foreach ($var in $criticalVars) {
        $found = $envContent | Where-Object { $_ -match "^$var=" }
        if ($found) {
            Write-Host "     OK $var configurada" -ForegroundColor Green
        }
        else {
            Write-Host "     ERROR $var falta" -ForegroundColor Red
            $envErrors++
        }
    }
    
    if ($envErrors -gt 0) {
        $missingCritical += $envErrors
    }
}
else {
    Write-Host "  ERROR .env (FALTA - CREAR DESDE .env.example)" -ForegroundColor Red
    $missingCritical++
}

# Resumen final
Write-Host "`n" -NoNewline
Write-Host ("=" * 65) -ForegroundColor Gray

if ($missingCritical -eq 0) {
    Write-Host "`nPROYECTO LISTO PARA EJECUTAR!" -ForegroundColor Green
    Write-Host "`nCOMANDOS PARA INICIAR:" -ForegroundColor Cyan
    Write-Host "   node server.js" -ForegroundColor White
    Write-Host "   # O con nodemon para desarrollo:" -ForegroundColor Gray
    Write-Host "   npx nodemon server.js" -ForegroundColor White
}
else {
    Write-Host "`nFALTAN $missingCritical ELEMENTOS CRITICOS" -ForegroundColor Red
    Write-Host "`nACCIONES REQUERIDAS:" -ForegroundColor Yellow

    if (-not (Test-Path ".env")) {
        Write-Host "1. Crear archivo .env desde .env.example" -ForegroundColor White
    }
    if (-not (Test-Path "node_modules")) {
        Write-Host "2. Instalar dependencias: npm install" -ForegroundColor White
    }
    if (-not (Test-Path "src")) {
        Write-Host "3. Crear estructura de directorios src\" -ForegroundColor White
    }

    Write-Host "`nNO EJECUTAR EL SERVIDOR HASTA RESOLVER ESTOS ISSUES" -ForegroundColor Yellow
}

Write-Host ("`nVERIFICACION COMPLETADA - {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor Gray