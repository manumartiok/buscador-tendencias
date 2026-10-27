/* Generador de ideas por plantillas (sin IA, sin límites).
 * Combina formatos probados de historias con las palabras y hashtags que se repiten en los Shorts virales.
 * Placeholders: {tema|texto si falta}, {cuenta}, {kw}, {tag}. */
(() => {
  'use strict';

  const T = {
    sorteo: [
      { id: 'sor1', titulo: 'Sorteo en 3 historias', formato: 'secuencia de historias', gancho: '🚨 SORTEO 🚨 Te podés llevar {tema|[el premio]}',
        historias: ['Video corto mostrando el premio con un audio en tendencia', 'Requisitos: seguirnos, reaccionar con 🔥 y compartir esta historia etiquetando a alguien', 'Cuenta regresiva con la fecha del sorteo'],
        sticker: 'Cuenta regresiva: "Sorteo {tema|del premio}"', cta: 'Compartila y etiquetá a quien se lo quiere ganar', por_que: 'Los sorteos multiplican compartidos y seguidores nuevos en pocas horas.' },
      { id: 'sor2', titulo: 'Sorteo con caja de preguntas', formato: 'pregunta', gancho: '¿Querés ganarte {tema|[el premio]}? 👀',
        historias: ['Mostrá el premio con texto: "esto puede ser tuyo"', 'Sticker de preguntas: cada respuesta es una participación', 'Al otro día compartí las respuestas más graciosas antes de anunciar al ganador'],
        sticker: 'Preguntas: "¿Por qué te lo merecés vos? 😏"', cta: 'Respondé para participar', por_que: 'Las respuestas generan conversación y contenido para las historias del día siguiente.' },
      { id: 'sor3', titulo: 'Sorteo relámpago 24 h', formato: 'quiz', gancho: '⚡ Sorteo relámpago: solo por hoy',
        historias: ['Anuncio con texto grande y el premio: {tema|[premio]}', 'Quiz con una pregunta sobre {cuenta}: entre los que acierten se sortea', 'A la noche: anunciá el ganador por historia'],
        sticker: 'Quiz: pregunta fácil sobre {cuenta} con 3 opciones', cta: 'Respondé bien y ya participás', por_que: 'La urgencia de 24 h hace que respondan en el momento en vez de dejarlo para después.' },
    ],
    venta: [
      { id: 'ven1', titulo: 'Oferta con cuenta regresiva', formato: 'cuenta regresiva', gancho: 'Esto dura poco ⏳ Promo en {tema|producto|[tu oferta]}',
        historias: ['Mostrá {producto|el producto/servicio} con un audio en tendencia', 'Precio tachado vs precio de hoy, bien grande', 'Cuenta regresiva + cómo comprar (DM o link)'],
        sticker: 'Cuenta regresiva: "Termina la promo"', cta: 'Escribinos "QUIERO" por DM', por_que: 'La cuenta regresiva activa recordatorios y genera urgencia real.' },
      { id: 'ven2', titulo: 'Encuesta antes de la promo', formato: 'encuesta', gancho: '¿Y si les hago precio en {tema|producto|[producto]}? 🤔',
        historias: ['Encuesta: "¿Lo quieren con descuento?" (SÍ / OBVIO)', 'Mostrá el resultado de la encuesta con texto: "ustedes lo pidieron"', 'Revelá la promo y cómo aprovecharla'],
        sticker: 'Encuesta: SÍ 🙌 / OBVIO 🔥', cta: 'Respondé la encuesta y te aviso primero', por_que: 'Quien vota ya se comprometió; la venta posterior se siente pedida por la comunidad.' },
      { id: 'ven3', titulo: 'Prueba social + link', formato: 'link', gancho: 'Lo que dicen de {tema|nosotros} 👇',
        historias: ['Captura de un mensaje o reseña real de un cliente', 'Video corto del resultado o producto', 'Sticker de link para comprar/reservar'],
        sticker: 'Link: "Lo quiero"', cta: 'Tocá el link y asegurá el tuyo', por_que: 'Las opiniones de clientes reales bajan la desconfianza antes de comprar.' },
    ],
    interactiva: [
      { id: 'int1', titulo: 'Quiz: ¿cuánto sabés?', formato: 'quiz', gancho: '¿Cuánto sabés de {tema|rubro|esto}? 🧠',
        historias: ['Pregunta 1 con quiz de 3 opciones', 'Pregunta 2 un poco más difícil', 'Resultado: "si acertaste las 2, sos de los nuestros"'],
        sticker: 'Quiz con 3 opciones (una graciosa)', cta: 'Contanos cuántas acertaste', por_que: 'Los quiz suben el tiempo de visualización y el alcance de las historias siguientes.' },
      { id: 'int2', titulo: 'Esto o aquello', formato: 'encuesta', gancho: '¿Team A o team B? 👀',
        historias: ['Foto dividida en dos opciones relacionadas con {tema|rubro|la cuenta}', 'Encuesta con las dos opciones', 'Al final del día: mostrá cuál ganó'],
        sticker: 'Encuesta: opción A / opción B', cta: 'Votá y defendé tu team por DM', por_que: 'Decidir entre dos opciones es la interacción más rápida y la que más gente responde.' },
      { id: 'int3', titulo: 'Slider: ¿cuánto te identifica?', formato: 'slider', gancho: '¿Cuánto te identifica esto? 😂',
        historias: ['Frase o situación muy reconocible sobre {tema|rubro|el rubro}', 'Slider con emoji', 'Compartí resultados o reacciones'],
        sticker: 'Slider con emoji 😅', cta: 'Mandáselo a quien le pasa', por_que: 'Lo identificable se comparte por DM, que es la señal que más pesa en el alcance.' },
      { id: 'int4', titulo: 'Caja de preguntas', formato: 'pregunta', gancho: 'Preguntame lo que quieras sobre {tema|{cuenta}} 💬',
        historias: ['Caja de preguntas con fondo llamativo', 'Respondé 3–5 preguntas con video o texto', 'Cerrá con una respuesta que lleve a la venta o reserva'],
        sticker: 'Preguntas: "Preguntá sin vergüenza"', cta: 'Dejá tu pregunta', por_que: 'Te da contenido para varias historias y muestra cercanía.' },
    ],
    polemica: [
      { id: 'pol1', titulo: 'Opinión impopular', formato: 'encuesta', gancho: 'Opinión impopular: {tema|[tu opinión polémica]} 🔥',
        historias: ['Texto grande con la opinión impopular', 'Encuesta: "De acuerdo / Ni ahí"', 'Respondé algunos DMs de los que no están de acuerdo'],
        sticker: 'Encuesta: De acuerdo ✅ / Ni ahí ❌', cta: 'Defendé tu postura por DM', por_que: 'Las opiniones divididas generan muchas respuestas y debate.' },
      { id: 'pol2', titulo: 'Mito o verdad', formato: 'quiz', gancho: '¿Mito o verdad? 🤔 {tema|[afirmación polémica]}',
        historias: ['Afirmación polémica sobre {rubro|el rubro}', 'Quiz: Mito / Verdad', 'Revelá la respuesta con una explicación corta'],
        sticker: 'Quiz: Mito / Verdad', cta: 'Seguinos para más mitos', por_que: 'Combina polémica con dato útil: engancha sin quemar la imagen de la marca.' },
      { id: 'pol3', titulo: 'Red flag o green flag', formato: 'encuesta', gancho: '¿Red flag o green flag? 🚩💚',
        historias: ['Situación relacionada con {tema|rubro|el rubro} en texto', 'Encuesta: 🚩 / 💚', 'Resultado + tu opinión'],
        sticker: 'Encuesta: 🚩 Red flag / 💚 Green flag', cta: 'Mandale esto a quien es red flag', por_que: 'Formato viral muy reconocible que invita a votar y compartir.' },
    ],
    humor: [
      { id: 'hum1', titulo: 'POV en tendencia', formato: 'video/reel', gancho: 'POV: {tema|[situación graciosa]} 😂',
        historias: ['Video corto actuando la situación con un audio en tendencia', 'Texto POV arriba, bien grande', 'Slider de emoji para reaccionar'],
        sticker: 'Slider 😂', cta: 'Etiquetá a quien le pasa', por_que: 'Los POV con audio en tendencia son de lo que más se comparte por DM.' },
      { id: 'hum2', titulo: 'Expectativa vs realidad', formato: 'secuencia de historias', gancho: 'Expectativa vs realidad 💀',
        historias: ['Expectativa: la versión perfecta de {tema|producto|lo que hacemos}', 'Realidad: la versión graciosa/real', 'Encuesta: "¿Cuál sos vos?"'],
        sticker: 'Encuesta: Expectativa / Realidad', cta: 'Contanos tu realidad por DM', por_que: 'El humor autocrítico humaniza la cuenta y genera respuestas.' },
      { id: 'hum3', titulo: 'Tipos de personas', formato: 'secuencia de historias', gancho: 'Tipos de personas en {cuenta} 😅',
        historias: ['Tipo 1 con foto/video y texto corto', 'Tipo 2 y tipo 3', 'Encuesta o quiz: "¿Cuál sos?"'],
        sticker: 'Quiz: ¿Cuál de todos sos?', cta: 'Etiquetá a cada tipo', por_que: 'Invita a etiquetar amigos, lo que trae alcance nuevo.' },
    ],
    motivacion: [
      { id: 'mot1', titulo: 'Desafío del día', formato: 'slider', gancho: 'Desafío de hoy: {tema|[desafío]} 💪',
        historias: ['Presentá el desafío con video en movimiento', 'Slider: "¿Cuánta energía tenés hoy?"', 'Pedí que suban historia cumpliéndolo y te etiqueten'],
        sticker: 'Slider ⚡', cta: 'Subilo y etiquetanos', por_que: 'Genera contenido de los seguidores que te etiqueta y trae alcance.' },
      { id: 'mot2', titulo: 'Frase + historia real', formato: 'secuencia de historias', gancho: 'Nadie habla de esto… 👇',
        historias: ['Frase motivadora corta sobre {tema|el proceso}', 'Historia real de alguien de la comunidad', 'Caja: "¿Qué te motiva a vos?"'],
        sticker: 'Preguntas: "¿Qué te motiva?"', cta: 'Contanos tu historia', por_que: 'Las historias reales generan conexión y respuestas largas.' },
    ],
    detras: [
      { id: 'det1', titulo: 'Un día en {cuenta}', formato: 'secuencia de historias', gancho: 'Así es un día en {cuenta} 👀',
        historias: ['Apertura del día (video corto)', 'Momento clave del día con texto', 'Cierre + encuesta "¿Querés ver más de esto?"'],
        sticker: 'Encuesta: Sí, más 🙌 / Ya fue', cta: 'Seguinos para ver la parte 2', por_que: 'El detrás de escena genera confianza y es fácil de grabar.' },
      { id: 'det2', titulo: 'Cómo se prepara', formato: 'video/reel', gancho: 'Te muestro cómo se arma {tema|esto} ✨',
        historias: ['Proceso acelerado con audio en tendencia', 'Detalle que nadie ve', 'Resultado final + link o DM'],
        sticker: 'Pregunta: "¿Qué querés ver ahora?"', cta: 'Pedinos el tuyo por DM', por_que: 'Los procesos tienen alta retención: la gente quiere ver el final.' },
    ],
    tip: [
      { id: 'tip1', titulo: '3 tips rápidos', formato: 'secuencia de historias', gancho: '3 tips de {tema|rubro|[tema]} que nadie te dice 👇',
        historias: ['Tip 1 con texto grande', 'Tip 2', 'Tip 3 + "guardalo para después"'],
        sticker: 'Slider: "¿Te sirvió?"', cta: 'Compartilo con quien lo necesita', por_que: 'El contenido útil se guarda y se comparte.' },
      { id: 'tip2', titulo: 'El error más común', formato: 'quiz', gancho: 'El error que todos cometen con {tema|rubro|esto} ❌',
        historias: ['Quiz: "¿Cuál es el error?" con 3 opciones', 'Respuesta + cómo hacerlo bien', 'CTA a consultar por DM'],
        sticker: 'Quiz con 3 opciones', cta: 'Consultanos por DM', por_que: 'Corregir un error genera autoridad y respuestas.' },
    ],
    antesdespues: [
      { id: 'ad1', titulo: 'Antes y después', formato: 'slider', gancho: 'No vas a creer el cambio 😮',
        historias: ['Foto/video del antes', 'Transición con un audio en tendencia al después', 'Slider: "¿Qué tan bueno quedó?"'],
        sticker: 'Slider 😍', cta: '¿Querés el tuyo? Escribinos', por_que: 'Las transformaciones tienen la retención más alta en formato vertical.' },
      { id: 'ad2', titulo: 'Transformación de la comunidad', formato: 'secuencia de historias', gancho: 'Esto es constancia 🔥',
        historias: ['Antes de un cliente (con permiso)', 'Después + cuánto tiempo pasó', 'Testimonio corto + link o DM'],
        sticker: 'Preguntas: "¿Cuál es tu meta?"', cta: 'Empezá hoy: escribinos', por_que: 'Prueba social visual: convence más que cualquier texto.' },
    ],
    lanzamiento: [
      { id: 'lan1', titulo: 'Teaser: adiviná qué llega', formato: 'quiz', gancho: 'Se viene algo nuevo… 👀',
        historias: ['Imagen borrosa o detalle de lo nuevo', 'Quiz: "¿Qué creés que es?"', 'Cuenta regresiva al lanzamiento'],
        sticker: 'Cuenta regresiva: "Lanzamiento"', cta: 'Activá el recordatorio', por_que: 'La intriga hace que vuelvan a ver las historias siguientes.' },
      { id: 'lan2', titulo: 'Lanzamiento oficial', formato: 'link', gancho: 'Ya llegó {tema|[lo nuevo]} 🎉',
        historias: ['Video revelando lo nuevo con audio en tendencia', 'Detalles: precio, disponibilidad', 'Link o DM para comprar'],
        sticker: 'Link: "Lo quiero"', cta: 'Sé de los primeros', por_que: 'Aprovecha la expectativa generada en los teasers.' },
    ],
  };

  const GOAL_KEYS = {
    'Sorteo': 'sorteo', 'Venta / promo': 'venta', 'Interactiva (encuesta/quiz)': 'interactiva', 'Polémica': 'polemica',
    'Humor / meme': 'humor', 'Motivación': 'motivacion', 'Detrás de escena': 'detras', 'Tip / tutorial': 'tip',
    'Antes y después': 'antesdespues', 'Lanzamiento': 'lanzamiento',
  };
  const DETECT = [
    ['sorteo', /sorteo|giveaway|regalamos|premio/i],
    ['polemica', /pol[eé]mic|opini[oó]n|debate|impopular/i],
    ['venta', /venta|vender|promo|descuento|oferta|precio|comprar/i],
    ['interactiva', /encuesta|quiz|interactiv|preguntas/i],
    ['humor', /meme|humor|grac|divertid|chiste|pov/i],
    ['motivacion', /motiva|frase|energ|desaf/i],
    ['detras', /detr[aá]s|backstage|un d[ií]a en|proceso/i],
    ['tip', /\btips?\b|tutorial|consejo|c[oó]mo hacer/i],
    ['antesdespues', /antes y despu|transforma/i],
    ['lanzamiento', /lanza|lleg[aó]|nuevo|nueva colecci/i],
  ];

  const STOP = new Set(('para como esta este esto estos estas pero porque cuando donde desde hasta entre sobre todo todos todas tiene tienen hacer hace solo sola mejor mejores nuevo nueva video videos short shorts viral virales tiktok reels reel youtube with your that this from what when have just like more most best part parte love vida dias hoy aqui alli shortsvideo shortsfeed fyp foryou parati trending trend tendencia ' +
    'quiero historia historias una unos unas el la los las del que con por sin muy mas más ese esa eso eres soy son fue era').split(' '));
  const TAG_STOP = new Set(['shorts', 'short', 'viral', 'fyp', 'foryou', 'parati', 'tiktok', 'reels', 'reel', 'youtube', 'trending', 'shortsvideo', 'shortsfeed', 'ytshorts', 'explore', 'foryoupage', 'xyzbca']);

  function cleanTema(q) {
    let t = String(q || '')
      .replace(/quiero\s+(hacer|subir|armar)?\s*(una?|unas?|unos?)?\s*(historias?|publicaci[oó]n|post|reel)?\s*/i, '')
      .replace(/^(para|de|sobre|con)\s+/i, '')
      .replace(/^(\S+)\s+(sobre|de|para|con)\s+/i, (m, w) => (DETECT.some(([, re]) => re.test(w)) ? '' : m))
      .replace(/^(una?|el|la|los|las)\s+/i, '').trim();
    if (DETECT.some(([, re]) => re.test(t)) && t.split(/\s+/).length <= 2) t = ''; // solo nombra el objetivo
    return t.replace(/[.!?]+$/, '');
  }

  const detectGoals = (q) => DETECT.filter(([, re]) => re.test(q || '')).map(([k]) => k);

  function analyzeVideos(videos) {
    const kw = new Map(); const tags = new Map();
    const add = (m, k, v, w) => {
      const e = m.get(k) || { name: k, score: 0, count: 0, maxPerDay: 0 };
      e.score += w; e.count++; e.maxPerDay = Math.max(e.maxPerDay, v.perDay || 0); m.set(k, e);
    };
    (videos || []).forEach((v) => {
      const w = Math.log10((v.perDay || v.views || 0) + 10);
      const title = String(v.title || '');
      new Set((title.match(/#[\p{L}\p{N}_]+/gu) || []).map((h) => h.slice(1).toLowerCase()))
        .forEach((k) => { if (k.length >= 3 && !TAG_STOP.has(k)) add(tags, k, v, w); });
      new Set(title.replace(/#[\p{L}\p{N}_]+/gu, ' ').toLowerCase().split(/[^\p{L}\p{N}]+/u))
        .forEach((word) => { if (word.length >= 4 && !STOP.has(word) && !/^\d+$/.test(word)) add(kw, word, v, w); });
    });
    const sort = (m) => [...m.values()].filter((e) => e.count > 1 || m.size < 15).sort((a, b) => b.score - a.score);
    return { keywords: sort(kw).slice(0, 8), hashtags: sort(tags).slice(0, 10), top: [...(videos || [])].sort((a, b) => (b.perDay || 0) - (a.perDay || 0)).slice(0, 3) };
  }

  const fmt = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });

  // {a|b|texto}: usa la primera variable con valor; si ninguna tiene, el texto literal
  const VAR_NAMES = new Set(['tema', 'cuenta', 'producto', 'rubro']);
  function fill(str, vars) {
    return String(str).replace(/\{([^{}]*(?:\{\w+\}[^{}]*)*)\}/g, (_, body) => {
      for (const part of body.split('|')) {
        const name = part.trim().replace(/^\{(\w+)\}$/, '$1');
        if (VAR_NAMES.has(name)) { if (vars[name]) return vars[name]; continue; }
        return fill(part, vars);
      }
      return '';
    });
  }

  // Saca rubro, producto y palabras clave del contexto que se carga en ⚙️
  const CTX_STOP = new Set(('cuenta instagram publico público objetivo objetivos tono generar mostrar historias historia suben sube dias días por para como cómo con sin una unos unas los las del que muy mas más todo toda todos todas este esta esto entre sobre hasta desde cada gente zona quiere quieren empezar actuales nuevos nuevas ' +
    'cercano cercana seguro divertido divertida motivador humor argentino argentina interaccion interacción comunidad vender venta ventas marca completá rubro exacto mujeres hombres jóvenes jovenes clientes socios edad años tendencia estética estetica').split(' '));

  function parseContext(context, name) {
    const c = String(context || '');
    const clean = (x) => (x || '').replace(/\s+/g, ' ').trim().replace(/^(un|una|el|la|los|las)\s+/i, '');
    const rubro = clean((/(?:cuenta de instagram de|marca de|tienda de|negocio de|local de|emprendimiento de|somos)\s+(?:un|una|el|la)?\s*([^.,;:()"]{3,40}?)(?=\s+(?:en|para|con|que|de\s+\p{Lu})\b|[.,;:()"]|$)/iu.exec(c) || [])[1]);
    // Toma la lista hasta el punto y corta en el primer verbo en infinitivo ("generar comunidad") o en "con/para"
    const rawProd = (/(?:vender|vendemos|vende|venta de|productos?|servicios?|ofrecemos)\s*:?\s+([^.;()"]{3,80})/i.exec(c) || [])[1] || '';
    const segs = [];
    for (const seg of rawProd.split(',')) {
      const t = seg.trim();
      if (!t || /^\p{L}+(ar|er|ir)\b/iu.test(t)) break;
      segs.push(t.split(/\s+(?:con|para|a todo|en todo)\s+/i)[0]);
      if (segs.length >= 4) break;
    }
    const producto = clean(segs.join(', ')).replace(/^(de|las|los)\s+/i, '');
    const counts = new Map();
    c.toLowerCase().split(/[^\p{L}]+/u).forEach((w) => {
      if (w.length >= 5 && !CTX_STOP.has(w) && w !== String(name || '').toLowerCase()) counts.set(w, (counts.get(w) || 0) + 1);
    });
    const keywords = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 6);
    return { rubro: rubro.toLowerCase(), producto: producto.toLowerCase(), keywords };
  }

  // Búsquedas para YouTube basadas en el contexto (no solo el nombre de la cuenta)
  function contextQueries(context, name) {
    const ctx = parseContext(context, name);
    const main = ctx.rubro || ctx.keywords[0] || name;
    const qs = [main, ctx.producto && ctx.producto !== main ? ctx.producto : ctx.keywords.slice(0, 2).join(' ')].filter(Boolean);
    return [...new Set(qs)].slice(0, 2);
  }

  function pick(list, used, n) {
    const shuffled = [...list].sort(() => Math.random() - 0.5);
    return [...shuffled.filter((t) => !used.has(t.id)), ...shuffled.filter((t) => used.has(t.id))].slice(0, n);
  }

  /**
   * @param {object} o { q, goal (etiqueta del chip), accountName, context, videos, used:Set<id>, plan:boolean }
   */
  function generate(o) {
    const used = o.used || new Set();
    const a = analyzeVideos(o.videos);
    const topKw = a.keywords[0]?.name;
    const topTag = a.hashtags[0]?.name;
    const ctx = parseContext(o.context, o.accountName);
    const vars = { tema: o.plan ? '' : cleanTema(o.q), cuenta: o.accountName || 'la cuenta', rubro: ctx.rubro, producto: ctx.producto };

    let cats;
    if (o.plan) {
      const extra = ['humor', 'polemica', 'motivacion', 'detras', 'tip', 'antesdespues'];
      cats = ['interactiva', 'venta', extra[Math.floor(Math.random() * extra.length)]];
    } else {
      const g = GOAL_KEYS[o.goal] || detectGoals(o.q)[0];
      cats = g ? [g, g, g] : ['interactiva', 'venta', 'humor'];
    }

    const count = {};
    cats.forEach((c) => { count[c] = (count[c] || 0) + 1; });
    const chosen = [];
    Object.entries(count).forEach(([c, n]) => {
      let got = pick(T[c] || [], used, n);
      if (got.length < n) got = got.concat(pick(T.interactiva.filter((t) => !got.includes(t)), used, n - got.length));
      chosen.push(...got);
    });
    if (o.plan) chosen.sort((x, y) => cats.indexOf(Object.keys(T).find((k) => T[k].includes(x))) - cats.indexOf(Object.keys(T).find((k) => T[k].includes(y))));

    const momentos = ['mañana', 'tarde', 'noche'];
    const audio = a.top[0]
      ? `El audio de alguno de los Shorts virales de referencia (ej: "${a.top[0].title.slice(0, 50)}") o uno con flechita ↗ en la música de Instagram`
      : 'Un audio en tendencia (los que tienen la flechita ↗ en la música de Instagram)';

    const ideas = chosen.slice(0, 3).map((t, i) => ({
      titulo: fill(t.titulo, vars),
      momento: o.plan ? momentos[i] : '',
      formato: t.formato,
      gancho: fill(t.gancho, vars),
      historias: t.historias.map((h, j) => `Historia ${j + 1}: ${fill(h, vars)}`),
      sticker: fill(t.sticker, vars),
      cta: fill(t.cta, vars),
      audio,
      por_que: t.por_que + (i === 0 && (topTag || topKw) ? ` Sumá ${topTag ? '#' + topTag : `"${topKw}"`}, que hoy se repite en los videos virales.` : ''),
    }));

    const tendencias = [
      ...a.hashtags.slice(0, 3).map((h) => ({ nombre: '#' + h.name, descripcion: `Aparece en ${h.count} Shorts virales · hasta ${fmt.format(h.maxPerDay)} vistas/día` })),
      ...a.keywords.slice(0, 3).map((k) => ({ nombre: k.name, descripcion: `Se repite en ${k.count} títulos virales · hasta ${fmt.format(k.maxPerDay)} vistas/día` })),
    ].slice(0, 5);

    return { tendencias, ideas, hashtags: a.hashtags.map((h) => h.name).slice(0, 8), usedIds: chosen.slice(0, 3).map((t) => t.id) };
  }

  window.TemplateEngine = { generate, analyzeVideos, cleanTema, parseContext, contextQueries };
})();
