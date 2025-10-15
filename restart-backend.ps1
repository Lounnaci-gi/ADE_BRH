# Script de redémarrage du serveur backend
Write-Host "Redemarrage du serveur backend..." -ForegroundColor Yellow

# Arreter tous les processus Node.js
Write-Host "Arret des processus Node.js..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep 3

# Aller dans le dossier backend
Set-Location "F:\ADE_BRH\backend"

# Demarrer le serveur
Write-Host "Demarrage du serveur..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden

# Attendre
Write-Host "Attente du demarrage..." -ForegroundColor Yellow
Start-Sleep 5

# Tester
Write-Host "Test de connectivite..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/test" -TimeoutSec 10
    Write-Host "Serveur demarre avec succes!" -ForegroundColor Green
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Termine!" -ForegroundColor Green