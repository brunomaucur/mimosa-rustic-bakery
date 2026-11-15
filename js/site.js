/* MIMOSA · Rustic Bakery — comportamiento común a todas las páginas */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cabecera: fondo al hacer scroll, se esconde al bajar ---------- */
  const header = $('.header');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 40);
    header.classList.remove('is-hidden'); // la cabecera flotante se queda siempre visible al bajar
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  const menuBtn = $('.menu-btn'), menu = $('.mobile-menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.querySelector('span').textContent = open ? 'Cerrar' : 'Menú';
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  menuBtn?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.classList.contains('is-open')) setMenu(false); });

  /* ---------- ¿Abierto ahora? (hora de Canarias) ---------- */
  const OPEN_DAYS = [0, 3, 4, 5, 6], OPEN_H = 9, CLOSE_H = 17;
  const DAY = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Atlantic/Canary', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  const hour = +get('hour') + +get('minute') / 60;
  const isOpen = OPEN_DAYS.includes(today) && hour >= OPEN_H && hour < CLOSE_H;
  let statusText = 'Abierto ahora · hasta las 17:00';
  if (!isOpen) {
    if (OPEN_DAYS.includes(today) && hour < OPEN_H) statusText = 'Abrimos hoy a las 9:00';
    else {
      let d = 1; while (!OPEN_DAYS.includes((today + d) % 7)) d++;
      statusText = `Abrimos ${d === 1 ? 'mañana' : 'el ' + DAY[(today + d) % 7]} a las 9:00`;
    }
  }
  $$('[data-status]').forEach(el => {
    el.classList.toggle('is-open', isOpen);
    const t = el.querySelector('[data-status-text]'); if (t) t.textContent = statusText;
  });
  $$('.hours').forEach(list => {
    const rows = $$('li', list); // lunes → domingo
    if (rows.length === 7) rows[(today + 6) % 7].classList.add('is-today');
  });

  /* ---------- Revelados al entrar en pantalla ---------- */
  // Se muestra al entrar en pantalla o si ya se ha pasado de largo (scroll rápido / enlaces con #)
  // (sin IntersectionObserver: las fotos empiezan recortadas con clip-path y el
  //  observador las ve como "tamaño cero"; esta comprobación por posición es fiable)
  let pending = $$('[data-reveal]');
  let ticking = false;
  const revealCheck = () => {
    ticking = false;
    const limit = innerHeight * 0.94;
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!pending.length) { removeEventListener('scroll', onRevealScroll); removeEventListener('resize', onRevealScroll); }
  };
  const onRevealScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(revealCheck); } };
  addEventListener('scroll', onRevealScroll, { passive: true });
  addEventListener('resize', onRevealScroll);
  revealCheck();
  addEventListener('load', revealCheck);
  setTimeout(revealCheck, 400);

  /* ---------- Cintas de fotos en bucle (inicio, carta, eventos…) ---------- */
  // Las tiras .strip se convierten en cinta automática igual que "Lo que sale del horno"
  // (las tiras .strip se mueven con el deslizador, al final del archivo)
  $$('[data-loop]').forEach(loop => {
    const track = loop.querySelector('.loop__track');
    const originals = [...track.children];
    // duplicamos hasta llenar al menos dos anchos de pantalla para que no queden huecos
    let copies = 1;
    while (track.scrollWidth < innerWidth * 2 && copies < 6) {
      originals.forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; k.classList.add('is-clone'); track.appendChild(k); });
      copies++;
    }
    if (copies % 2) originals.forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1; k.classList.add('is-clone'); track.appendChild(k); });
    const speed = +loop.dataset.speed || 45; // píxeles por segundo
    const setSpeed = () => track.style.setProperty('--loop-dur', `${(track.scrollWidth / 2) / speed}s`);
    setSpeed(); addEventListener('resize', setSpeed);
  });

  /* ---------- Parallax suave en bandas de imagen ---------- */
  const bands = $$('.band__img');
  if (bands.length && !reduce) {
    const tick = () => {
      bands.forEach(b => {
        const r = b.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        b.style.transform = `translate3d(0, ${(-p * 8).toFixed(2)}%, 0)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Carrusel de productos ---------- */
  $$('[data-rail]').forEach(rail => {
    const ctrl = $(`[data-rail-ctrl="${rail.dataset.rail}"]`);
    if (!ctrl) return;
    const step = () => rail.firstElementChild.getBoundingClientRect().width + 24;
    ctrl.querySelector('[data-dir="-1"]').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    ctrl.querySelector('[data-dir="1"]').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  });

  /* ---------- Carta: resalta la categoría visible ---------- */
  const catLinks = $$('.menu-nav a, .cat-dock__list a');
  const dock = $('.cat-dock'), dockLabel = $('[data-dock-label]');
  if (catLinks.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        catLinks.forEach(a => {
          const on = a.getAttribute('href') === '#' + e.target.id;
          a.classList.toggle('is-active', on);
          if (on && dockLabel && a.closest('.cat-dock')) dockLabel.textContent = a.textContent;
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.menu-cat, #encargos').forEach(s => spy.observe(s));
  }
  // Desplegable lateral: aparece cuando la barra de categorías sale de pantalla
  if (dock) {
    const bar = $('.menu-nav') || $('.page-intro') || $('.chapter'), btn = $('.cat-dock__btn', dock);
    new IntersectionObserver(([e]) => {
      dock.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
      if (e.isIntersecting) { dock.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    }).observe(bar);
    // en el bloque de encargos (formulario) el desplegable se aparta para no tapar nada
    const enc = $('#encargos');
    if (enc) new IntersectionObserver(([e]) => dock.classList.toggle('is-away', e.isIntersecting), { rootMargin: '-25% 0px -25% 0px' }).observe(enc);
    btn.addEventListener('click', e => { if (e.pointerType === 'mouse' && dock.classList.contains('is-open')) return; btn.setAttribute('aria-expanded', dock.classList.toggle('is-open')); });
    // con ratón: se abre solo al poner el cursor sobre el botón y se cierra al salir del desplegable
    btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { dock.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); } });
    dock.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { dock.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
    $$('a', dock).forEach(a => a.addEventListener('click', () => { dock.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }));
    document.addEventListener('click', e => { if (!dock.contains(e.target)) { dock.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------- HERO: el café se derrama y aparece el texto ---------- */
  const hero = $('.hero');
  if (hero) {
    const video = $('.hero__media', hero);
    const ready = () => hero.classList.add('is-ready');
    const REVEAL_AT = 1.3; // segundos: cuando la mancha ya cubre el centro
    if (reduce || !video) {
      if (video) { video.removeAttribute('autoplay'); video.pause(); video.poster = 'media/cafe-final.jpg'; }
      ready();
    } else {
      video.addEventListener('timeupdate', () => { if (video.currentTime >= REVEAL_AT) ready(); });
      video.addEventListener('ended', ready);
      video.addEventListener('error', ready);
      const p = video.play();
      if (p && p.catch) p.catch(() => { video.poster = 'media/cafe-final.jpg'; ready(); });
      setTimeout(ready, 4000); // por si el vídeo tarda en cargar
      $('.skip-video', hero)?.addEventListener('click', () => {
        if (video.duration) video.currentTime = video.duration - .05;
        ready();
      });
    }
  }

  const y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Botón volver al inicio ---------- */
  const toTop = $('.to-top');
  if (toTop) {
    const showTop = () => toTop.classList.toggle('is-visible', scrollY > innerHeight * .8);
    addEventListener('scroll', showTop, { passive: true }); showTop();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  }

  /* ---------- Vídeo de la obra: se reproduce solo cuando se ve ---------- */
  $$('.obra__video video').forEach(v => {
    if (reduce) return;
    new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: .3 }).observe(v);
  });
})();

/* ==========================================================
   ENCARGOS POR WHATSAPP
   Cuando tengas el número, ponlo aquí con el prefijo del país,
   sin "+", espacios ni guiones. Ejemplo: '34600123456'
   Mientras esté vacío, los botones abren el chat de Instagram.
   ========================================================== */
const MIMOSA_WHATSAPP = '';
const MIMOSA_TELEFONO = ''; // p. ej. '+34 600 000 000'; mientras esté vacío no se muestra «Llamar»

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const IG_DM = 'https://ig.me/m/mimosarusticbakery';
  const waLink = msg => MIMOSA_WHATSAPP
    ? `https://wa.me/${MIMOSA_WHATSAPP}?text=${encodeURIComponent(msg)}`
    : IG_DM;

  // Todos los enlaces con data-wa abren WhatsApp con un mensaje ya escrito
  $$('[data-wa]').forEach(a => {
    a.href = waLink(a.dataset.wa || 'Hola Mimosa, me gustaría encargar una tarta.');
    a.target = '_blank'; a.rel = 'noopener';
  });

  // Botón flotante: aparece al bajar un poco
  const fl = $('.wa-float');
  if (fl) {
    const hasHero = !!$('.hero');
    const show = () => fl.classList.toggle('is-visible', !hasHero || scrollY > innerHeight * .5);
    addEventListener('scroll', show, { passive: true }); show();
  }

  // Formulario de encargo -> mensaje de WhatsApp
  const form = $('#orderForm');
  if (form) {
    const date = form.querySelector('[name=fecha]');
    date.min = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const fecha = f.fecha
        ? new Date(f.fecha + 'T12:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        : 'por concretar';
      const msg = [
        'Hola Mimosa, me gustaría hacer un encargo:',
        `- Encargo: ${f.tarta}`,
        `- Tamaño: ${f.tamano}`,
        `- Fecha: ${fecha}`,
        f.ocasion ? `- Ocasión: ${f.ocasion}` : '',
        f.notas ? `- Detalles: ${f.notas}` : '',
        f.nombre ? `Soy ${f.nombre}.` : ''
      ].filter(Boolean).join('\n');
      window.open(waLink(msg), '_blank', 'noopener');
    });
  }

  // Lightbox para las galerías
  const items = $$('[data-zoom]:not(.is-clone)');
  if (items.length) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<img alt=""><p></p>'
      + '<button class="lb-btn lb-close" aria-label="Cerrar">✕</button>'
      + '<button class="lb-btn lb-prev" aria-label="Anterior">←</button>'
      + '<button class="lb-btn lb-next" aria-label="Siguiente">→</button>';
    document.body.appendChild(lb);
    const img = $('img', lb), cap = $('p', lb);
    let group = [], i = 0;
    const show = () => { const im = group[i].querySelector('img'); img.src = im.currentSrc || im.src; img.alt = im.alt; cap.textContent = group.length > 1 ? `${im.alt} · ${i + 1} / ${group.length}` : im.alt; };
    const open = el => {
      group = items.filter(x => x.dataset.zoom === el.dataset.zoom);
      i = group.indexOf(el); show();
      lb.classList.add('is-open'); document.documentElement.style.overflow = 'hidden';
    };
    const close = () => { lb.classList.remove('is-open'); document.documentElement.style.overflow = ''; };
    const step = d => { i = (i + d + group.length) % group.length; show(); };
    items.forEach(el => {
      el.tabIndex = 0;
      el.addEventListener('click', () => open(el));
      el.addEventListener('keydown', e => { if (e.key === 'Enter') open(el); });
    });
    // las copias de las cintas abren la foto original equivalente
    $$('[data-zoom].is-clone').forEach(cl => cl.addEventListener('click', () => {
      const src = cl.querySelector('img').getAttribute('src');
      const o = items.find(x => x.dataset.zoom === cl.dataset.zoom && x.querySelector('img').getAttribute('src') === src);
      if (o) open(o);
    }));
    $('.lb-close', lb).onclick = close;
    $('.lb-prev', lb).onclick = () => step(-1);
    $('.lb-next', lb).onclick = () => step(1);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    // Móvil: deslizar con el dedo para pasar de foto (izquierda/derecha) o para cerrar (hacia abajo)
    let tx = 0, ty = 0, moviendo = false;
    lb.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      tx = e.touches[0].clientX; ty = e.touches[0].clientY; moviendo = true;
      img.style.transition = 'none';
    }, { passive: true });
    lb.addEventListener('touchmove', e => {
      if (!moviendo || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - tx, dy = e.touches[0].clientY - ty;
      if (Math.abs(dx) > Math.abs(dy)) { img.style.transform = `translateX(${dx}px) rotate(${dx / 40}deg)`; e.preventDefault(); }
      else if (dy > 0) { img.style.transform = `translateY(${dy}px) scale(${1 - Math.min(dy, 300) / 1500})`; e.preventDefault(); }
    }, { passive: false });
    lb.addEventListener('touchend', e => {
      if (!moviendo) return; moviendo = false;
      const t = e.changedTouches[0], dx = t.clientX - tx, dy = t.clientY - ty;
      img.style.transition = 'transform .3s ease'; img.style.transform = '';
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && dy > Math.abs(dx)) close();
    });
    addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }
})();

