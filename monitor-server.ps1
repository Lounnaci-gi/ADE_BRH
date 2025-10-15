# Script de surveillance du serveur backend
# Usage: .\monitor-server.ps1

$API_URL = "http://localhost:5000/api/test"
$CHECK_INTERVAL = 30 # secondes
$MAX_RETRIES = 3

function Test-ServerHealth {
    try {
        $response = Invoke-RestMethod -Uri $API_URL -TimeoutSec 10
        return $true
    }
    catch {
        Write-Host "❌ Serveur non accessible: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Start-BackendServer {
    Write-Host "🚀 Démarrage du serveur backend..." -ForegroundColor Yellow
    Set-Location "F:\ADE_BRH\backend"
    Start-Process -FilePath "npm" -ArgumentList "run", "start" -WindowStyle Hidden
    Start-Sleep 5
}

function Restart-BackendServer {
    Write-Host "🔄 Redémarrage du serveur backend..." -ForegroundColor Yellow
    
    # Arrêter les processus Node.js existants
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Start-Sleep 2
    Start-BackendServer
}

Write-Host "🔍 Surveillance du serveur backend démarrée..." -ForegroundColor Green
Write-Host "URL de test: $API_URL" -ForegroundColor Cyan
Write-Host "Intervalle de vérification: $CHECK_INTERVAL secondes" -ForegroundColor Cyan
Write-Host "Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Cyan
Write-Host ""

$retryCount = 0

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    if (Test-ServerHealth) {
        Write-Host "[$timestamp] ✅ Serveur OK" -ForegroundColor Green
        $retryCount = 0
    }
    else {
        $retryCount++
        Write-Host "[$timestamp] ❌ Serveur KO (tentative $retryCount/$MAX_RETRIES)" -ForegroundColor Red
        
        if ($retryCount -ge $MAX_RETRIES) {
            Write-Host "[$timestamp] 🔄 Redémarrage automatique du serveur..." -ForegroundColor Yellow
            Restart-BackendServer
            $retryCount = 0
        }
    }
    
    Start-Sleep $CHECK_INTERVAL
}
