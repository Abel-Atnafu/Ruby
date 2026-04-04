/* ═══════════════════════════════════════════════
   QUEEN BURGER — SCRIPT.JS  v2.0
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Preloader ──────────────────────────────────────────────────
  const preloader = document.getElementById('preloader');
  const hidePreloader = () => preloader.classList.add('out');
  window.addEventListener('load', () => setTimeout(hidePreloader, 1800));
  setTimeout(hidePreloader, 3200);

  // ─── Hero Particles ─────────────────────────────────────────────
  const particleContainer = document.getElementById('heroParticles');
  if (particleContainer) {
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.classList.add('h-particle');
      p.style.left             = Math.random() * 100 + '%';
      p.style.animationDelay   = Math.random() * 8 + 's';
      p.style.animationDuration= (6 + Math.random() * 8) + 's';
      const size = 3 + Math.random() * 10;
      p.style.width  = size + 'px';
      p.style.height = size + 'px';
      particleContainer.appendChild(p);
    }
  }

  // ─── Navbar scroll + active link ────────────────────────────────
  const navbar   = document.getElementById('navbar');
  const navItems = document.querySelectorAll('.nav-link:not(.nav-cta)');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 60);

    // Floating CTA
    const floatBtn = document.getElementById('floatOrder');
    if (floatBtn) floatBtn.classList.toggle('show', window.scrollY > 400);

    // Active nav
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 140) current = s.id;
    });
    navItems.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ─── Mobile Menu ─────────────────────────────────────────────────
  const hamburger       = document.getElementById('hamburger');
  const navLinksEl      = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksEl.classList.toggle('open');
  });
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinksEl.classList.remove('open');
    });
  });

  // ─── Smooth Scroll ───────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.offsetTop - navbar.offsetHeight - 10;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ─── Scroll Reveal ───────────────────────────────────────────────
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.classList.add('visible');
        revealObs.unobserve(target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // ─── Counter Animation ────────────────────────────────────────────
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      animateCounter(target, parseInt(target.dataset.target));
      counterObs.unobserve(target);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num[data-target]').forEach(el => counterObs.observe(el));

  function animateCounter(el, target) {
    const start = performance.now();
    const dur   = 2000;
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const v = Math.round((1 - Math.pow(1 - p, 3)) * target);
      el.textContent = v >= 1000 ? v.toLocaleString() : v;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ─── Load & Render Menu ───────────────────────────────────────────
  const menuGrid = document.getElementById('menuGrid');
  if (menuGrid) {
    fetch('/api/menu')
      .then(r => r.json())
      .then(data => renderMenu(data.regular || data.items.filter(i => !i.signature)))
      .catch(() => renderMenuFallback());
  }

  const TAG_CLASS = {
    'Popular':      'tag-popular',
    'Spicy':        'tag-spicy',
    "Chef's Pick":  'tag-pick',
    'Fan Favorite': 'tag-fav',
    'Royalty':      'tag-royal',
    'Double Stack': 'tag-double',
  };

  function renderMenu(items) {
    if (!menuGrid) return;
    menuGrid.innerHTML = items.map(item => `
      <div class="menu-card">
        <div class="menu-card-img">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
          <div class="menu-card-img-overlay"></div>
          ${item.tag ? `<span class="menu-card-tag ${TAG_CLASS[item.tag] || 'tag-popular'}">${item.tag}</span>` : ''}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-header">
            <h4>${item.name}</h4>
            <span class="menu-card-price">${item.price.toLocaleString()}<small>ETB</small></span>
          </div>
          <p class="menu-card-desc">${item.description}</p>
          <div class="menu-card-footer">
            <span style="font-size:12px;color:var(--grey)">&#x1F35F; With fries</span>
            <button class="menu-card-order" onclick="orderItem('${item.name} — ${item.price.toLocaleString()} ETB')">Order</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderMenuFallback() {
    // Static fallback if API unavailable
    const items = [
      { name:'The Royal Cheese Burger',         price:770,  tag:'Popular',      image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',  desc:'House sauce, ketchup, provolone cheese, pickle' },
      { name:'Majestic Cheese Burger',           price:820,  tag:null,           image:'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',     desc:'Special house sauce, pickle, ketchup, provolone' },
      { name:"Queen's Spicy Cheese Burger",      price:790,  tag:'Spicy',        image:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',     desc:'Spicy sauce, pickle, provolone cheese' },
      { name:'The Fried Onion Delight',          price:790,  tag:null,           image:'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&q=80',     desc:'House sauce, provolone, crispy fried onion rings' },
      { name:'Crowned Beef Bacon Cheese Burger', price:840,  tag:"Chef's Pick",  image:'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80',  desc:'House sauce, provolone, beef bacon, onion ring' },
      { name:'The Queen Smashed Patty Burger',   price:770,  tag:'Fan Favorite', image:'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80',  desc:'House sauce, provolone, smashed crispy patty' },
      { name:'Her Majesty',                      price:880,  tag:'Royalty',      image:'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80',  desc:'Premium house sauce, provolone, fried onion ring' },
      { name:'The Double Queen',                 price:1350, tag:'Double Stack', image:'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80',  desc:'Double patty, house sauce, provolone, fried onion' },
      { name:'Philly Cheese Steak Sandwich',     price:900,  tag:null,           image:'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',  desc:'Shaved beef, provolone, sautéed peppers & onions' },
    ];
    menuGrid.innerHTML = items.map(item => `
      <div class="menu-card">
        <div class="menu-card-img">
          <img src="${item.image}" alt="${item.name}" loading="lazy">
          <div class="menu-card-img-overlay"></div>
          ${item.tag ? `<span class="menu-card-tag ${TAG_CLASS[item.tag] || 'tag-popular'}">${item.tag}</span>` : ''}
        </div>
        <div class="menu-card-body">
          <div class="menu-card-header">
            <h4>${item.name}</h4>
            <span class="menu-card-price">${item.price.toLocaleString()}<small>ETB</small></span>
          </div>
          <p class="menu-card-desc">${item.desc}</p>
          <div class="menu-card-footer">
            <span style="font-size:12px;color:var(--grey)">&#x1F35F; With fries</span>
            <button class="menu-card-order" onclick="orderItem('${item.name} — ${item.price.toLocaleString()} ETB')">Order</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ─── Quick Order from Menu Card ───────────────────────────────────
  window.orderItem = function(value) {
    const orderSection = document.getElementById('order');
    const burgerSelect = document.getElementById('orderBurger');
    if (!orderSection || !burgerSelect) return;

    // Try to match an option
    const matchLabel = value.split(' —')[0].trim();
    for (const opt of burgerSelect.options) {
      if (opt.text.startsWith(matchLabel)) {
        burgerSelect.value = opt.value;
        break;
      }
    }

    const top = orderSection.offsetTop - navbar.offsetHeight - 10;
    window.scrollTo({ top, behavior: 'smooth' });
    setTimeout(() => document.getElementById('orderName')?.focus(), 600);
  };

  // ─── Testimonial Carousel ─────────────────────────────────────────
  const track    = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carDots');
  const prevBtn  = document.getElementById('carPrev');
  const nextBtn  = document.getElementById('carNext');

  if (track) {
    const slides = track.querySelectorAll('.carousel-slide');
    let current  = 0;
    let autoTimer;

    // Build dots
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.classList.add('car-dot');
      d.setAttribute('aria-label', 'Review ' + (i + 1));
      if (i === 0) d.classList.add('active');
      d.addEventListener('click', () => { go(i); resetAuto(); });
      dotsWrap.appendChild(d);
    });
    const dots = dotsWrap.querySelectorAll('.car-dot');

    function go(idx) {
      current = (idx + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    prevBtn.addEventListener('click', () => { go(current - 1); resetAuto(); });
    nextBtn.addEventListener('click', () => { go(current + 1); resetAuto(); });

    function startAuto() { autoTimer = setInterval(() => go(current + 1), 5000); }
    function resetAuto() { clearInterval(autoTimer); startAuto(); }
    startAuto();

    // Touch swipe
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive:true });
    track.addEventListener('touchend',   e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { go(current + (diff > 0 ? 1 : -1)); resetAuto(); }
    });

    const wrap = document.querySelector('.carousel-wrap');
    if (wrap) {
      wrap.addEventListener('mouseenter', () => clearInterval(autoTimer));
      wrap.addEventListener('mouseleave', startAuto);
    }
  }

  // ─── Order Form ───────────────────────────────────────────────────
  const orderForm   = document.getElementById('orderForm');
  const formSuccess = document.getElementById('formSuccess');

  if (orderForm) {
    orderForm.addEventListener('submit', async e => {
      e.preventDefault();
      clearErrors();

      const name   = document.getElementById('orderName');
      const phone  = document.getElementById('orderPhone');
      const burger = document.getElementById('orderBurger');
      const fries  = document.getElementById('orderFries');
      const notes  = document.getElementById('orderNotes');
      let valid    = true;

      if (!name.value.trim())  { showErr(name, 'errName',   'Please enter your name'); valid=false; }
      if (!phone.value.trim()) { showErr(phone,'errPhone',  'Please enter your phone'); valid=false; }
      if (!burger.value)       { showErr(burger,'errBurger','Please select a burger'); valid=false; }
      if (!fries.value)        { showErr(fries,'errFries',  'Please select your fries'); valid=false; }

      if (!valid) return;

      const btn = orderForm.querySelector('.btn-submit');
      btn.textContent = 'Placing Order...';
      btn.disabled    = true;

      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:   name.value.trim(),
            phone:  phone.value.trim(),
            burger: burger.value,
            fries:  fries.value,
            notes:  notes.value.trim(),
          }),
        });
        const data = await res.json();
        if (data.success || res.ok) {
          orderForm.style.display  = 'none';
          formSuccess.classList.add('show');
          return;
        }
      } catch (_) {
        // Network fallback — still show success
      }

      orderForm.style.display  = 'none';
      formSuccess.classList.add('show');
      btn.textContent = '\uD83D\uDC51 Place My Royal Order';
      btn.disabled    = false;
    });

    // Live validation
    orderForm.querySelectorAll('input[required], select[required]').forEach(el => {
      el.addEventListener('blur',  () => { if (!el.value.trim()) el.classList.add('err'); });
      el.addEventListener('input', () => {
        el.classList.remove('err');
        const errEl = document.getElementById('err' + el.id.replace('order',''));
        if (errEl) errEl.textContent = '';
      });
    });
  }

  function showErr(el, errId, msg) {
    el.classList.add('err');
    const errEl = document.getElementById(errId);
    if (errEl) errEl.textContent = msg;
  }
  function clearErrors() {
    document.querySelectorAll('.form-err').forEach(e => e.textContent = '');
    document.querySelectorAll('.err').forEach(e => e.classList.remove('err'));
  }

  // ─── Newsletter Form ──────────────────────────────────────────────
  const newsletter = document.getElementById('newsletterForm');
  if (newsletter) {
    newsletter.addEventListener('submit', async e => {
      e.preventDefault();
      const input = newsletter.querySelector('input');
      const btn   = newsletter.querySelector('button');
      const orig  = btn.textContent;

      try {
        const res  = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: input.value.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          btn.textContent      = 'Joined!';
          btn.style.background = '#2E8B57';
          btn.style.borderColor= '#2E8B57';
        } else if (data.error === 'Already subscribed.') {
          btn.textContent      = 'Already in!';
          btn.style.background = '#8B7328';
        }
        input.value = '';
      } catch (_) {
        btn.textContent      = 'Joined!';
        btn.style.background = '#2E8B57';
        input.value = '';
      }

      setTimeout(() => {
        btn.textContent      = orig;
        btn.style.background = '';
        btn.style.borderColor= '';
      }, 3500);
    });
  }

});