/* Portada: la taza cae en la esquina y el café escribe «mimosa» de un solo trazo */
(function () {
  const hero = document.querySelector('.portada-cafe');
  if (!hero) return;
  const taza = hero.querySelector('.cafe-taza');
  const boca = hero.querySelector('.cafe-boca');
  const logo = hero.querySelector('.vierte');
  const svg = hero.querySelector('.cafe-rastro');
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VEL = 520; // px por segundo: misma velocidad en el hilo y en las letras
  let dibujado = false;

  function construir() {
    const h = hero.getBoundingClientRect();
    const b = boca.getBoundingClientRect();
    const l = logo.getBoundingClientRect();
    const m = { x: b.left + b.width / 2 - h.left, y: b.top + b.height / 2 - h.top };
    const e = { x: l.left - h.left + l.width * 0.03, y: l.top - h.top + l.height * 0.62 };
    svg.setAttribute('viewBox', `0 0 ${h.width} ${h.height}`);
    svg.textContent = '';
    const dx = e.x - m.x, dy = e.y - m.y;
    const sw = Math.max(Math.abs(dx) * 0.5, h.width * 0.2);
    // En pantallas anchas (logo a la derecha de la taza) el café cae primero por su peso y luego corre hacia la «m»;
    // en el móvil (logo debajo de la taza) se mantiene la curva en S que ya funcionaba.
    // Ordenador: el café cae por su peso, hace una curva más sobre la mesa y entra en la «m».
    // Móvil (hasta 760 px): la curva en S de siempre, sin cambios.
    const ancho = matchMedia('(min-width: 761px)').matches && dx > Math.abs(dy) * 1.2;
    let segs;
    if (ancho) {
      const mid = { x: m.x + dx * 0.42, y: e.y + l.height * 0.95 };
      segs = [
        [m, { x: m.x + dx * 0.04, y: m.y + Math.max(dy, 0) * 0.6 + l.height * 1.25 }, { x: mid.x - dx * 0.24, y: mid.y + l.height * 0.55 }, mid],
        [mid, { x: mid.x + dx * 0.22, y: mid.y - l.height * 0.7 }, { x: e.x - dx * 0.22, y: e.y + l.height * 0.75 }, e]
      ];
    } else {
      segs = [[m, { x: m.x + Math.max(dx * 0.55, sw), y: m.y + dy * 0.22 }, { x: e.x - Math.max(dx * 0.4, sw * 0.9), y: e.y + dy * 0.04 }, e]];
    }
    const S = segs.length;
    const trozo = t => { const i = Math.min(S - 1, Math.floor(t * S)); return [segs[i], Math.min(1, t * S - i)]; };
    const bez = (t, k) => { const [[a0, a1, a2, a3], u] = trozo(t); return (1 - u) ** 3 * a0[k] + 3 * (1 - u) ** 2 * u * a1[k] + 3 * (1 - u) * u * u * a2[k] + u ** 3 * a3[k]; };
    const der = (t, k) => { const [[a0, a1, a2, a3], u] = trozo(t); return 3 * (1 - u) ** 2 * (a1[k] - a0[k]) + 6 * (1 - u) * u * (a2[k] - a1[k]) + 3 * u * u * (a3[k] - a2[k]); };
    const centro = `M ${m.x} ${m.y} ` + segs.map(([, a1, a2, a3]) => `C ${a1.x} ${a1.y}, ${a2.x} ${a2.y}, ${a3.x} ${a3.y}`).join(' ');

    // Grosor: ancho al salir de la taza, se estrecha hasta el trazo de la letra, con pequeñas ondas de líquido
    const wIni = Math.max(10, l.height * 0.34), wFin = Math.max(4, l.height * 0.1);
    const N = 90, izq = [], der2 = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = bez(t, 'x'), y = bez(t, 'y');
      let tx = der(t, 'x'), ty = der(t, 'y');
      const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
      const base = wFin + (wIni - wFin) * Math.pow(1 - t, 2.2);
      const onda = 1 + 0.13 * Math.sin(t * 23 + 1.3) * Math.sin(t * 7.1) * (1 - t * 0.6);
      const w = base * onda / 2;
      izq.push([x - ty * w, y + tx * w]);
      der2.push([x + ty * w * (0.92 + 0.08 * Math.sin(t * 17)), y - tx * w * (0.92 + 0.08 * Math.sin(t * 17))]);
    }
    const pts = izq.concat(der2.reverse()).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);
    const id = 'cafe-m' + Math.round(Math.random() * 1e6);
    svg.innerHTML = `
      <defs>
        <mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${h.width}" height="${h.height}">
          <path class="cafe-revela" d="${centro}" fill="none" stroke="#fff" stroke-width="${wIni * 2.2}" stroke-linecap="round"/>
        </mask>
      </defs>
      <g mask="url(#${id})">
        <g>
          <polygon points="${pts.join(' ')}" fill="var(--bordeaux)"/>
          <circle cx="${e.x}" cy="${e.y}" r="${wFin / 2}" fill="var(--bordeaux)"/>
        </g>
        <path d="${centro}" fill="none" stroke="#E9E2D4" stroke-opacity=".22" stroke-width="${Math.max(1.5, wFin * 0.28)}" stroke-linecap="round" transform="translate(${-wFin * 0.25} ${-wFin * 0.3})"/>
      </g>`;
    // Gotitas que salpican junto al chorro
    const gotas = [];
    [[.18, 1.6, .05], [.33, -1.9, .035], [.52, 1.7, .04], [.68, -1.5, .03], [.84, 1.8, .035]].forEach(([t, lado, r]) => {
      let tx = der(t, 'x'), ty = der(t, 'y'); const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
      const w = (wFin + (wIni - wFin) * Math.pow(1 - t, 2.2)) / 2;
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', bez(t, 'x') - ty * w * lado);
      c.setAttribute('cy', bez(t, 'y') + tx * w * lado);
      c.setAttribute('r', Math.max(2, l.height * r));
      c.setAttribute('fill', 'var(--bordeaux)');
      c.dataset.t = t;
      svg.appendChild(c);
      gotas.push(c);
    });
    return { p: svg.querySelector('.cafe-revela'), gotas, ancho: l.width };
  }

  function finalEstatico() {
    construir();
    logo.classList.add('is-writing');
    logo.getAnimations().forEach(a => a.finish());
    dibujado = true;
    hero.classList.add('is-escrito');
  }

  let empezado = false;
  function animar() {
    if (empezado) return;
    empezado = true;
    const { p, gotas, ancho } = construir();
    const len = p.getTotalLength();
    const t1 = Math.max(650, len / VEL * 1000);
    const t2 = Math.max(1400, ancho * 1.08 / VEL * 1000);
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: t1, delay: 120, easing: 'cubic-bezier(.35,0,.9,1)', fill: 'forwards' });
    gotas.forEach(g => g.animate([{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.3)', offset: .5 }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 380, delay: 120 + t1 * (+g.dataset.t) + 60, easing: 'ease-out', fill: 'backwards' }));
    gotas.forEach(g => { g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center'; });
    logo.style.animationDuration = t2 + 'ms';
    logo.style.animationTimingFunction = 'cubic-bezier(.15,.3,.45,1)';
    logo.querySelectorAll('.deco').forEach(d => d.style.setProperty('--t', Math.round((+d.dataset.at || 0) * t2) + 'ms'));
    setTimeout(() => logo.classList.add('is-writing'), 120 + t1 - 40);
    setTimeout(() => { dibujado = true; hero.classList.add('is-escrito'); }, 120 + t1 + t2 - 150);
  }

  if (reduce || !taza.getAnimations().length) {
    requestAnimationFrame(finalEstatico);
  } else {
    taza.addEventListener('animationend', animar, { once: true });
    // Si el navegador pausa la animación de la taza (pestaña en segundo plano, ahorro de batería…), arrancamos igual
    setTimeout(animar, 1700);
    // y, pase lo que pase, los botones y el eslogan quedan visibles y se pueden tocar
    setTimeout(() => { hero.classList.add('is-escrito'); logo.classList.add('is-writing'); }, 6500);
  }
  let t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { if (dibujado) construir(); }, 150);
  });
})();


