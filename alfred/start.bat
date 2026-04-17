@echo off
echo Starting alfred_ backend and frontend...
start "alfred-backend" cmd /c "cd /d d:\users\Trae\alfred\backend && python -m uvicorn main:app --host 127.0.0.1 --port 8088"
timeout /t 3 /nobreak >nul
start "alfred-frontend" cmd /c "cd /d d:\users\Trae\alfred\frontend && npm run dev"
echo Both servers are starting...
echo Backend: http://127.0.0.1:8088
echo Frontend: http://localhost:5173
