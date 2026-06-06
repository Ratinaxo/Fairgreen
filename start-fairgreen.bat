@echo off
echo ==============================================
echo Iniciando FairGreen...
echo ==============================================

echo [1/1] Levantando todos los servicios con Docker (Frontend + Backend + DB)...
call docker-compose up -d --build

echo ==============================================
echo Los contenedores se estan construyendo e iniciando en segundo plano.
echo FairGreen estara disponible pronto en:
echo Frontend: http://localhost:4200
echo Backend:  http://localhost:8000
echo Para ver los logs puedes ejecutar: docker-compose logs -f
echo ==============================================
pause