;
/* MIMOSA: boton envoltorio aprobado */
(() => {
  'use strict';
  if (window.MimosaParcel) { window.MimosaParcel.mount(); return; }
  const style = document.createElement('style');
  style.id = 'mimosa-parcel-styles';
  style.textContent = ".mimosa-parcel {\n  --mp-ink: #572326; --mp-paper: #e9e2d4; --mp-gold: #ddc47c;\n  --mp-ease: cubic-bezier(.2,.75,.25,1.15);\n  position: relative !important; display: inline-flex !important;\n  align-items: center; justify-content: center; isolation: isolate;\n  width: 218px; min-height: 64px; padding: 0 24px !important;\n  border: 0 !important; border-radius: 0 !important;\n  background: transparent !important; color: var(--mp-paper) !important;\n  text-decoration: none !important; box-shadow: none !important;\n  overflow: visible !important; transform: none !important;\n  font: italic 17px/1.2 var(--mp-font, 'LTC Remington Typewriter Pro', 'Courier New', monospace);\n  -webkit-tap-highlight-color: transparent;\n}\n.mimosa-parcel *, .mimosa-parcel *::before, .mimosa-parcel *::after {box-sizing:border-box}\n.mimosa-parcel::before, .mimosa-parcel::after {display:none !important}\n.mimosa-parcel > .mp-label { position: relative; z-index: 4; display:flex; align-items:center; gap:17px; transition:color 250ms; white-space:nowrap; pointer-events:none; }\n.mimosa-parcel .mp-arrow { display:inline-block; font-style:normal; transition:transform 550ms var(--mp-ease); }\n.mimosa-parcel .mp-paper { position:absolute; inset:0; pointer-events:none; }\n.mimosa-parcel .mp-filling {position:absolute; inset:3px 6px; background:var(--mp-gold); border-radius:46% 48% 42% 45% / 14% 13% 16% 15%; transform:scale(.92,.84); transition:transform 650ms var(--mp-ease);}\n.mimosa-parcel .mp-fold { position:absolute; left:0; width:100%; height:52%; background:var(--mp-ink); z-index:2; transition:transform 650ms var(--mp-ease), background 300ms; }\n.mimosa-parcel .mp-fold::after {content:''; position:absolute; left:13px; right:13px; height:1px; background:var(--mp-paper); opacity:.2; }\n.mimosa-parcel .mp-fold--top {top:0; transform-origin:50% 100%; clip-path:polygon(0 11%,2% 0,4% 10%,6% 0,8% 10%,10% 0,12% 10%,14% 0,16% 10%,18% 0,20% 10%,22% 0,24% 10%,26% 0,28% 10%,30% 0,32% 10%,34% 0,36% 10%,38% 0,40% 10%,42% 0,44% 10%,46% 0,48% 10%,50% 0,52% 10%,54% 0,56% 10%,58% 0,60% 10%,62% 0,64% 10%,66% 0,68% 10%,70% 0,72% 10%,74% 0,76% 10%,78% 0,80% 10%,82% 0,84% 10%,86% 0,88% 10%,90% 0,92% 10%,94% 0,96% 10%,98% 0,100% 11%,99% 100%,1% 100%);}\n.mimosa-parcel .mp-fold--top::after {top:8px}\n.mimosa-parcel .mp-fold--bottom {bottom:0; clip-path:polygon(1% 0,99% 0,100% 89%,98% 100%,96% 90%,94% 100%,92% 90%,90% 100%,88% 90%,86% 100%,84% 90%,82% 100%,80% 90%,78% 100%,76% 90%,74% 100%,72% 90%,70% 100%,68% 90%,66% 100%,64% 90%,62% 100%,60% 90%,58% 100%,56% 90%,54% 100%,52% 90%,50% 100%,48% 90%,46% 100%,44% 90%,42% 100%,40% 90%,38% 100%,36% 90%,34% 100%,32% 90%,30% 100%,28% 90%,26% 100%,24% 90%,22% 100%,20% 90%,18% 100%,16% 90%,14% 100%,12% 90%,10% 100%,8% 90%,6% 100%,4% 90%,2% 100%,0 89%); transform-origin:50% 0;}\n.mimosa-parcel .mp-fold--bottom::after {bottom:8px}\n.mimosa-parcel .mp-note {position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font:italic 10px/1 'Courier New',monospace; letter-spacing:.07em; opacity:0; transition:opacity 200ms; color:var(--mp-paper);}\n.mimosa-parcel .mp-flower {position:absolute; display:block; width:48px; height:48px; background:var(--mp-gold); mask:var(--mp-flower) center/contain no-repeat; -webkit-mask:var(--mp-flower) center/contain no-repeat; transform:translate(0,0) rotate(0) scale(.12); opacity:0; transition:transform 750ms var(--mp-ease),opacity 250ms; z-index:1;}\n.mimosa-parcel .mp-flower--a {left:1px; top:-9px; --mp-x:-27px; --mp-y:-27px; --mp-r:-29deg; background:#be7b65;}\n.mimosa-parcel .mp-flower--b {right:0; top:-6px; width:34px; height:38px; --mp-x:15px; --mp-y:-26px; --mp-r:32deg; background:#8fabba; transition-delay:50ms;}\n.mimosa-parcel .mp-flower--c {left:19px; bottom:-7px; width:27px; height:30px; --mp-x:-22px; --mp-y:21px; --mp-r:-57deg; background:#8fabba; transition-delay:90ms;}\n.mimosa-parcel .mp-flower--d {right:13px; bottom:-7px; width:37px; height:40px; --mp-x:20px; --mp-y:23px; --mp-r:48deg; background:#be7b65; transition-delay:130ms;}\n.mimosa-parcel .mp-seal {position:absolute; width:29px; height:32px; right:-12px; top:17px; z-index:5; background:var(--mp-gold); mask:var(--mp-flower) center/contain no-repeat; -webkit-mask:var(--mp-flower) center/contain no-repeat; transition:transform 650ms var(--mp-ease),opacity 200ms;}\n.mimosa-parcel:is(:focus-visible,.mp-open) {color:var(--mp-ink) !important;}\n.mimosa-parcel:is(:focus-visible,.mp-open) .mp-fold--top {transform:translateY(-21px) rotate(-4deg) scaleY(.82)}\n.mimosa-parcel:is(:focus-visible,.mp-open) .mp-fold--bottom {transform:translateY(21px) rotate(3deg) scaleY(.82)}\n.mimosa-parcel:is(:focus-visible,.mp-open) .mp-note {opacity:1; transition-delay:160ms}\n.mimosa-parcel:is(:focus-visible,.mp-open) .mp-filling {transform:scale(1,1)}\n.mimosa-parcel:is(:focus-visible,.mp-open) .mp-flower {opacity:1;transform:translate(var(--mp-x),var(--mp-y)) rotate(var(--mp-r)) scale(1)}\n.mimosa-parcel:is(:focus-visible,.mp-open) .mp-seal {transform:translate(13px,-24px) rotate(80deg) scale(.3);opacity:0}\n.mimosa-parcel:is(:focus-visible,.mp-open) .mp-arrow {transform:translateX(3px) rotate(-35deg)}\n.mimosa-parcel:active .mp-label {transform:scale(.95)}\n.mimosa-parcel:focus-visible {outline:2px solid var(--mp-ink);outline-offset:30px}\n.hero__ctas:has(.mimosa-parcel) {gap:42px; padding-top:17px; padding-bottom:30px; align-items:center;}\n@media(max-width:480px) {\n  .hero__ctas:has(.mimosa-parcel) {flex-direction:column;gap:40px;}\n  .mimosa-parcel {width:210px;}\n}\n@media(prefers-reduced-motion:reduce) {\n  .mimosa-parcel *, .mimosa-parcel *::before, .mimosa-parcel *::after {transition:none !important;animation:none !important;}\n}\n\n.mimosa-parcel {--mp-flower:url(\"data:image/svg+xml;base64,PHN2ZyBmaWxsPSJjdXJyZW50Q29sb3IiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDEwNy44NyAxMjAuNTYiPg0KICA8Zz4NCiAgICA8cGF0aCBkPSJNODUuNTIsMTAyLjE0Yy0uMDIsMS43MS0uMzksMy4wNi0xLjI4LDQuMzktMSwxLjUtMi4xOCwyLjczLTMuNiwzLjg2LTEuMzMsMS4wNi0yLjY3LDEuOTgtNC4zMSwyLjU0LTEuMTUuMzktMi4xNSwxLjAzLTMuMTQsMS43NGwtMiwxLjQyYy0xLjc2LjkxLTMuNywxLjI2LTUuNjksMS4xN2wtMi4yLjA1LTMuNTItLjAyYy0uOTUsMC0xLjg1LS41OC0yLjU2LTEuMThsLTIuNTgtMi4yYy0xLjI1LTEuMDctMi41LTItMy45OS0yLjcycy0yLjU5LTEuODMtMy43Ni0yLjkzYy0uOTYtLjkxLTIuMDItMS41OC0zLjEzLTIuMjYtLjcyLS40NC0xLjI2LTEuMDQtMS42My0xLjgxLTEuMTYtMi4zOS0xLjY5LTQuOTItMS44MS03LjY1LS40MS45OC0uNTYsMS45OS0uNzgsMy4wM2wtLjg5LDQuMzdjLS4zNiwxLjc1LS45NiwzLjM0LTEuOCw0LjktLjQyLjc4LS43NywxLjU0LS45OSwyLjM2LjYzLjc4LDEuMTEsMS43LDEuMDEsMi42OWwtLjM3LDMuNTNjLS4xMSwxLjA5LTEuNDksMy4zLTMuMTMsMy4xM2wtNC4wMS0uNDFjLTEuNDUtLjE1LTIuNjgtLjk2LTMuNDgtMi4xMy0uNjUtLjk1LS43Ni0xLjk3LS41NC0zLjA4bC40NS0yLjM3Yy44NS0yLjA5LDIuOTktMy4zMiw1LjI0LTMuMTFsMi44OS40NmMuMTYtMS4xOS42NC0yLjI4LDEuMjItMy4zNi44NC0xLjU4LDEuNDUtMy4xNywxLjgtNC45M2wxLjE5LTUuOTJjLTEuMjUuOTctMi42MSwxLjUtNC4wMSwyLjE1LTIuNjYsMS4yMy01LjQ1LDEuNTUtOC4zNC45NWwtNy4zNy0xLjUzYy0zLjkzLS44Mi04LjAzLTIuMTEtMTAuOTYtNC45NGwtMi45Ny0yLjg4Yy0xLjA5LTEuMDUtMi4wMi0yLjEyLTIuMjEtMy42OS0uMTItMS4wMi0uMjktMi4wOC0uMDctMy4xMWwxLjQ2LTYuNzIuOTMtMi4yMy45Ni0yLjk3Yy45Ni0yLjk3LDIuMTgtMi43LDQuMzYtNC42NSwxLjI2LTEuMTIsMi44NC0xLjY0LDQuNS0xLjc0czMuMDgtLjQxLDQuNjMtLjc1bDQuODMtMS4wNWMtMi45Mi0uNTItNS42LTEuMTItOC4zOC0xLjg0LTIuMzEtLjYtNC41Ny0uOS02Ljk4LTEuMjkuMDkuNzMtLjAzLDEuMjQtLjQ1LDEuNzUuMDMuOTUtLjQyLDIuMDItMS4zNywyLjI5bC0yLjI5LjA4Yy0uNzEuMDMtMS4yOS0uMjMtMS43Ny0uNzQtMS4xMy0uMjUtMi4zMS0uOTQtMi42LTIuMTNsLS4wOC0yLjMxYy4wMy0uNzUuMjYtMS40NC44MS0xLjk0LjI3LTEuMDcsMS4xOS0xLjY3LDIuMjktMS42NCwyLjQzLjA4LDMuMjItLjE1LDUuMjMsMi4xLjg4LjUxLDIuMDYuNjcsMy4wOC44NSwyLjk5LjUyLDUuODEsMS4xNCw4LjgsMS44OS0xLjc0LTEuMTMtNC43MS0xLjk5LTYuMDItMy4zMmwtMS45My0xLjk2Yy0uOTgtMS0xLjU0LTIuMjctMi4zNC0zLjQybC0yLjI1LTMuMjRjLTEuNTItMi4xOS0yLjItNC43MS0yLjMxLTcuMzhsLS4xNy00LjUzYy0uMDQtMS4wNi0uMDktMi4wOS4xNi0zLjEzbDEuNTktNi43MWMuNTQtMi4yNiwzLTYuMjgsNS4wOS03Ljg0bDIuNTktMS45NGMuOTItLjY5LDIuMjUtMS4yNywzLjQxLS45Mmw2LjQ3LDEuOTRjMy4wOC45Myw3Ljg4LDMuOTIsMTAuNyw1LjkybC0uMzYtMi44NWMtLjQxLTMuMjQtMS4yOS02LjQ2LS43MS05LjktLjk3LjQtMS45LjMxLTIuNjctLjMtMS40MS0xLjEtMi4xMi0yLjc1LTIuNDYtNC40OS0uMTgtLjkzLS40Ny0xLjc2LS4zNC0yLjY5QzI5LjAxLjM5LDMwLjk0LjUzLDMzLjM3LDBjLjcyLS4wMSwxLjM0LDAsMS45Ny4zMywxLjQ3LjA4LDIuOCwxLjE1LDMuMTYsMi41OGwuNTYsMi4yNGMuMTQsMS42MS0uNzgsMy4wMi0yLjAzLDQuMDFsLS40NSwzLjUyYy0uMTcsMS4zNC0uMDUsMi42Ni4xNywzLjk4bC44OCw1LjM3LDEuNTMtNS4yN2MuMjItLjc3LjY4LTEuMywxLjE4LTEuODgsMS41OC0xLjg0LDMuNDUtMy4yOSw1LjYtNC40MWwzLjU0LTEuODRjMi41My0xLjMxLDYuMzctMi4wMiw5LjI3LTIuMy43Ni0uMDcsMS40MS0uMDUsMi4xMi4ybDUuNjQsMi4wNGMxLjAxLjM3LDEuODQsMS4xNiwyLjU3LDEuOTYsMS4xNywxLjI5LDIuMjMsMi42NCwyLjcyLDQuMzUuOTYsMy4zLDEuNzcsOC4wMS42NCwxMS4yMmwtMS45OSw1LjY0LDEuNjYtMS42OSwyLjk1LTIuNjhjMS44MS0xLjY1LDMuNDgtMy4yOSw1LjYyLTQuNzItMS44MS0uOTYtMS42Mi0zLjQxLS41NS01LjExLjItLjMyLjI0LS43Ni41OC0xLjAybC42Ny0uMDMsMi44NC0xLjA3Yy40OC0uMTgsMS4xNy0uMzIsMS42Ni0uMSwyLjM4LDEuMDUsMi4wNC44NiwyLjQ3LDIuNDdsLjMyLDEuMi4yNSwyLjE4Yy4xNCwxLjI0LS42MywyLjAxLTEuNjIsMi40Ny0uNzkuMzctMS40Ny43Mi0yLjQxLjc5bC0yLjEyLjE1Yy0xLjgzLDEuMTgtMy4zNiwyLjYxLTQuOTcsNC4wNmwtMy4yOCwyLjk2Yy0xLjExLDEtMi4wOSwyLjAzLTIuOTYsMy4zLDEuNzUtLjc3LDMuNzYtMi44MSw1LjQ3LTMuMTFsMi43LS40OGMyLjQzLS42MSw0LjgzLS45OSw3LjM1LS44NWw0LjM5LjI0YzIsLjExLDQuMDEuMDksNS45My43NGw2LjU5LDIuNjRjLjgyLjMzLDEuMywxLjA2LDEuNiwxLjgzbC43LDIuOTguNjUsMy45Ny40OSwzLjNjLjI3LDEuNzguNTUsMy41My4yOSw1LjM0bC0uMjQsMy4yMy0yLjU0LDYuOThjLS42MiwxLjcxLTEuNzYsMy4xNS0zLjAyLDQuNDEtLjUxLjUxLTEuMjQuNy0xLjg5LjkzbC0yLjUzLjljLS44OC4zMS0xLjc5LjU4LTIuNzYuNTYtMS40Ny0uMDMtMi44My4xMy00LjI2LjUtMy41OS45MS04Ljk3LDIuMDUtMTIuMzUsMS4wNmwtNi42LTEuOTMtMy44NC0xLjdjLS4xNy0uMS0uMjIuMTYsMCwuMTUsMS4zNCwxLjIsMi43NSwyLjE0LDQuMjMsMy4xMiwxLjg5LDEuMjUsMy43MywyLjM4LDUuNzYsMy40LDIuNTQsMS4yNyw0LjczLDIuODcsNi44Nyw0LjcyLDEuMzcsMS4xOCwyLjgxLDIuMTEsNC40MiwyLjkxbDMuMTksMS41OGMuMDgtMS4xOS43OS0xLjk1LDEuODctMi4yMiwxLjM2LS4zMywyLjYxLjA2LDMuOTIuNDMsMS40OS40MiwyLjc3LDEuMTQsMy4zMywyLjY4LjE0LjM3LjE5Ljg0LjA0LDEuMjdsLS44MywyLjQ4Yy0uMzEuOTEtMi40OCwyLjk3LTQuMDksMi40NWwtMi43OC0uODljLTEuNDEtLjcxLTIuMS0yLjMzLTIuMDgtMy45bC01LjU4LTIuODJjLTEuNTMtLjc3LTIuODQtMS43MS00LjE1LTIuODItMi4xNS0xLjgyLTQuMzQtMy41LTYuOTgtNC42NiwxLjAxLjk1LDEuOTEsMS43OCwyLjYyLDIuOTMsMS45NiwzLjE2LDMuMjksNi41NSw0LjI2LDEwLjE0LjU4LDIuMTYsMS40Nyw0LjEyLDIuNzIsNS45NS43MSwxLjA0LDEuMSwyLjA4LDEuMDksMy4zN2wtLjA1LDUuNDJaIi8+DQogIDwvZz4NCjwvc3ZnPg==\")}";
  document.head.append(style);
  function mount(selector = '.hero__ctas > a[href="carta.html"], [data-mimosa-parcel]') {
    document.querySelectorAll(selector).forEach(link => {
      if (link.classList.contains('mimosa-parcel')) return;
      const label = link.dataset.mimosaLabel || 'Ver la carta';
      const font = getComputedStyle(link).fontFamily;
      link.style.setProperty('--mp-font', font);
      link.classList.add('mimosa-parcel');
      const text = document.createElement('span');
      text.className = 'mp-label';
      text.textContent = label + ' ';
      const arrow = document.createElement('span');
      arrow.className = 'mp-arrow'; arrow.textContent = '→'; arrow.setAttribute('aria-hidden', 'true');
      text.append(arrow);
      const paper = document.createElement('span');
      paper.className = 'mp-paper'; paper.setAttribute('aria-hidden', 'true');
      paper.innerHTML = '<span class="mp-filling"></span><span class="mp-flower mp-flower--a"></span><span class="mp-flower mp-flower--b"></span><span class="mp-flower mp-flower--c"></span><span class="mp-flower mp-flower--d"></span><span class="mp-fold mp-fold--top"><span class="mp-note">un pequeño capricho</span></span><span class="mp-fold mp-fold--bottom"><span class="mp-note">hecho con mucho mimo</span></span><span class="mp-seal"></span>';
      link.replaceChildren(paper, text);
      let lastPointer = '', pendingNavigation = null;
      function reset() {
        clearTimeout(pendingNavigation);
        pendingNavigation = null;
        lastPointer = '';
        link.classList.remove('mp-open');
        link.removeAttribute('aria-busy');
      }
      link.addEventListener('pointerenter', e => { if(e.pointerType !== 'touch') link.classList.add('mp-open'); });
      link.addEventListener('pointerleave', () => {
        if (pendingNavigation === null) link.classList.remove('mp-open');
      });
      link.addEventListener('pointerdown', e => {
        lastPointer = e.pointerType;
        if (e.pointerType !== 'touch') link.classList.add('mp-open');
      });
      link.addEventListener('pointercancel', reset);
      link.addEventListener('blur', reset);
      link.addEventListener('click', e => {
        // Only a completed, ordinary touch tap waits. Scrolling/holding never navigates.
        const touch = e.detail !== 0 && (e.pointerType || lastPointer) === 'touch';
        lastPointer = '';
        if (pendingNavigation !== null) { e.preventDefault(); return; }
        if (!touch || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ||
            link.hasAttribute('download') || (link.target && link.target !== '_self') ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        e.preventDefault();
        link.classList.add('mp-open');
        link.setAttribute('aria-busy', 'true');
        pendingNavigation = setTimeout(() => {
          const destination = link.href;
          reset();
          window.location.assign(destination);
        }, 900);
      });
      window.addEventListener('pagehide', reset);
      window.addEventListener('pageshow', reset);
    });
  }
  window.MimosaParcel = { mount };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount(), {once:true});
  else mount();
})();


