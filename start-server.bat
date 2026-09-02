@echo off
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js가 설치되어 있지 않습니다. 먼저 Node.js를 설치해 주세요.
    echo https://nodejs.org/
    pause
    exit /b 1
)

echo PLM 대시보드 서버를 시작합니다...
start "" http://localhost:4000
npm start

if errorlevel 1 (
    echo.
    echo 서버 실행 중 오류가 발생했습니다.
    pause
)
