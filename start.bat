@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH.
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] npm n'est pas disponible dans le PATH.
    exit /b 1
)

if not exist "%ROOT%backend\package.json" (
    echo [ERREUR] Le dossier backend est introuvable.
    exit /b 1
)

if not exist "%ROOT%frontend\package.json" (
    echo [ERREUR] Le dossier frontend est introuvable.
    exit /b 1
)

if not exist "%ROOT%backend\node_modules" (
    echo [INFO] Installation des dependances backend...
    pushd "%ROOT%backend"
    call npm install
    popd
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation des dependances backend.
        exit /b 1
    )
)

if not exist "%ROOT%frontend\node_modules" (
    echo [INFO] Installation des dependances frontend...
    pushd "%ROOT%frontend"
    call npm install
    popd
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation des dependances frontend.
        exit /b 1
    )
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"LISTENING *:5000"') do (
    taskkill /F /PID %%P >nul 2>&1
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"LISTENING *:3000"') do (
    taskkill /F /PID %%P >nul 2>&1
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"LISTENING *:3001"') do (
    taskkill /F /PID %%P >nul 2>&1
)

start "" /D "%ROOT%backend" cmd /k "npm run start"
start "" /D "%ROOT%frontend" cmd /k "set PORT=3001 && npm start"

echo.
echo [OK] Les applications sont lancees.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