/* Carta: «ver fotos» abre la galería de esa categoría */
document.querySelectorAll('[data-fotos]').forEach(b => b.addEventListener('click', () => {
  const f = document.querySelector('[data-zoom="' + b.dataset.fotos + '"]');
  if (f) f.click();
}));

/* Botones ilustrados: la versión animada se carga solo al pasar el ratón o, en el móvil, al verse en pantalla */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hover = matchMedia('(hover: hover)').matches;
  document.querySelectorAll('.ilu-btn img[data-anim]').forEach(img => {
    const still = img.getAttribute('src'), anim = img.dataset.anim;
    let pre = null, on = false;
    const play = () => {
      on = true;
      if (!pre) { pre = new Image(); pre.src = anim; }
      if (pre.complete && pre.naturalWidth) img.src = anim;
      else pre.onload = () => { if (on) img.src = anim; };
    };
    const stop = () => { on = false; img.src = still; };
    if (hover) {
      const a = img.closest('a');
      a.addEventListener('pointerenter', play); a.addEventListener('pointerleave', stop);
      a.addEventListener('focus', play); a.addEventListener('blur', stop);
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? play() : stop())), { threshold: .6 }).observe(img);
    }
  });
})();

/* Mapa: en iPhone, iPad y Mac abre Apple Maps; en el resto, Google Maps. Teléfono: solo si está puesto */
(function () {
  const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  const APPLE = 'https://maps.apple.com/?daddr=27.7679395,-15.5447249';   // indicaciones hasta el punto exacto, sin buscar por nombre
  if (apple) document.querySelectorAll('[data-mapa]').forEach(a => { a.href = APPLE; });
  if (MIMOSA_TELEFONO) document.querySelectorAll('[data-tel]').forEach(a => {
    a.href = 'tel:' + MIMOSA_TELEFONO.replace(/[^+\d]/g, '');
    a.querySelector('span').textContent = 'Llamar · ' + MIMOSA_TELEFONO;
    a.hidden = false;
  });
})();

