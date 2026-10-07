# Cómo levantar n8n y conectarte

n8n corre en la VM `n8n-news-today` (GCP, proyecto `news-today-pipeline`, zona `us-central1-a`). No tiene IP pública: se entra por un **túnel IAP** que deja la UI en `http://localhost:5678`.

## Horario automático

La VM tiene la política de horario `news-today-6h` (zona horaria America/Panama):

| Hora (Panamá) | Qué pasa |
|---|---|
| 7:00 | La VM se prende sola |
| 7:10 | n8n dispara el pipeline (cron `0 10 7 * * *`) |
| 8:00 | La VM se apaga sola |

Fuera de ese horario hay que prenderla a mano (script de abajo). Si la prendés antes de las 7:10, el pipeline igual corre a las 7:10.

## Requisitos (una sola vez)

- Google Cloud SDK instalado (`gcloud`) y logueado con la cuenta dueña del proyecto: `gcloud auth login`
- Opcional, para un túnel más rápido: `pip install numpy` en el Python que usa gcloud.

## Conectarte

```powershell
cd C:\Web-blog-ia\news-today\n8n\scripts
powershell -ExecutionPolicy Bypass -File .\conectar-n8n.ps1
```

El script:
1. Revisa el estado de la VM y la prende si está apagada.
2. Abre `http://localhost:5678` en el navegador.
3. Abre el túnel IAP y lo reintenta solo hasta que n8n responda (después del boot, Docker tarda 1-2 minutos y mientras tanto el túnel da `4003: failed to connect to backend`; es normal).

Dejá la ventana de PowerShell abierta mientras usás n8n. Si la página queda en blanco, recargá (F5) cuando el túnel diga `Listening on port [5678]`. Entrá con tu usuario y contraseña de n8n.

## Apagar

```powershell
powershell -ExecutionPolicy Bypass -File .\apagar-n8n.ps1
```

Solo hace falta si la prendiste fuera de horario: igual se apaga sola a las 8:00.

## Comandos sueltos (equivalentes)

```powershell
# Estado
gcloud compute instances describe n8n-news-today --project=news-today-pipeline --zone=us-central1-a --format="value(status)"

# Prender / apagar
gcloud compute instances start n8n-news-today --project=news-today-pipeline --zone=us-central1-a
gcloud compute instances stop  n8n-news-today --project=news-today-pipeline --zone=us-central1-a

# Túnel (UI en http://localhost:5678)
gcloud compute start-iap-tunnel n8n-news-today 5678 --local-host-port=localhost:5678 --zone=us-central1-a --project=news-today-pipeline

# Entrar por SSH a la VM (Docker Compose con n8n + Postgres)
gcloud compute ssh n8n-news-today --zone=us-central1-a --project=news-today-pipeline --tunnel-through-iap
```

## Si el sitio deja de actualizarse

El pipeline puede seguir commiteando a GitHub mientras Cloudflare Pages falla al compilar (pasó entre el 23/09 y el 07/10/2026 por una categoría inválida). Para revisarlo, corré `npx astro build` en el repo: si falla, el error dice qué artículo tiene el problema.
