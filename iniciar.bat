@echo off
echo ========================================
echo   Jogo da Forca - Inicializacao
echo ========================================
echo.

echo [1/3] Verificando Ollama...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Ollama nao esta instalado ou nao esta rodando!
    echo Por favor, instale o Ollama: https://ollama.ai/
    echo E execute: ollama serve
    pause
    exit /b 1
)

echo [2/3] Iniciando Backend Spring Boot...
cd backend
start "Backend Spring Boot" cmd /k "%USERPROFILE%\.maven\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run"
timeout /t 10 >nul

echo [3/3] Iniciando Frontend Flask...
cd ..\frontend
start "Frontend Flask" cmd /k "..\\.venv\Scripts\python.exe app.py"
timeout /t 3 >nul

echo.
echo ========================================
echo   Servidores iniciados com sucesso!
echo ========================================
echo.
echo Backend (Spring Boot): http://localhost:8080
echo Frontend (Flask):      http://localhost:5000
echo.
echo Abrindo navegador...
timeout /t 2 >nul
start http://localhost:5000

echo.
echo Pressione qualquer tecla para sair...
pause >nul