/* Logo de la cabecera flotante: cambia de color según la sección de la página que tienes delante */
(function () {
  const header = document.querySelector('.header'), main = document.querySelector('main');
  if (!header || !main) return;
  const COLORES = ['#E9E2D4', '#DDC47C', '#BE7B65', '#8FABBA'];   // crema, oro, melocotón, azul
  let bloques = [];
  const medir = () => {
    bloques = [];
    [...main.children].forEach(el => {
      const dentro = el.querySelectorAll(':scope > section');
      (dentro.length > 1 ? [...dentro] : [el]).forEach(b => { if (b.offsetHeight > 80) bloques.push(b); });
    });
  };
  let pend = false, actual = -1;
  const pintar = () => {
    pend = false;
    const y = 90;
    let i = bloques.findIndex(b => { const r = b.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    if (i < 0) i = bloques.length - 1;
    if (i !== actual) { actual = i; header.style.setProperty('--logo', COLORES[i % COLORES.length]); }
  };
  medir(); pintar();
  addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(pintar); } }, { passive: true });
  addEventListener('resize', () => { medir(); pintar(); });
  addEventListener('load', () => { medir(); pintar(); });
})();

/* Deslizador: vitrina y tiras de fotos se mueven solas, despacio y sin tirones (también en el móvil),
   y se pueden arrastrar con el ratón o deslizar con el dedo */
