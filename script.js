/* =============================================
   QUEEN BURGER - SCRIPT.JS
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // --- Preloader ---
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('loaded'), 2000);
  });
  setTimeout(() => preloader.classList.add('loaded'), 3000);

  // --- Hero Flames ---
  const heroFlames = document.getElementById('heroFlames');
  if (heroFlames) {
    for (let i = 0; i < 25; i++) {
      const flame = document.createElement('div');
      flame.classList.add('hero-flame');
      flame.style.left = Math.random() * 100 + '%';
      flame.style.animationDelay = Math.random() * 6 + 's';
      flame.style.animationDuration = (5 + Math.random() * 5) + 's';
      const size = 4 + Math.random() * 8;
      flame.style.width = size + 'px';
      flame.style.height = size + 'px';
      heroFlames.appendChild(flame);
    }
  }

  // --- Navbar Scroll ---
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link:not(.nav-cta)');
  const sections = document.querySelectorAll('section[id]');

  function handleNavScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // --- Mobile Menu ---
  const hamburger = document.getElementById('hamburger');
  const navLinksContainer = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinksContainer.classList.toggle('open');
  });

  navLinksContainer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinksContainer.classList.remove('open');
    });
  });

  // --- Scroll Reveal ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- Stat Counter ---
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => counterObserver.observe(el));

  function animateCounter(el, target) {
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      if (target >= 1000) {
        el.textContent = current.toLocaleString();
      } else {
        el.textContent = current;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // --- Testimonial Carousel ---
  const track = document.getElementById('testimonialTrack');
  const slides = track ? track.querySelectorAll('.testimonial-slide') : [];
  const dotsContainer = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  let currentSlide = 0;
  let autoplayInterval;

  if (slides.length > 0) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });

    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    function goToSlide(index) {
      currentSlide = index;
      track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }

    function nextSlide() { goToSlide((currentSlide + 1) % slides.length); }
    function prevSlide() { goToSlide((currentSlide - 1 + slides.length) % slides.length); }

    nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
    prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });

    function startAutoplay() { autoplayInterval = setInterval(nextSlide, 5000); }
    function resetAutoplay() { clearInterval(autoplayInterval); startAutoplay(); }
    startAutoplay();

    const carousel = document.querySelector('.testimonial-carousel');
    carousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
    carousel.addEventListener('mouseleave', startAutoplay);
  }

  // --- Order Form Validation ---
  const form = document.getElementById('orderForm');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
      form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

      const name = document.getElementById('orderName');
      if (!name.value.trim()) {
        showError('errorName', 'Please enter your name');
        name.classList.add('error');
        valid = false;
      }

      const phone = document.getElementById('orderPhone');
      if (!phone.value.trim()) {
        showError('errorPhone', 'Please enter your phone number');
        phone.classList.add('error');
        valid = false;
      }

      const burger = document.getElementById('orderBurger');
      if (!burger.value) {
        showError('errorBurger', 'Please select a burger');
        burger.classList.add('error');
        valid = false;
      }

      const fries = document.getElementById('orderFries');
      if (!fries.value) {
        showError('errorFries', 'Please select your fries');
        fries.classList.add('error');
        valid = false;
      }

      if (valid) {
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.textContent = 'Placing Order...';
        submitBtn.disabled = true;

        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.value.trim(),
            phone: phone.value.trim(),
            burger: burger.value,
            fries: fries.value,
            notes: document.getElementById('orderNotes').value.trim()
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            form.style.display = 'none';
            formSuccess.classList.add('show');
          }
        })
        .catch(() => {
          form.style.display = 'none';
          formSuccess.classList.add('show');
        })
        .finally(() => {
          submitBtn.textContent = '\u{1F451} Place My Order';
          submitBtn.disabled = false;
        });
      }
    });

    // Live validation on blur
    const inputs = form.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        if (!input.value.trim()) {
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
      });
      input.addEventListener('input', () => {
        input.classList.remove('error');
        const errorEl = input.parentElement.querySelector('.form-error');
        if (errorEl) errorEl.textContent = '';
      });
    });
  }

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  // --- Newsletter Form ---
  const newsletter = document.getElementById('newsletterForm');
  if (newsletter) {
    newsletter.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletter.querySelector('input');
      const btn = newsletter.querySelector('button');

      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: input.value.trim() })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success || data.error === 'Already subscribed') {
          btn.textContent = data.error ? 'Already joined!' : 'Joined!';
          btn.style.background = '#2E8B57';
          input.value = '';
        }
      })
      .catch(() => {
        btn.textContent = 'Joined!';
        btn.style.background = '#2E8B57';
        input.value = '';
      });

      setTimeout(() => {
        btn.textContent = 'Join';
        btn.style.background = '';
      }, 3000);
    });
  }

  // --- Smooth Scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = navbar.offsetHeight + 10;
        const top = target.offsetTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
