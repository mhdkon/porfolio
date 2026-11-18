document.addEventListener('DOMContentLoaded', function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Acceso seguro a localStorage (puede estar bloqueado en modo privado)
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  // ==================== MENÚ RESPONSIVO ====================
  const barra = document.querySelector('.barra');
  const navegation = document.querySelector('.navegation');

  function setMenu(open) {
    if (!barra || !navegation) return;
    barra.classList.toggle('active', open);
    navegation.classList.toggle('active', open);
    barra.setAttribute('aria-expanded', String(open));
  }

  if (barra && navegation) {
    barra.addEventListener('click', () => setMenu(!navegation.classList.contains('active')));
    barra.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setMenu(!navegation.classList.contains('active'));
      }
    });
    navegation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  }

  // ==================== SCROLL SUAVE ====================
  // Solo gestiona enlaces internos (#id). Los enlaces externos se dejan intactos.
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.length < 2 || href.charAt(0) !== '#') return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      const headerHeight = (document.querySelector('header') || {}).offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 10;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', href);
    });
  });

  // ==================== MODAL DE PROYECTOS ====================
  const modal = document.getElementById('modal');
  const cerrar = document.querySelector('.cerrar');
  let lastFocus = null;

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    const modalImg = modal.querySelector('img');
    if (modalImg) modalImg.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openModal(card, img) {
    lastFocus = document.activeElement;
    const modalImg = modal.querySelector('img');
    const modalLink = modal.querySelector('.btn-ir');
    const modalTitle = modal.querySelector('h3');
    if (modalImg) {
      modalImg.src = img.currentSrc || img.src;
      modalImg.alt = img.alt;
    }
    const liveLink = card && card.querySelector('.btn-live');
    const titleElem = card && card.querySelector('h3');
    if (modalLink && liveLink) modalLink.href = liveLink.href;
    if (modalTitle && titleElem) modalTitle.textContent = titleElem.textContent;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (cerrar) cerrar.focus();
  }

  if (modal) {
    // Se escucha el CONTENEDOR de la imagen: la capa .overlay-proyecto la tapa
    // y antes bloqueaba los clics, por eso el modal no se abría.
    document.querySelectorAll('.proyecto-imagen').forEach((box) => {
      const img = box.querySelector('.clickable-img');
      if (!img) return;
      const card = box.closest('.proyecto-card');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', 'Abrir vista previa: ' + img.alt);
      box.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // el botón "Ver en vivo" sigue funcionando
        openModal(card, img);
      });
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card, img);
        }
      });
    });

    if (cerrar) {
      cerrar.addEventListener('click', closeModal);
      cerrar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeModal(); }
      });
    }
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (modal && modal.style.display === 'flex') closeModal();
    setMenu(false);
  });

  // ==================== MODO OSCURO/CLARO ====================
  // El tema inicial ya lo pone el script del <head>; aquí solo se gestiona el botón.
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    const root = document.documentElement;

    function paintTheme(theme) {
      root.setAttribute('data-theme', theme);
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      if (icon) {
        icon.classList.toggle('fa-sun', theme === 'light');
        icon.classList.toggle('fa-moon', theme !== 'light');
      }
    }

    paintTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      paintTheme(next);
      store.set('theme', next);
      themeToggle.style.transform = 'scale(1.2)';
      setTimeout(() => { themeToggle.style.transform = 'scale(1)'; }, 200);
    });
  }

  // ==================== DESCARGA DE CV CON AVISO ====================
  const cvButton = document.querySelector('.cv-download');
  if (cvButton) {
    cvButton.addEventListener('click', function () {
      const toast = document.createElement('div');
      toast.className = 'download-toast';
      toast.setAttribute('role', 'status');
      toast.textContent = '📄 Descargando CV...';
      toast.style.cssText =
        'position:fixed;bottom:24px;left:20px;background:linear-gradient(135deg,var(--accent),var(--accent-dark));' +
        'color:#fff;padding:12px 25px;border-radius:50px;font-size:.9rem;font-weight:600;' +
        'box-shadow:0 0 15px rgba(56,189,248,.5);z-index:10000;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

      this.style.transform = 'scale(0.9)';
      setTimeout(() => { this.style.transform = 'scale(1)'; }, 200);
    });
  }

  // ==================== HEADER AL HACER SCROLL ====================
  const header = document.querySelector('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ==================== FORMULARIO DE CONTACTO (Netlify Forms) ====================
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      status.textContent = 'Enviando...';
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        });
        if (!res.ok) throw new Error('Error ' + res.status);
        form.reset();
        status.textContent = '¡Mensaje enviado! Te responderé lo antes posible.';
      } catch (err) {
        status.textContent = 'No se pudo enviar. Escríbeme a mhdkon01@gmail.com.';
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  // ==================== PARTÍCULAS (solo modo oscuro, sin acumularse) ====================
  if (!reduceMotion) {
    setInterval(() => {
      if (document.hidden) return;
      if (document.documentElement.getAttribute('data-theme') !== 'dark') return;
      if (document.querySelectorAll('.particle').length >= 8) return;
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDuration = (5 + Math.random() * 10) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 15000);
    }, 3000);
  }
});