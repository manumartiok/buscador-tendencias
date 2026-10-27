/* Buscador de Tendencias — app 100% estática (sin backend).
 * Datos en localStorage. APIs: YouTube Data v3 (Shorts) + Gemini (ideas, con búsqueda en Google). */
(() => {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const compact = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });
  const todayKey = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
  const todayLong = () => new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const store = {
    get(k, def) { try { const v = localStorage.getItem('bt_' + k); return v ? JSON.parse(v) : def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem('bt_' + k, JSON.stringify(v)); return true; } catch { toast('No se pudo guardar en el navegador'); return false; } },
  };

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function timeAgo(iso) {
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 3600) return `hace ${Math.max(1, Math.round(d / 60))} min`;
    if (d < 86400) return `hace ${Math.round(d / 3600)} h`;
    const days = Math.round(d / 86400);
    return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  }

  function isoDurationToSec(iso) {
    const m = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
    if (!m) return 0;
    return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
  }

  const tiktokUrl = (q) => `https://www.tiktok.com/search/video?q=${encodeURIComponent(q)}`;
  const igKeywordUrl = (q) => `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(q)}`;
  const igTagUrl = (tag) => `https://www.instagram.com/explore/tags/${encodeURIComponent(tag.replace(/[#\s]/g, '').toLowerCase())}/`;
  const ytShortsUrl = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' #shorts')}&sp=EgQIBRAB`;

  /* ---------- Estado ---------- */
  const DEFAULT_SETTINGS = { ytKey: '', geminiKey: '', model: 'gemini-2.5-flash', region: 'AR', grounding: true, templatesOnly: false };
  const GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
  const DEFAULT_ACCOUNTS = [
    {
      id: 'gym', name: 'Gym', emoji: '🏋️',
      context: 'Cuenta de Instagram de un gimnasio en Argentina. Público: socios actuales y gente de la zona que quiere empezar a entrenar. Objetivos: vender membresías y planes, generar comunidad, mostrar clases, profes y resultados. Tono: motivador, cercano y con humor argentino. Se suben 3 historias por día.',
    },
    {
      id: 'baddie', name: 'Baddie', emoji: '💅',
      context: 'Cuenta de Instagram "Baddie" (completá el rubro exacto: productos, precios, local/envíos). Público: mujeres jóvenes de Argentina. Objetivos: vender, generar interacción y comunidad. Tono: seguro, divertido, estética baddie y muy de tendencia. Se suben 3 historias por día.',
    },
  ];
  const GOALS = ['Sorteo', 'Venta / promo', 'Interactiva (encuesta/quiz)', 'Polémica', 'Humor / meme', 'Motivación', 'Detrás de escena', 'Tip / tutorial', 'Antes y después', 'Lanzamiento'];

  const state = {
    settings: { ...DEFAULT_SETTINGS, ...store.get('settings', {}) },
    accounts: store.get('accounts', null) || DEFAULT_ACCOUNTS,
    accountId: store.get('account', 'gym'),
    saved: store.get('saved', []),
    plans: store.get('plans', {}),
    goal: null,
    savedFilter: 'all',
    yt: { queries: [], tokens: {}, ids: new Set(), videos: [] },
    lastSearch: null,
  };
  if (state.settings.model === 'gemini-flash-latest') state.settings.model = DEFAULT_SETTINGS.model;
  if (!state.accounts.find((a) => a.id === state.accountId)) state.accountId = state.accounts[0]?.id;
  const account = () => state.accounts.find((a) => a.id === state.accountId) || state.accounts[0];
  const persistSaved = () => { store.set('saved', state.saved); $('#savedCount').textContent = state.saved.filter((s) => s.accountId === state.accountId).length; };

  /* ---------- Gemini ---------- */
  function extractJSON(text) {
    const clean = text.replace(/```(?:json)?/gi, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start < 0 || end < 0) throw new Error('La IA no devolvió un formato válido. Probá de nuevo.');
    return JSON.parse(clean.slice(start, end + 1));
  }

  // ¿Se puede usar Gemini ahora? (hay clave, no está en "solo plantillas" y no está sin cupo)
  const geminiBlockedUntil = () => +store.get('geminiBlockedUntil', 0);
  const canUseGemini = () => !!state.settings.geminiKey && !state.settings.templatesOnly && Date.now() > geminiBlockedUntil();

  function nextQuotaReset() {
    // El cupo diario de Gemini se reinicia a medianoche del Pacífico (~08:00 UTC)
    const d = new Date();
    d.setUTCHours(8, 0, 0, 0);
    if (d <= new Date()) d.setUTCDate(d.getUTCDate() + 1);
    return d.getTime();
  }

  async function gemini(prompt) {
    const { geminiKey, model, grounding } = state.settings;
    const system = 'Sos una community manager experta en Instagram (historias y reels) para marcas de Argentina. Conocés a fondo las tendencias virales actuales de TikTok, Instagram Reels y YouTube Shorts: formatos, audios, memes, frases y challenges. Escribís en español rioplatense, con ideas concretas y listas para producir con el celular. Respondés SOLO con JSON válido, sin markdown ni texto extra.';
    const call = async (m, useSearch) => {
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.95, ...(useSearch ? {} : { responseMimeType: 'application/json' }) },
        ...(useSearch ? { tools: [{ google_search: {} }] } : {}),
      };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { const e = new Error(data?.error?.message || `Error ${res.status} de Gemini`); e.status = res.status; throw e; }
      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts || []).map((p) => p.text || '').join('');
      if (!text) throw new Error('Gemini no devolvió contenido.');
      const sources = (cand.groundingMetadata?.groundingChunks || []).map((c) => c.web).filter(Boolean).slice(0, 8);
      return { json: extractJSON(text), sources, model: m };
    };

    const models = [...new Set([model || DEFAULT_SETTINGS.model, ...GEMINI_FALLBACK_MODELS])];
    let lastQuotaMsg = '';
    for (const m of models) {
      try {
        if (grounding) {
          try { return await call(m, true); }
          catch (e) { if (e.status === 429 || e.status === 401 || e.status === 403) throw e; }
        }
        return await call(m, false);
      } catch (e) {
        if (e.status === 401 || e.status === 403 || (e.status === 400 && /api key/i.test(e.message))) throw e; // clave inválida
        if (e.status === 429) { lastQuotaMsg = e.message; continue; } // sin cupo en este modelo → siguiente
        if (e.status === 404) continue; // modelo inexistente → siguiente
        throw e;
      }
    }
    // Todos los modelos sin cupo: no volver a intentar hasta que se libere
    const daily = /per\s*day|PerDay|daily/i.test(lastQuotaMsg);
    store.set('geminiBlockedUntil', daily ? nextQuotaReset() : Date.now() + 60000);
    const e = new Error(daily ? 'Gemini agotó el cupo gratis de hoy.' : 'Gemini está saturado por un momento.');
    e.quota = true;
    throw e;
  }

  const JSON_SHAPE = `{
  "tendencias": [{"nombre": "nombre corto de la tendencia/formato/audio", "descripcion": "qué es y cómo se usa"}],
  "ideas": [{
    "titulo": "nombre corto de la idea",
    "momento": "mañana | tarde | noche (solo si aplica)",
    "formato": "encuesta | quiz | pregunta | slider | cuenta regresiva | link | secuencia de historias | video/reel",
    "gancho": "texto exacto de la primera historia para frenar el scroll",
    "historias": ["Historia 1: qué se muestra + texto en pantalla", "Historia 2: ..."],
    "sticker": "sticker interactivo a usar y su texto exacto",
    "cta": "llamado a la acción",
    "audio": "audio, tendencia o estilo de música sugerido",
    "por_que": "por qué funciona hoy"
  }],
  "busquedas_videos": ["búsqueda corta 1", "búsqueda corta 2", "búsqueda corta 3"],
  "hashtags": ["hashtag sin numeral"]
}`;

  function searchPrompt({ q, goal, days }) {
    const acc = account();
    return `Fecha de hoy: ${todayLong()}.
Cuenta: ${acc.name}
Contexto de la cuenta: ${acc.context}
Objetivo de la historia: ${goal || 'libre'}
Pedido: "${q}"

1) Investigá qué formatos, audios, memes, frases y challenges están siendo tendencia en los últimos ${days} días en TikTok, Instagram Reels y YouTube Shorts, relacionados con este pedido y este rubro (priorizá Argentina/Latam, pero sumá tendencias globales si sirven).
2) Armá EXACTAMENTE 3 opciones de historias de Instagram distintas entre sí, adaptadas a la cuenta y al pedido, aprovechando esas tendencias.
3) Sugerí 3 o 4 búsquedas cortas (2 a 5 palabras, mezclando español e inglés) para encontrar videos virales de referencia en YouTube Shorts y TikTok.
4) Sugerí 8 hashtags relevantes.

Devolvé SOLO este JSON (de 3 a 5 tendencias, exactamente 3 ideas):
${JSON_SHAPE}`;
  }

  function planPrompt() {
    const acc = account();
    const prev = Object.entries(state.plans[acc.id] || {})
      .sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 7)
      .flatMap(([, p]) => (p.ideas || []).map((i) => i.titulo)).filter(Boolean);
    return `Fecha de hoy: ${todayLong()}.
Cuenta: ${acc.name}
Contexto de la cuenta: ${acc.context}

Armá el plan de historias de HOY: EXACTAMENTE 3 historias para subir a lo largo del día (una a la mañana, una a la tarde y una a la noche), que se complementen entre sí:
- una interactiva (encuesta, quiz, pregunta o slider),
- una de venta / conversión,
- una de comunidad, humor o tendencia viral del momento.
Basate en lo que está siendo tendencia esta semana en TikTok, Reels y Shorts, y tené en cuenta el día de la semana y fechas especiales cercanas.
${prev.length ? `No repitas estas ideas de días anteriores: ${prev.join(' | ')}.` : ''}
Completá "momento" en cada idea.

Devolvé SOLO este JSON (de 3 a 5 tendencias, exactamente 3 ideas):
${JSON_SHAPE}`;
  }

  /* ---------- YouTube ---------- */
  async function ytFetch(path, params) {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
    Object.entries({ ...params, key: state.settings.ytKey }).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = data?.error?.errors?.[0]?.reason;
      if (reason === 'quotaExceeded') throw new Error('Se agotó la cuota diaria de YouTube (se renueva mañana).');
      throw new Error(data?.error?.message || `Error ${res.status} de YouTube`);
    }
    return data;
  }

  async function ytSearchPage(queries, days, ctx = state.yt) {
    const publishedAfter = new Date(Date.now() - days * 86400000).toISOString();
    const region = (state.settings.region || 'AR').toUpperCase();
    const pages = await Promise.allSettled(queries.map((q) => {
      if (ctx.tokens[q] === null) return Promise.resolve({ items: [] }); // sin más páginas
      return ytFetch('search', {
        part: 'snippet', type: 'video', videoDuration: 'short', order: 'viewCount', maxResults: 25,
        q, publishedAfter, regionCode: region, relevanceLanguage: 'es', safeSearch: 'moderate',
        pageToken: ctx.tokens[q] || undefined,
      }).then((d) => { ctx.tokens[q] = d.nextPageToken || null; return d; });
    }));
    const failed = pages.find((p) => p.status === 'rejected');
    const ids = [...new Set(pages.flatMap((p) => (p.status === 'fulfilled' ? p.value.items : []).map((i) => i.id?.videoId)).filter(Boolean))]
      .filter((id) => !ctx.ids.has(id));
    if (!ids.length && failed) throw failed.reason;

    const videos = [];
    for (let i = 0; i < ids.length; i += 50) {
      const d = await ytFetch('videos', { part: 'snippet,statistics,contentDetails', id: ids.slice(i, i + 50).join(',') });
      d.items.forEach((v) => {
        const secs = isoDurationToSec(v.contentDetails?.duration);
        if (!secs || secs > 180) return; // solo formato vertical corto
        const views = +v.statistics?.viewCount || 0;
        const ageDays = Math.max((Date.now() - new Date(v.snippet.publishedAt)) / 86400000, 0.5);
        ctx.ids.add(v.id);
        videos.push({
          platform: 'youtube', id: v.id, url: `https://www.youtube.com/shorts/${v.id}`,
          title: v.snippet.title, channel: v.snippet.channelTitle, published: v.snippet.publishedAt,
          thumb: v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          views, likes: +v.statistics?.likeCount || 0, duration: secs, perDay: Math.round(views / ageDays),
        });
      });
    }
    return videos.sort((a, b) => b.perDay - a.perDay);
  }

  /* ---------- Render: cuentas y objetivos ---------- */
  const accName = (id) => state.accounts.find((a) => a.id === id)?.name || id;
  const platformLabel = { youtube: 'Shorts', tiktok: 'TikTok', instagram: 'Instagram', web: 'Link' };
  const showAccTag = () => !!$('#savedAllAccounts')?.checked;

  function renderAccounts() {
    $('#accounts').innerHTML = state.accounts.map((a) =>
      `<button class="acc ${a.id === state.accountId ? 'active' : ''}" data-id="${esc(a.id)}">${esc(a.emoji)} ${esc(a.name)}</button>`).join('');
    $('#planTitle').textContent = `Plan de hoy · ${account().name}`;
  }

  function renderGoals() {
    $('#goals').innerHTML = GOALS.map((g) => `<button type="button" class="chip ${state.goal === g ? 'active' : ''}" data-goal="${esc(g)}">${esc(g)}</button>`).join('');
  }

  function renderSetupHint() {
    const hint = $('#setupHint');
    hint.classList.toggle('hidden', !!state.settings.ytKey);
    if (!state.settings.ytKey) hint.innerHTML = 'Falta la clave de <b>YouTube</b> para buscar videos y tendencias (Gemini es opcional). <button type="button" data-open-settings>Abrir configuración</button>';
  }

  /* ---------- Render: ideas ---------- */
  function ideaText(i) {
    return [
      `📌 ${i.titulo}${i.momento ? ` (${i.momento})` : ''} — ${i.formato || ''}`,
      i.gancho && `Gancho: ${i.gancho}`,
      ...(i.historias || []),
      i.sticker && `Sticker: ${i.sticker}`,
      i.cta && `CTA: ${i.cta}`,
      i.audio && `Audio: ${i.audio}`,
    ].filter(Boolean).join('\n');
  }

  const sameIdea = (s, idea) => s.type === 'idea' && s.accountId === state.accountId && s.idea?.titulo === idea.titulo && s.idea?.gancho === idea.gancho;

  function ideaCard(idea, { savedItem } = {}) {
    const saved = !savedItem && state.saved.some((s) => sameIdea(s, idea));
    const key = encodeURIComponent(JSON.stringify(idea));
    return `<article class="idea">
      <div class="idea-top">
        ${idea.momento ? `<span class="tag alt">${esc(idea.momento)}</span>` : ''}
        ${idea.formato ? `<span class="tag">${esc(idea.formato)}</span>` : ''}
        ${savedItem && showAccTag() ? `<span class="acc-tag">${esc(accName(savedItem.accountId))}</span>` : ''}
      </div>
      <h4>${esc(idea.titulo)}</h4>
      ${idea.gancho ? `<div class="hook">“${esc(idea.gancho)}”</div>` : ''}
      ${idea.historias?.length ? `<ol>${idea.historias.map((h) => `<li>${esc(String(h).replace(/^Historia\s*\d+\s*:\s*/i, ''))}</li>`).join('')}</ol>` : ''}
      ${idea.sticker ? `<div class="kv"><span>Sticker:</span> ${esc(idea.sticker)}</div>` : ''}
      ${idea.cta ? `<div class="kv"><span>CTA:</span> ${esc(idea.cta)}</div>` : ''}
      ${idea.audio ? `<div class="kv"><span>Audio:</span> ${esc(idea.audio)}</div>` : ''}
      ${idea.por_que ? `<div class="kv muted small">💡 ${esc(idea.por_que)}</div>` : ''}
      ${savedItem ? `<textarea class="note" rows="1" placeholder="Nota…" data-note="${esc(savedItem.uid)}">${esc(savedItem.note || '')}</textarea>` : ''}
      <div class="idea-actions">
        ${savedItem
          ? `<button class="btn sm" data-del="${esc(savedItem.uid)}">🗑 Quitar</button>`
          : `<button class="btn sm ${saved ? 'saved' : ''}" data-save-idea="${key}">${saved ? '✓ Guardada' : '☆ Guardar'}</button>`}
        <button class="btn sm" data-copy-idea="${key}">⧉ Copiar</button>
        <button class="btn sm" data-ref-idea="${key}">🔎 Referencias</button>
      </div>
    </article>`;
  }

  /* ---------- Render: videos ---------- */
  function videoCard(v, { savedItem } = {}) {
    const isSaved = !savedItem && state.saved.some((s) => s.type === 'video' && s.video.url === v.url && s.accountId === state.accountId);
    const hot = v.perDay >= 50000;
    const key = encodeURIComponent(JSON.stringify(v));
    return `<article class="video">
      <div class="thumb" data-play="${key}">
        ${v.thumb ? `<img src="${esc(v.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="empty"><span class="big">🎬</span></div>`}
        <span class="play">▶</span>
        ${savedItem || v.platform !== 'youtube' ? `<span class="pill plat">${esc(platformLabel[v.platform] || 'Link')}</span>` : ''}
        ${hot ? '<span class="pill hot">🔥 Viral</span>' : ''}
        ${v.views ? `<span class="pill">👁 ${compact.format(v.views)}</span>` : ''}
      </div>
      <div class="vmeta">
        <div class="vtitle clamp2" title="${esc(v.title)}">${esc(v.title || v.url)}</div>
        <div class="vsub">${[v.channel && esc(v.channel), v.published && timeAgo(v.published), v.perDay && `${compact.format(v.perDay)}/día`].filter(Boolean).join(' · ')}</div>
        ${savedItem && showAccTag() ? `<div class="acc-tag">${esc(accName(savedItem.accountId))}</div>` : ''}
        ${savedItem ? `<textarea class="note" rows="1" placeholder="Nota…" data-note="${esc(savedItem.uid)}">${esc(savedItem.note || '')}</textarea>` : ''}
        <div class="vactions">
          ${savedItem
            ? `<button class="btn sm" data-del="${esc(savedItem.uid)}">🗑</button>`
            : `<button class="btn sm ${isSaved ? 'saved' : ''}" data-save-video="${key}">${isSaved ? '✓' : '☆'}</button>`}
          <a class="btn sm" href="${esc(v.url)}" target="_blank" rel="noopener">Abrir ↗</a>
        </div>
      </div>
    </article>`;
  }

  /* ---------- Búsqueda ---------- */
  const loadingHTML = (msg) => `<div class="loading"><div class="spinner"></div>${esc(msg)}</div>`;

  function fallbackQueries(q, goal) {
    const base = q.replace(/quiero hacer (una )?historia (para|de|sobre)?( un| una)?/i, '').trim() || q;
    return [...new Set([base, `${base} ${goal || ''}`.trim(), `${account().name} ${base}`])].slice(0, 3);
  }

  // Plantillas: rota para no repetir las últimas usadas por cuenta
  const usedTemplates = () => new Set(store.get('tplUsed', {})[state.accountId] || []);
  function templateResult({ q, goal, videos, plan }) {
    const r = window.TemplateEngine.generate({ q, goal, plan, accountName: account().name, videos, used: usedTemplates() });
    const all = store.get('tplUsed', {});
    all[state.accountId] = [...r.usedIds, ...(all[state.accountId] || [])].slice(0, 12);
    store.set('tplUsed', all);
    return r;
  }
  const aiFailNote = (e, what) => `${e.quota ? e.message : `Gemini: ${e.message}.`} ${what} con plantillas.`;
  const aiSkippedNote = (what) => (state.settings.geminiKey && !state.settings.templatesOnly ? `Gemini sin cupo por ahora: ${what} con plantillas.` : '');

  async function doSearch(preset) {
    const q = (preset?.q ?? $('#q').value).trim();
    if (!q) { $('#q').focus(); toast('Escribí qué historia querés hacer'); return; }
    const { ytKey, geminiKey } = state.settings;
    if (!ytKey && !geminiKey) { openSettings(); toast('Cargá la clave de YouTube'); return; }

    const goal = preset?.goal ?? state.goal;
    const days = +$('#period').value;
    const btn = $('#btnSearch');
    btn.disabled = true;
    $('#results').innerHTML = loadingHTML(canUseGemini() ? 'Investigando tendencias y armando ideas…' : 'Buscando videos virales…');
    state.yt = { queries: [], tokens: {}, ids: new Set(), videos: [], error: '' };

    let ai = null;
    let aiNote = '';
    if (canUseGemini()) {
      try { ai = await gemini(searchPrompt({ q, goal, days })); } catch (e) { aiNote = aiFailNote(e, 'Ideas armadas'); }
    } else aiNote = aiSkippedNote('ideas armadas');

    const data = ai?.json || {};
    const queries = (Array.isArray(data.busquedas_videos) && data.busquedas_videos.length ? data.busquedas_videos : fallbackQueries(q, goal)).slice(0, 4);
    state.yt.queries = queries;
    if (ytKey) {
      $('#results').innerHTML = loadingHTML('Buscando Shorts virales…');
      try { state.yt.videos = await ytSearchPage(queries, days); } catch (e) { state.yt.error = e.message; }
    }

    const source = data.ideas?.length ? 'ia' : 'plantillas';
    if (source === 'plantillas') {
      const t = templateResult({ q, goal, videos: state.yt.videos });
      data.ideas = t.ideas;
      if (!data.tendencias?.length) data.tendencias = t.tendencias;
      if (!data.hashtags?.length) data.hashtags = t.hashtags;
    }
    state.lastSearch = { q, goal, days, data, sources: ai?.sources || [], aiNote, queries, source };
    renderResults();
    renderVideos();
    btn.disabled = false;
  }

  function regenTemplates() {
    const ls = state.lastSearch;
    if (!ls) return;
    ls.data.ideas = templateResult({ q: ls.q, goal: ls.goal, videos: state.yt.videos }).ideas;
    ls.source = 'plantillas';
    renderResults();
    renderVideos();
  }

  const sourceTag = (src) => `<span class="tag ${src === 'ia' ? '' : 'alt'}">${src === 'ia' ? 'IA' : 'Plantillas'}</span>`;

  const trendsHTML = (list) => `<div class="trends">${list.map((t) => `<div class="trend"><b>${esc(t.nombre)}</b><span class="muted small">${esc(t.descripcion)}</span></div>`).join('')}</div>`;

  function renderResults() {
    const { q, data, sources, aiNote, queries, source } = state.lastSearch;
    const tags = (data.hashtags || []).slice(0, 10);
    $('#results').innerHTML = `
      ${aiNote ? `<div class="hint">${esc(aiNote)}</div>` : ''}
      ${data.tendencias?.length ? `
        <div class="section-title"><h2>📈 Tendencias del momento</h2></div>
        ${trendsHTML(data.tendencias)}
        ${sources.length ? `<div class="sources">${sources.map((s) => `<a href="${esc(s.uri)}" target="_blank" rel="noopener" title="${esc(s.title)}">${esc(s.title || 'fuente')}</a>`).join('')}</div>` : ''}` : ''}
      ${data.ideas?.length ? `
        <div class="section-title"><h2>✨ 3 opciones de historia</h2><div class="idea-top">${sourceTag(source)}${source === 'plantillas' ? '<button class="btn sm" data-regen>↻ Otras</button>' : ''}</div></div>
        <div class="ideas">${data.ideas.map((i) => ideaCard(i)).join('')}</div>` : ''}
      <div class="section-title"><h2>🎬 Videos virales</h2><span class="muted small">por vistas por día</span></div>
      <div id="videosBody">${state.settings.ytKey ? '' : `<div class="hint">Agregá la clave de YouTube en <button type="button" data-open-settings>Configuración</button> para ver Shorts virales acá mismo.</div>`}</div>
      <div class="section-title"><h2>🔗 Buscar en las apps</h2></div>
      <div class="card">
        <div class="label small" style="margin-top:0">TikTok</div>
        <div class="links-out">${[...new Set([q, ...queries])].slice(0, 5).map((s) => `<a class="chip" href="${esc(tiktokUrl(s))}" target="_blank" rel="noopener">♪ ${esc(s)}</a>`).join('')}</div>
        <div class="label small">Instagram Reels</div>
        <div class="links-out">
          ${queries.slice(0, 3).map((s) => `<a class="chip" href="${esc(igKeywordUrl(s))}" target="_blank" rel="noopener">◎ ${esc(s)}</a>`).join('')}
          ${tags.map((t) => `<a class="chip" href="${esc(igTagUrl(String(t)))}" target="_blank" rel="noopener">#${esc(String(t).replace(/^#/, ''))}</a>`).join('')}
        </div>
        <div class="label small">YouTube Shorts</div>
        <div class="links-out">${queries.slice(0, 4).map((s) => `<a class="chip" href="${esc(ytShortsUrl(s))}" target="_blank" rel="noopener">▶ ${esc(s)}</a>`).join('')}</div>
        <p class="muted tiny" style="margin-bottom:0">¿Encontraste algo bueno en TikTok o Instagram? Copiá el link y guardalo desde Guardados.</p>
      </div>`;
  }

  function renderVideos() {
    const el = $('#videosBody');
    if (!el || !state.settings.ytKey) return;
    if (state.yt.error) { el.innerHTML = `<div class="error">${esc(state.yt.error)}</div>`; return; }
    const vids = state.yt.videos;
    const hasMore = state.yt.queries.some((q) => state.yt.tokens[q]);
    el.innerHTML = vids.length
      ? `<div class="videos">${vids.map((v) => videoCard(v)).join('')}</div>${hasMore ? '<div class="more"><button class="btn" id="btnMore">Ver más videos</button></div>' : ''}`
      : `<div class="empty"><span class="big">🤷</span>No encontré Shorts recientes con esas búsquedas. Probá con un período más largo o con otras palabras.</div>`;
  }

  async function loadMore(btn) {
    btn.disabled = true; btn.textContent = 'Cargando…';
    try {
      const more = await ytSearchPage(state.yt.queries.filter((q) => state.yt.tokens[q]), state.lastSearch.days);
      state.yt.videos = [...state.yt.videos, ...more];
      renderVideos();
    } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = 'Ver más videos'; }
  }

  /* ---------- Plan del día ---------- */
  function renderPlan() {
    $('#planDate').textContent = todayLong();
    const plan = state.plans[state.accountId]?.[todayKey()];
    $('#btnPlan').textContent = plan ? '↻ Generar otras 3' : 'Generar 3 historias';
    $('#planBody').innerHTML = !plan
      ? `<div class="empty"><span class="big">📅</span>Generá las 3 historias de hoy para <b>${esc(account().name)}</b> según las tendencias de la semana.</div>`
      : `${plan.note ? `<div class="hint">${esc(plan.note)}</div>` : ''}
         ${plan.tendencias?.length ? `<div class="section-title"><h2>📈 Tendencias que usa este plan</h2></div>${trendsHTML(plan.tendencias)}` : ''}
         <div class="section-title"><h2>✨ Historias de hoy</h2>${sourceTag(plan.source || 'ia')}</div>
         <div class="ideas">${(plan.ideas || []).map((i) => ideaCard(i)).join('')}</div>
         ${plan.videos?.length ? `<div class="section-title"><h2>🎬 Videos de referencia</h2><span class="muted small">últimos 7 días</span></div><div class="videos">${plan.videos.map((v) => videoCard(v)).join('')}</div>` : ''}`;
  }

  async function generatePlan() {
    const { ytKey, geminiKey } = state.settings;
    if (!ytKey && !geminiKey) { openSettings(); toast('Cargá la clave de YouTube'); return; }
    const btn = $('#btnPlan');
    btn.disabled = true;
    $('#planBody').innerHTML = loadingHTML('Armando el plan de hoy con las tendencias de la semana…');

    let json = null;
    let note = '';
    if (canUseGemini()) {
      try { json = (await gemini(planPrompt())).json; } catch (e) { note = aiFailNote(e, 'Plan armado'); }
    } else note = aiSkippedNote('plan armado');

    let videos = [];
    if (ytKey) {
      const queries = json?.busquedas_videos?.length ? json.busquedas_videos.slice(0, 2) : [account().name];
      try { videos = await ytSearchPage(queries, 7, { tokens: {}, ids: new Set() }); } catch (e) { note = `${note} ${e.message}`.trim(); }
    }

    let source = 'ia';
    if (!json?.ideas?.length) {
      source = 'plantillas';
      const t = templateResult({ plan: true, videos });
      json = { ideas: t.ideas, tendencias: t.tendencias };
    }

    const accId = state.accountId;
    state.plans[accId] = state.plans[accId] || {};
    state.plans[accId][todayKey()] = { ideas: json.ideas || [], tendencias: json.tendencias || [], videos: videos.slice(0, 8), source, note };
    Object.keys(state.plans[accId]).sort().slice(0, -14).forEach((k) => delete state.plans[accId][k]); // últimos 14 días
    store.set('plans', state.plans);
    renderPlan();
    btn.disabled = false;
  }

  /* ---------- Guardados ---------- */
  function savedForView() {
    const all = showAccTag();
    return state.saved.filter((s) => (all || s.accountId === state.accountId) && (state.savedFilter === 'all' || s.type === state.savedFilter));
  }

  function renderSaved() {
    const items = savedForView();
    $('#savedCount').textContent = state.saved.filter((s) => s.accountId === state.accountId).length;
    const videos = items.filter((s) => s.type === 'video');
    const ideas = items.filter((s) => s.type === 'idea');
    $('#savedBody').innerHTML = !items.length
      ? '<div class="empty"><span class="big">⭐</span>Todavía no guardaste nada. Tocá ☆ en un video o una idea.</div>'
      : `${ideas.length ? `<div class="section-title"><h2>✨ Ideas (${ideas.length})</h2></div><div class="ideas">${ideas.map((s) => ideaCard(s.idea, { savedItem: s })).join('')}</div>` : ''}
         ${videos.length ? `<div class="section-title"><h2>🎬 Videos (${videos.length})</h2></div><div class="videos">${videos.map((s) => videoCard(s.video, { savedItem: s })).join('')}</div>` : ''}`;
  }

  function toggleSaveVideo(v, btn) {
    const idx = state.saved.findIndex((s) => s.type === 'video' && s.video.url === v.url && s.accountId === state.accountId);
    if (idx >= 0) { state.saved.splice(idx, 1); toast('Quitado de guardados'); }
    else { state.saved.unshift({ uid: uid(), type: 'video', accountId: state.accountId, createdAt: Date.now(), note: '', video: v }); toast('Guardado ⭐'); }
    persistSaved();
    $$(`[data-save-video="${CSS.escape(btn?.dataset.saveVideo || '')}"]`).forEach((b) => { b.classList.toggle('saved', idx < 0); b.textContent = idx < 0 ? '✓' : '☆'; });
  }

  function toggleSaveIdea(idea, btn) {
    const idx = state.saved.findIndex((s) => sameIdea(s, idea));
    if (idx >= 0) { state.saved.splice(idx, 1); toast('Idea quitada'); }
    else { state.saved.unshift({ uid: uid(), type: 'idea', accountId: state.accountId, createdAt: Date.now(), note: '', idea }); toast('Idea guardada ⭐'); }
    persistSaved();
    if (btn) { btn.classList.toggle('saved', idx < 0); btn.textContent = idx < 0 ? '✓ Guardada' : '☆ Guardar'; }
  }

  function parseLink(raw) {
    let url;
    try { url = new URL(raw.trim()); } catch { return null; }
    const href = url.href;
    const yt = /(?:youtube\.com\/(?:shorts\/|watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/.exec(href);
    if (yt) return { platform: 'youtube', id: yt[1], url: `https://www.youtube.com/shorts/${yt[1]}`, thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`, title: '' };
    if (/tiktok\.com$/.test(url.hostname)) return { platform: 'tiktok', id: /\/video\/(\d+)/.exec(href)?.[1], url: href, thumb: '', title: '' };
    if (/instagram\.com$/.test(url.hostname)) return { platform: 'instagram', id: /\/(?:reel|reels|p)\/([\w-]+)/.exec(href)?.[1], url: href, thumb: '', title: '' };
    return { platform: 'web', url: href, thumb: '', title: url.hostname };
  }

  async function addLink() {
    const input = $('#addUrl');
    const v = parseLink(input.value);
    if (!v) { toast('Ese link no parece válido'); return; }
    if (state.saved.some((s) => s.type === 'video' && s.video.url === v.url && s.accountId === state.accountId)) { toast('Ya estaba guardado'); return; }
    // Título/miniatura vía oEmbed público; si el navegador lo bloquea, se guarda igual.
    try {
      if (v.platform === 'tiktok') {
        const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(v.url)}`);
        if (r.ok) { const d = await r.json(); v.title = d.title || ''; v.thumb = d.thumbnail_url || ''; v.channel = d.author_name || ''; }
      } else if (v.platform === 'youtube') {
        const r = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(v.url)}`);
        if (r.ok) { const d = await r.json(); v.title = d.title || ''; v.channel = d.author_name || ''; }
      }
    } catch { /* sin datos extra */ }
    if (!v.title) v.title = `${platformLabel[v.platform] || 'Link'} guardado`;
    toggleSaveVideo(v);
    input.value = '';
    renderSaved();
  }

  /* ---------- Reproductor ---------- */
  function openPlayer(v) {
    let src = '';
    if (v.platform === 'youtube' && v.id) src = `https://www.youtube.com/embed/${encodeURIComponent(v.id)}?autoplay=1&playsinline=1&rel=0`;
    else if (v.platform === 'tiktok' && v.id) src = `https://www.tiktok.com/embed/v2/${encodeURIComponent(v.id)}`;
    else if (v.platform === 'instagram' && v.id) src = `https://www.instagram.com/reel/${encodeURIComponent(v.id)}/embed`;
    if (!src) { window.open(v.url, '_blank', 'noopener'); return; }
    $('#playerTitle').textContent = v.title || 'Video';
    $('#playerFrame').innerHTML = `<iframe src="${esc(src)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    const isSaved = state.saved.some((s) => s.type === 'video' && s.video.url === v.url && s.accountId === state.accountId);
    $('#playerActions').innerHTML = `
      <button class="btn grow ${isSaved ? 'saved' : ''}" data-save-video="${encodeURIComponent(JSON.stringify(v))}">${isSaved ? '✓' : '☆'}</button>
      <a class="btn grow" href="${esc(v.url)}" target="_blank" rel="noopener">Abrir en la app ↗</a>`;
    $('#dlgPlayer').showModal();
  }
  function closePlayer() { $('#playerFrame').innerHTML = ''; $('#dlgPlayer').close(); }

  /* ---------- Configuración ---------- */
  let draftAccounts = [];
  function renderAccountsEdit() {
    $('#accountsEdit').innerHTML = draftAccounts.map((a, i) => `
      <div class="acc-edit" data-i="${i}">
        <div class="row keep">
          <input class="emoji" type="text" value="${esc(a.emoji)}" data-f="emoji" aria-label="Emoji">
          <input class="grow" type="text" value="${esc(a.name)}" data-f="name" placeholder="Nombre" aria-label="Nombre">
          ${draftAccounts.length > 1 ? `<button type="button" class="icon-btn" data-rm="${i}" title="Eliminar cuenta">🗑</button>` : ''}
        </div>
        <textarea data-f="context" placeholder="Rubro, público, productos, precios, tono, objetivos…">${esc(a.context)}</textarea>
      </div>`).join('');
  }

  function openSettings() {
    const s = state.settings;
    $('#setYt').value = s.ytKey; $('#setGem').value = s.geminiKey;
    $('#setModel').value = s.model; $('#setRegion').value = s.region; $('#setGround').checked = !!s.grounding; $('#setTplOnly').checked = !!s.templatesOnly;
    draftAccounts = state.accounts.map((a) => ({ ...a }));
    renderAccountsEdit();
    if (!$('#dlgSettings').open) $('#dlgSettings').showModal();
  }

  function saveSettings() {
    state.settings = {
      ytKey: $('#setYt').value.trim(), geminiKey: $('#setGem').value.trim(),
      model: $('#setModel').value.trim() || DEFAULT_SETTINGS.model,
      region: ($('#setRegion').value.trim() || 'AR').toUpperCase(), grounding: $('#setGround').checked,
      templatesOnly: $('#setTplOnly').checked,
    };
    store.set('settings', state.settings);
    store.set('geminiBlockedUntil', 0); // al cambiar la config se reintenta Gemini
    const accs = draftAccounts.filter((a) => a.name.trim()).map((a) => ({ ...a, name: a.name.trim(), emoji: a.emoji.trim() || '✨' }));
    state.accounts = accs.length ? accs : DEFAULT_ACCOUNTS;
    if (!state.accounts.find((a) => a.id === state.accountId)) state.accountId = state.accounts[0].id;
    store.set('accounts', state.accounts);
    store.set('account', state.accountId);
    $('#dlgSettings').close();
    renderAll();
    toast('Configuración guardada');
  }

  function exportData() {
    const data = { app: 'buscador-tendencias', version: 1, exportedAt: new Date().toISOString(), accounts: state.accounts, saved: state.saved, plans: state.plans };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `tendencias-backup-${todayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result);
        if (d.app !== 'buscador-tendencias') throw new Error('formato');
        const known = new Set(state.saved.map((s) => s.uid));
        state.saved = [...state.saved, ...(d.saved || []).filter((s) => !known.has(s.uid))];
        (d.accounts || []).forEach((a) => { if (!state.accounts.find((x) => x.id === a.id)) state.accounts.push(a); });
        state.plans = { ...(d.plans || {}), ...state.plans };
        store.set('saved', state.saved); store.set('accounts', state.accounts); store.set('plans', state.plans);
        draftAccounts = state.accounts.map((a) => ({ ...a })); renderAccountsEdit();
        renderAll();
        toast('Respaldo importado');
      } catch { toast('El archivo no es un respaldo válido'); }
    };
    reader.readAsText(file);
  }

  /* ---------- Navegación y eventos ---------- */
  function switchTab(name) {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    $$('.panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
    if (name === 'guardados') renderSaved();
    if (name === 'plan') renderPlan();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() {
    renderAccounts(); renderGoals(); renderSetupHint(); renderPlan(); renderSaved();
    if (state.lastSearch) { renderResults(); if (state.settings.ytKey) renderVideos(); }
  }

  const decode = (s) => JSON.parse(decodeURIComponent(s));

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-play]');
    if (!t) return;
    const d = t.dataset;
    if (t.classList.contains('acc')) { state.accountId = d.id; store.set('account', d.id); renderAll(); return; }
    if (t.classList.contains('tab')) { switchTab(d.tab); return; }
    if (d.goal) { state.goal = state.goal === d.goal ? null : d.goal; renderGoals(); return; }
    if ('openSettings' in d) { openSettings(); return; }
    if (d.play) { openPlayer(decode(d.play)); return; }
    if (d.saveVideo) { toggleSaveVideo(decode(d.saveVideo), t); return; }
    if (d.saveIdea) { toggleSaveIdea(decode(d.saveIdea), t); return; }
    if (d.copyIdea) {
      navigator.clipboard?.writeText(ideaText(decode(d.copyIdea))).then(() => toast('Copiada 📋'), () => toast('No se pudo copiar'));
      return;
    }
    if (d.refIdea) {
      const idea = decode(d.refIdea);
      $('#q').value = idea.titulo;
      switchTab('buscar');
      doSearch({ q: `${idea.titulo}. ${idea.gancho || ''}`.trim(), goal: idea.formato });
      return;
    }
    if ('regen' in d) { regenTemplates(); return; }
    if (d.del) { state.saved = state.saved.filter((s) => s.uid !== d.del); persistSaved(); renderSaved(); return; }
    if (d.rm) { draftAccounts.splice(+d.rm, 1); renderAccountsEdit(); return; }
    if (d.f && t.closest('#savedFilter')) {
      state.savedFilter = d.f;
      $$('#savedFilter button').forEach((b) => b.classList.toggle('active', b === t));
      renderSaved();
      return;
    }
    switch (t.id) {
      case 'btnSearch': doSearch(); break;
      case 'btnMore': loadMore(t); break;
      case 'btnPlan': generatePlan(); break;
      case 'btnSettings': openSettings(); break;
      case 'btnSaveSettings': saveSettings(); break;
      case 'btnAddAccount': draftAccounts.push({ id: uid(), name: '', emoji: '✨', context: '' }); renderAccountsEdit(); break;
      case 'btnExport': exportData(); break;
      case 'btnAddUrl': addLink(); break;
      case 'btnClosePlayer': closePlayer(); break;
      default: break;
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    const box = el.closest('.acc-edit');
    if (box && el.dataset.f) { draftAccounts[+box.dataset.i][el.dataset.f] = el.value; return; }
    if (el.dataset.note) {
      const item = state.saved.find((s) => s.uid === el.dataset.note);
      if (item) { item.note = el.value; clearTimeout(el._t); el._t = setTimeout(() => store.set('saved', state.saved), 400); }
    }
  });

  $('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doSearch(); });
  $('#addUrl').addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
  $('#savedAllAccounts').addEventListener('change', renderSaved);
  $('#fileImport').addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; });
  $('#dlgPlayer').addEventListener('close', () => { $('#playerFrame').innerHTML = ''; });
  $('#dlgPlayer').addEventListener('click', (e) => { if (e.target.id === 'dlgPlayer') closePlayer(); });

  $('#dlgSettings').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault(); });

  renderAll();
  if (!state.settings.ytKey) setTimeout(openSettings, 400);
})();
