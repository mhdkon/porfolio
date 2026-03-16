// ===== MENÚ RESPONSIVO (tu código) =====
const barra = document.querySelector('.barra');
const navegation = document.querySelector('.navegation');

if (barra && navegation) {
  barra.addEventListener('click', () => {
    barra.classList.toggle('active');
    navegation.classList.toggle('active');
  });

  // Cerrar menú al hacer clic en un enlace
  document.querySelectorAll('.navegation a').forEach(link => {
    link.addEventListener('click', () => {
      barra.classList.remove('active');
      navegation.classList.remove('active');
    });
  });
}

// ===== SCROLL SUAVE (tu código mejorado) =====
const anchors = document.querySelectorAll('a[href^="#"]');

anchors.forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    
    // Si es solo "#" o está vacío, no hacer nada
    if (targetId === '#' || !targetId) return;
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerHeight = document.querySelector('header').offsetHeight;
      window.scrollTo({
        top: targetElement.offsetTop - headerHeight - 10,
        behavior: 'smooth'
      });
    }
  });
});

// ===== MODAL DE PROYECTOS (tu código adaptado) =====
// Crear modal si no existe
if (!document.getElementById('modal')) {
  const modalHTML = `
    <div id="modal" class="modal">
      <div class="modal-content">
        <span class="cerrar">&times;</span>
        <img src="" alt="Imagen del proyecto">
        <h3></h3>
        <a href="#" target="_blank" class="btn-ir">Ver proyecto</a>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

const modal = document.getElementById('modal');
const imgsClick = document.querySelectorAll('.clickable-img, .imagen-proyecto');
const cerrar = document.querySelector('.cerrar');

// Si hay imágenes clicables, agregar evento
imgsClick.forEach(img => {
  img.addEventListener('click', (e) => {
    e.preventDefault();
    if (modal) {
      modal.style.display = 'flex';
      // Buscar la imagen dentro del elemento clickeado
      const imgElement = img.tagName === 'IMG' ? img : img.querySelector('img');
      if (imgElement) {
        const modalImg = modal.querySelector('img');
        const modalLink = modal.querySelector('.btn-ir');
        const modalTitle = modal.querySelector('h3');
        
        if (modalImg) {
          modalImg.src = imgElement.src;
          modalImg.alt = imgElement.alt;
        }
        
        // Buscar el enlace del proyecto (el padre o el enlace más cercano)
        const projectLink = img.closest('a');
        if (modalLink && projectLink) {
          modalLink.href = projectLink.href;
        }
        
        // Poner título
        const title = img.closest('.proyecto')?.querySelector('h4')?.textContent || 'Proyecto';
        if (modalTitle) modalTitle.textContent = title;
      }
    }
  });
});

// Cerrar modal al hacer clic en la X
if (cerrar) {
  cerrar.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });
}

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});

// ===== MODO OSCURO/CLARO (nuevo) =====
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    
    // Comprobar si hay un tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-mode');
      if (icon) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      }
    }
    
    // Toggle de tema
    themeToggle.addEventListener('click', function() {
      document.body.classList.toggle('light-mode');
      
      if (document.body.classList.contains('light-mode')) {
        if (icon) {
          icon.classList.remove('fa-moon');
          icon.classList.add('fa-sun');
        }
        localStorage.setItem('theme', 'light');
      } else {
        if (icon) {
          icon.classList.remove('fa-sun');
          icon.classList.add('fa-moon');
        }
        localStorage.setItem('theme', 'dark');
      }
      
      // Animación de cambio
      themeToggle.style.transform = 'scale(1.2)';
      setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
      }, 200);
    });
  }
  
  // ===== DESCARGA DE CV CON ANIMACIÓN =====
  const cvButton = document.querySelector('.cv-download');
  
  if (cvButton) {
    cvButton.addEventListener('click', function(e) {
      // Animación de descarga
      this.style.transform = 'scale(0.9)';
      setTimeout(() => {
        this.style.transform = 'scale(1)';
      }, 200);
      
      // Mostrar mensaje de confirmación
      const tooltip = document.createElement('div');
      tooltip.className = 'download-toast';
      tooltip.textContent = '📄 CV descargado';
      tooltip.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        background: var(--gradient-1);
        color: white;
        padding: 12px 25px;
        border-radius: 50px;
        font-size: 0.9rem;
        font-weight: 600;
        box-shadow: var(--shadow-glow);
        z-index: 10000;
        animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s forwards;
      `;
      
      document.body.appendChild(tooltip);
      
      setTimeout(() => {
        tooltip.remove();
      }, 3000);
    });
  }
  
  // ===== HEADER SCROLL EFFECT =====
  const header = document.querySelector('header');
  
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
  
  // ===== ANIMACIÓN DE ESCRITURA PARA EL HERO =====
  const subtitle = document.querySelector('.subtitle');
  if (subtitle && !subtitle.classList.contains('typed')) {
    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.display = 'inline-block';
    subtitle.style.borderRight = '2px solid var(--primary)';
    subtitle.style.animation = 'typing 3s steps(30) forwards, blink 1s infinite';
    
    let i = 0;
    function typeWriter() {
      if (i < text.length) {
        subtitle.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 100);
      } else {
        subtitle.style.borderRight = 'none';
        subtitle.classList.add('typed');
      }
    }
    
    setTimeout(typeWriter, 1000);
  }
  
  // ===== CREAR PARTÍCULAS (solo en modo oscuro) =====
  function createParticle() {
    if (!document.body.classList.contains('light-mode')) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDuration = (5 + Math.random() * 10) + 's';
      document.body.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 15000);
    }
  }
  
  // Crear partículas cada 2 segundos
  setInterval(createParticle, 2000);
});

// ===== AÑADIR ANIMACIONES FALTANTES AL CSS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes typing {
    from { width: 0; }
    to { width: 100%; }
  }
  
  @keyframes blink {
    50% { border-color: transparent; }
  }
  
  .download-toast {
    background: var(--gradient-1) !important;
  }
`;
document.head.appendChild(style);