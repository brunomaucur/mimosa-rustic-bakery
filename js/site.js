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
    header.classList.toggle('is-hidden', y > 500 && y > lastY && !document.body.classList.contains('menu-open'));
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
  $$('.strip').forEach(strip => {
    const track = document.createElement('div');
    track.className = 'loop__track';
    while (strip.firstChild) track.appendChild(strip.firstChild);
    strip.appendChild(track);
    strip.classList.add('loop', 'loop--strip');
    strip.dataset.loop = '';
    strip.dataset.speed = '35';
  });
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
    const bar = $('.menu-nav'), btn = $('.cat-dock__btn', dock);
    new IntersectionObserver(([e]) => {
      dock.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
      if (e.isIntersecting) { dock.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    }).observe(bar);
    // en el bloque de encargos (formulario) el desplegable se aparta para no tapar nada
    const enc = $('#encargos');
    if (enc) new IntersectionObserver(([e]) => dock.classList.toggle('is-away', e.isIntersecting), { rootMargin: '-25% 0px -25% 0px' }).observe(enc);
    btn.addEventListener('click', () => btn.setAttribute('aria-expanded', dock.classList.toggle('is-open')));
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
        'Hola Mimosa, me gustaría encargar una tarta:',
        `- Tarta: ${f.tarta}`,
        `- Para: ${f.personas}`,
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
    const show = () => { const im = group[i].querySelector('img'); img.src = im.currentSrc || im.src; img.alt = im.alt; cap.textContent = im.alt; };
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
    addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }
})();
