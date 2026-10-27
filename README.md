# 🔥 Buscador de Tendencias

App web para encontrar **tendencias virales (Shorts, Reels y TikToks)** y armar **historias de Instagram** para varias cuentas (Gym, Baddie, etc.).

- **Buscar:** escribís la idea ("quiero hacer una historia para un sorteo", "una historia polémica") + objetivo → la IA investiga las tendencias de las últimas semanas, propone **3 opciones de historia** listas para hacer y trae **Shorts virales** ordenados por vistas por día. Además arma accesos directos a la búsqueda en TikTok, Instagram (palabras clave y hashtags) y YouTube.
- **Plan del día:** un botón genera las **3 historias del día** (mañana / tarde / noche) por cuenta, sin repetir ideas de días anteriores.
- **Guardados:** videos e ideas para ver más tarde, con notas. También se puede pegar cualquier link de TikTok / Reel / Short.
- **Cuentas con contexto:** cada cuenta tiene su descripción (rubro, público, tono). Se editan en ⚙️.

Todo se guarda en el navegador (`localStorage`): **no hay backend ni base de datos.** Desde ⚙️ → Respaldo se puede exportar/importar a otro dispositivo.

## Claves API (gratis)

Se cargan en ⚙️ y quedan **solo en el navegador de quien las carga** (no van al código ni a GitHub).

| Clave | Para qué | Dónde |
|---|---|---|
| **YouTube Data API v3** (necesaria) | Shorts virales + tendencias para las plantillas | https://console.cloud.google.com/apis/library/youtube.googleapis.com → Habilitar → https://console.cloud.google.com/apis/credentials → Crear credenciales → Clave de API |
| **Gemini** (opcional) | Ideas con IA + investigación de tendencias en Google | https://aistudio.google.com/apikey |
| **Groq** (opcional) | Respaldo gratis cuando Gemini no tiene cupo (Compound con búsqueda web → gpt-oss-120b → Llama 3.3 70B) | https://console.groq.com/keys |

### Ideas: IA + plantillas
1. Si hay clave de Gemini, prueba `gemini-2.5-flash` → `gemini-2.5-flash-lite` (cada modelo tiene su propio cupo gratis).
2. Si Gemini no tiene cupo, pasa a **Groq** (`groq/compound` → `openai/gpt-oss-120b` → `llama-3.3-70b-versatile`).
3. Si tampoco hay cupo, la app deja de intentar hasta que se reinicia y genera las ideas con **plantillas** (`js/templates.js`): formatos probados por objetivo + hashtags y palabras que se repiten en los Shorts virales encontrados. Sin límites.
4. En ⚙️ se puede forzar "Usar solo plantillas".

Recomendado: en Google Cloud, **restringir la clave de YouTube** a *Sitios web (referentes HTTP)* con `https://TU-USUARIO.github.io/*`.

Cuota de YouTube: 10.000 unidades/día gratis ≈ **25 búsquedas por día** (cada búsqueda usa ~4 consultas de 100 unidades). "Ver más videos" consume otra tanda.

> TikTok e Instagram no ofrecen una API pública de búsqueda sin servidor, por eso se integran con links directos de búsqueda + guardado manual de links (con reproductor embebido).

## Probar en la compu

Abrí `index.html` con doble clic, o con un servidor local:

```bash
npx serve .
```

## Publicar en GitHub Pages

```bash
git init
git add .
git commit -m "Buscador de tendencias"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/buscador-tendencias.git
git push -u origin main
```

En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
En 1–2 minutos queda en `https://TU-USUARIO.github.io/buscador-tendencias/`.

## Estructura

```
buscador-tendencias/
├── index.html
├── css/styles.css
├── js/templates.js  # generador de ideas sin IA
├── js/app.js        # lógica principal (vanilla JS, sin build)
└── .nojekyll
```

## Ajustes

- **Modelo de IA:** por defecto `gemini-2.5-flash` (tiene búsqueda en Google gratis). Se cambia en ⚙️.
- **Plantillas:** se agregan/editan en el objeto `T` de `js/templates.js`.
- **País:** código de 2 letras para priorizar resultados de YouTube (por defecto `AR`).
- **Objetivos** (chips): constante `GOALS` en `js/app.js`.
- **Contexto inicial de cuentas:** constante `DEFAULT_ACCOUNTS` en `js/app.js`.
