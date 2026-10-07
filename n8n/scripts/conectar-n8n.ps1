# Prende la VM de n8n (si está apagada), abre el túnel IAP y abre la UI en el navegador.
# Uso:  powershell -ExecutionPolicy Bypass -File .\conectar-n8n.ps1
# Dejá esta ventana abierta mientras uses n8n; Ctrl+C cierra el túnel.

$Project = 'news-today-pipeline'
$Zone    = 'us-central1-a'
$Vm      = 'n8n-news-today'
$Port    = 5678

$status = gcloud compute instances describe $Vm --project=$Project --zone=$Zone --format='value(status)'
Write-Host "Estado de la VM: $status"
if ($status -ne 'RUNNING') {
    Write-Host 'Prendiendo la VM...'
    gcloud compute instances start $Vm --project=$Project --zone=$Zone
}

# n8n (Docker) tarda 1-2 min en levantar después del boot; el túnel falla con
# "4003: failed to connect to backend" hasta que el puerto responde.
Write-Host 'Esperando a que n8n responda (puede tardar 1-2 minutos)...'
Start-Process "http://localhost:$Port"
for ($i = 1; $i -le 20; $i++) {
    gcloud compute start-iap-tunnel $Vm $Port --local-host-port="localhost:$Port" --zone=$Zone --project=$Project
    Write-Host "Túnel cerrado o n8n todavía no responde (intento $i). Reintentando en 10s..."
    Start-Sleep -Seconds 10
}