(function () {
  const filas = document.querySelectorAll('.vitrina__balda, .strip');
  if (!filas.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  filas.forEach((b, n) => {
    const originales = [...b.children];
    if (!originales.length) return;
    b.classList.add('desliza');
    if (originales.length < 3) { b.classList.add('desliza--quieta'); return; }   // con una o dos fotos se queda quieta
    const pista = document.createElement('div');
    pista.className = 'desliza__pista';
    originales.forEach(el => pista.appendChild(el));
    b.appendChild(pista);
    const copiar = () => originales.forEach(el => {
      const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; c.classList.add('is-clone');
      if (c.matches('[data-zoom]')) c.addEventListener('click', () => el.click());   // la copia abre la foto original
      pista.appendChild(c);
    });
    copiar();
    let vuelta = 0;
    const medir = () => { vuelta = pista.children[originales.length].offsetLeft - originales[0].offsetLeft; let k = 0; while (pista.scrollWidth < vuelta * 2 + b.clientWidth + 40 && k++ < 8) copiar(); };
    medir(); addEventListener('resize', medir);
    const dir = n % 2 ? -1 : 1, vel = b.classList.contains('vitrina__balda') ? 19 : 17;   // px por segundo
    let pos = dir < 0 ? vuelta : 0, pausa = 0, sobre = false, visible = true, arr = null, antes = 0;
    const parar = ms => { pausa = performance.now() + ms; };
    const pintar = () => { if (vuelta) { pos = ((pos % vuelta) + vuelta) % vuelta; } pista.style.transform = `translate3d(${-pos}px,0,0)`; };
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') sobre = true; });
    b.addEventListener('pointerleave', () => { sobre = false; });
    b.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { pos += e.deltaX; pintar(); parar(2500); e.preventDefault(); } }, { passive: false });
    b.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      arr = { x: e.clientX, y: e.clientY, p: pos, movido: false, id: e.pointerId };
    });
    b.addEventListener('pointermove', e => {
      if (!arr || e.pointerId !== arr.id) return;
      const dx = e.clientX - arr.x;
      if (!arr.movido && Math.abs(dx) > 6) { arr.movido = true; b.classList.add('is-arrastrando'); try { b.setPointerCapture(e.pointerId); } catch (_) {} }
      if (arr.movido) { pos = arr.p - dx; pintar(); }
    });
    const soltar = () => {
      if (!arr) return; const m = arr.movido; arr = null; b.classList.remove('is-arrastrando'); parar(m ? 2500 : 0);
      if (m) b.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); }, { once: true, capture: true });
    };
    b.addEventListener('pointerup', soltar); b.addEventListener('pointercancel', soltar);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(b);
    const paso = t => {
      const dt = antes ? Math.min(64, t - antes) : 16; antes = t;
      if (!reduce && visible && !sobre && !arr && t > pausa) { pos += dir * vel * dt / 1000; pintar(); }
      requestAnimationFrame(paso);
    };
    pintar(); requestAnimationFrame(paso);
  });
})();
