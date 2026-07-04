/* =========================================================
   Nature Skin Beauty — Interactions
   ========================================================= */
(function () {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Theme (dark mode) ---------- */
  const root = document.documentElement;
  const applyTheme = t => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('nsb_theme', t); } catch (e) {}
    $$('[data-theme-label]').forEach(el => el.textContent = t === 'dark' ? 'Hellmodus' : 'Dunkelmodus');
    const meta = $('meta[name="theme-color"]:not([media])') || $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#14180f' : '#faf7ef');
  };
  const toggleTheme = () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  // sync label with the theme already set by the inline head script
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  ['#themeBtn', '#themeBtnMobile'].forEach(sel => { const b = $(sel); if (b) b.addEventListener('click', toggleTheme); });

  /* ---------- Nav scroll state ---------- */
  const nav = $('#nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    $('#toTop').classList.toggle('show', window.scrollY > 600);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile drawer ---------- */
  const drawer = $('#drawer'), toggle = $('#navToggle');
  const openDrawer = () => { drawer.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; };
  const closeDrawer = () => { drawer.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
  toggle.addEventListener('click', openDrawer);
  $$('[data-close]', drawer).forEach(el => el.addEventListener('click', closeDrawer));

  /* ---------- Smooth scroll + active link ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  const navLinks = $$('.nav__links a');
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const id = '#' + en.target.id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- Scroll reveal ---------- */
  const reveals = $$('.reveal');
  if (reduceMotion) {
    reveals.forEach(r => r.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(r => io.observe(r));
  }

  /* ---------- Count up stats ---------- */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      obs.unobserve(en.target);
      const el = en.target;
      const target = +el.dataset.count;
      const suffix = el.textContent.replace(/[0-9]/g, '');
      if (reduceMotion) { el.textContent = target + suffix; return; }
      const dur = 1400; const start = performance.now();
      const step = now => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => cio.observe(c));

  /* ---------- Hero parallax ---------- */
  const frame = $('.hero__frame');
  const leaf = $('.hero__leaf');
  if (frame && !reduceMotion) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 900) {
        frame.style.transform = `translateY(${y * 0.05}px)`;
        if (leaf) leaf.style.transform = `rotate(12deg) translateY(${y * -0.08}px)`;
      }
    }, { passive: true });
  }

  /* ---------- Claim band parallax ---------- */
  const claimBg = $('#claimBg');
  if (claimBg && !reduceMotion) {
    const claim = claimBg.parentElement;
    window.addEventListener('scroll', () => {
      const rect = claim.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const offset = (rect.top - window.innerHeight / 2) * -0.08;
        claimBg.style.transform = `translateY(${offset}px) scale(1.12)`;
      }
    }, { passive: true });
    claimBg.style.transform = 'scale(1.12)';
  }

  /* ---------- Calendar (visual booking) ---------- */
  const monthEl = $('#calMonth'), daysEl = $('#calDays'), summary = $('#calSummary');
  if (daysEl) {
    const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    let view = new Date(); view.setDate(1);
    const today = new Date(); today.setHours(0,0,0,0);
    let selDay = null, selSlot = null;

    const render = () => {
      daysEl.innerHTML = '';
      monthEl.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
      let first = view.getDay(); first = (first === 0) ? 6 : first - 1; // Mon-based
      const dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (let i = 0; i < first; i++) {
        const e = document.createElement('div'); e.className = 'cal__day is-empty'; daysEl.appendChild(e);
      }
      for (let d = 1; d <= dim; d++) {
        const cell = document.createElement('button');
        cell.type = 'button'; cell.className = 'cal__day'; cell.textContent = d;
        const date = new Date(view.getFullYear(), view.getMonth(), d);
        const isPast = date < today;
        const isSunday = date.getDay() === 0;
        if (isPast || isSunday) cell.classList.add('is-muted');
        if (selDay === d && sameMonth(date, view)) cell.classList.add('is-selected');
        cell.addEventListener('click', () => {
          if (cell.classList.contains('is-muted')) return;
          selDay = d;
          $$('.cal__day', daysEl).forEach(c => c.classList.remove('is-selected'));
          cell.classList.add('is-selected');
          updateSummary(date);
        });
        daysEl.appendChild(cell);
      }
    };
    const sameMonth = (a, b) => a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    const updateSummary = (date) => {
      const dateStr = date.toLocaleDateString('de-CH', { weekday:'long', day:'numeric', month:'long' });
      summary.classList.add('show');
      summary.innerHTML = selSlot
        ? `Ausgewählt: <b>${dateStr}</b> um <b>${selSlot} Uhr</b>. Sende die Anfrage, ich bestätige dir den Termin.`
        : `Ausgewählt: <b>${dateStr}</b>. Wähle jetzt noch eine Uhrzeit.`;
    };

    $('#calPrev').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); selDay = null; summary.classList.remove('show'); render(); });
    $('#calNext').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); selDay = null; summary.classList.remove('show'); render(); });

    $$('#calSlots .slot').forEach(s => s.addEventListener('click', () => {
      $$('#calSlots .slot').forEach(x => x.classList.remove('is-selected'));
      s.classList.add('is-selected'); selSlot = s.textContent;
      if (selDay) updateSummary(new Date(view.getFullYear(), view.getMonth(), selDay));
      else { summary.classList.add('show'); summary.innerHTML = `Uhrzeit <b>${selSlot} Uhr</b> gewählt. Wähle jetzt noch einen Tag.`; }
    }));
    render();
  }

  /* ---------- Gallery lightbox ---------- */
  const items = $$('.gallery__item');
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  let idx = 0;
  const openLb = i => {
    idx = i; const src = items[i].dataset.src;
    lbImg.src = src; lbImg.alt = items[i].querySelector('img').alt;
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  };
  const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  const go = dir => { idx = (idx + dir + items.length) % items.length; openLb(idx); };
  items.forEach((it, i) => it.addEventListener('click', () => openLb(i)));
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', e => { e.stopPropagation(); go(-1); });
  $('#lbNext').addEventListener('click', e => { e.stopPropagation(); go(1); });
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  /* ---------- Testimonials slider ---------- */
  const track = $('#testiTrack'), dotsWrap = $('#testiDots');
  if (track) {
    const slides = $$('.testi__slide', track);
    let cur = 0, timer = null;
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Stimme ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => { goTo(i); restart(); });
      dotsWrap.appendChild(b);
    });
    const dots = $$('button', dotsWrap);
    const goTo = i => {
      cur = i; track.style.transform = `translateX(-${i * 100}%)`;
      dots.forEach((d, k) => d.classList.toggle('active', k === i));
    };
    const next = () => goTo((cur + 1) % slides.length);
    const start = () => { if (!reduceMotion) timer = setInterval(next, 6000); };
    const restart = () => { clearInterval(timer); start(); };
    start();
  }

  /* ---------- Toast ---------- */
  const toast = $('#toast'), toastMsg = $('#toastMsg');
  let toastTimer;
  const showToast = msg => {
    toastMsg.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  };

  /* ---------- Shopping cart ---------- */
  const cartEl = $('#cart');
  if (cartEl) {
    const STORE = 'nsb_cart';
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { cart = []; }

    const els = {
      btn: $('#cartBtn'), count: $('#cartCount'), headCount: $('#cartHeadCount'),
      items: $('#cartItems'), empty: $('#cartEmpty'), foot: $('#cartFoot'),
      total: $('#cartTotal'), checkout: $('#cartCheckout'),
    };
    const fmt = n => 'CHF ' + n.toLocaleString('de-CH');
    const save = () => { try { localStorage.setItem(STORE, JSON.stringify(cart)); } catch (e) {} };
    const totalQty = () => cart.reduce((s, i) => s + i.qty, 0);
    const totalSum = () => cart.reduce((s, i) => s + i.qty * i.price, 0);

    const render = () => {
      const qty = totalQty();
      // badge
      if (qty > 0) { els.count.hidden = false; els.count.textContent = qty; }
      else els.count.hidden = true;
      els.headCount.textContent = qty ? `· ${qty}` : '';
      // empty vs list
      const isEmpty = cart.length === 0;
      els.empty.hidden = !isEmpty;
      els.foot.hidden = isEmpty;
      els.items.innerHTML = '';
      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <img class="cart-item__img" src="${item.img}" alt="${item.name}">
          <div class="cart-item__info">
            <h4>${item.name}</h4>
            <div class="u">${item.unit}</div>
            <div class="p">${fmt(item.price)}</div>
            <div class="qty" style="margin-top:8px">
              <button type="button" data-dec aria-label="Weniger">−</button>
              <span>${item.qty}</span>
              <button type="button" data-inc aria-label="Mehr">+</button>
            </div>
          </div>
          <div class="cart-item__side">
            <button class="cart-item__remove" data-remove aria-label="Entfernen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13h10l1-13"/></svg>
            </button>
            <strong style="font-family:var(--f-serif);color:var(--ink)">${fmt(item.price * item.qty)}</strong>
          </div>`;
        row.querySelector('[data-inc]').addEventListener('click', () => changeQty(item.id, 1));
        row.querySelector('[data-dec]').addEventListener('click', () => changeQty(item.id, -1));
        row.querySelector('[data-remove]').addEventListener('click', () => removeItem(item.id));
        els.items.appendChild(row);
      });
      els.total.textContent = fmt(totalSum());
    };

    const addItem = (data) => {
      const found = cart.find(i => i.id === data.id);
      if (found) found.qty += 1;
      else cart.push({ ...data, qty: 1 });
      save(); render();
      els.btn.classList.remove('bump'); void els.btn.offsetWidth; els.btn.classList.add('bump');
    };
    const changeQty = (id, d) => {
      const it = cart.find(i => i.id === id); if (!it) return;
      it.qty += d;
      if (it.qty <= 0) cart = cart.filter(i => i.id !== id);
      save(); render();
    };
    const removeItem = (id) => { cart = cart.filter(i => i.id !== id); save(); render(); };

    const openCart = () => { cartEl.classList.add('open'); cartEl.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
    const closeCart = () => { cartEl.classList.remove('open'); cartEl.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };

    els.btn.addEventListener('click', openCart);
    $$('[data-cart-close]', cartEl).forEach(el => el.addEventListener('click', closeCart));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cartEl.classList.contains('open')) closeCart(); });

    // add-to-cart buttons on products
    $$('.product').forEach(card => {
      const btn = card.querySelector('[data-add]');
      if (!btn) return;
      btn.addEventListener('click', () => {
        addItem({
          id: card.dataset.id,
          name: card.dataset.name,
          price: +card.dataset.price,
          unit: card.dataset.unit,
          img: card.dataset.img,
        });
        showToast(card.dataset.name + ' hinzugefügt');
      });
    });

    els.checkout.addEventListener('click', () => {
      showToast('Bestellung folgt bald – melde dich gerne direkt bei mir.');
    });

    render();
  }

  /* ---------- Contact form validation ---------- */
  const form = $('#contactForm');
  if (form) {
    const fields = {
      name: v => v.trim().length >= 2,
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: v => v.trim().length >= 5,
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      Object.keys(fields).forEach(id => {
        const input = $('#' + id);
        const wrap = input.closest('.field');
        const valid = fields[id](input.value);
        wrap.classList.toggle('error', !valid);
        if (!valid && ok) { input.focus(); }
        if (!valid) ok = false;
      });
      if (!ok) return;
      $('#formFields').style.display = 'none';
      $('#formSuccess').classList.add('show');
      showToast('Nachricht gesendet');
    });
    // clear error on input
    ['name','email','message'].forEach(id => {
      const input = $('#' + id);
      input.addEventListener('input', () => input.closest('.field').classList.remove('error'));
    });
  }
})();
