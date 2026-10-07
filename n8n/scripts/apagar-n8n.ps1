# Apaga la VM de n8n. Igual se apaga sola a las 8:00am (hora de Panamá) por la
# política de horario news-today-6h; usar esto si la prendiste fuera de horario.
# Uso:  powershell -ExecutionPolicy Bypass -File .\apagar-n8n.ps1

gcloud compute instances stop n8n-news-today --project=news-today-pipeline --zone=us-central1-a
