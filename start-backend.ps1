# Script de démarrage du serveur backend avec gestion d'erreurs
# Usage: .\start-backend.ps1

Write-Host "🚀 Démarrage du serveur backend ADE_BRH..." -ForegroundColor Green

# Vérifier si Node.js est installé
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
    exit 1
}

# Vérifier si npm est disponible
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm n'est pas disponible" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier backend
Set-Location "F:\ADE_BRH\backend"

# Vérifier si package.json existe
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json non trouvé dans le dossier backend" -ForegroundColor Red
    exit 1
}

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
}

# Vérifier si le port 5000 est libre
$portInUse = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Le port 5000 est déjà utilisé. Arrêt des processus existants..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 2
}

# Démarrer le serveur
Write-Host "🚀 Démarrage du serveur backend..." -ForegroundColor Green
Write-Host "URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Test: http://localhost:5000/api/test" -ForegroundColor Cyan
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Cyan
Write-Host ""

try {
    npm run start
}
catch {
    Write-Host "❌ Erreur lors du démarrage du serveur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
