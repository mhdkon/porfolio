// ==================== ESPERAR A QUE EL DOM ESTÉ LISTO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado - Iniciando scripts');

    // ==================== MENÚ RESPONSIVO ====================
    const barra = document.querySelector('.barra');
    const navegation = document.querySelector('.navegation');
    if (barra && navegation) {
        barra.addEventListener('click', () => {
            barra.classList.toggle('active');
            navegation.classList.toggle('active');
        });
        document.querySelectorAll('.navegation a').forEach(link => {
            link.addEventListener('click', () => {
                barra.classList.remove('active');
                navegation.classList.remove('active');
            });
        });
    }

    // ==================== SCROLL SUAVE ====================
    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#' || !targetId) return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('header')?.offsetHeight || 80;
                window.scrollTo({
                    top: targetElement.offsetTop - headerHeight - 10,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==================== MODAL DE PROYECTOS ====================
    const modal = document.getElementById('modal');
    const imgsClick = document.querySelectorAll('.clickable-img');
    const cerrar = document.querySelector('.cerrar');
    if (modal && imgsClick.length) {
        imgsClick.forEach(img => {
            img.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
                const modalImg = modal.querySelector('img');
                const modalLink = modal.querySelector('.btn-ir');
                const modalTitle = modal.querySelector('h3');
                if (modalImg) {
                    modalImg.src = img.src;
                    modalImg.alt = img.alt;
                }
                const projectCard = img.closest('.proyecto-card');
                if (projectCard) {
                    const liveLink = projectCard.querySelector('.btn-live');
                    if (modalLink && liveLink) modalLink.href = liveLink.href;
                    const titleElem = projectCard.querySelector('h3');
                    if (modalTitle && titleElem) modalTitle.textContent = titleElem.textContent;
                }
            });
        });
        if (cerrar) cerrar.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    }

    // ==================== MODO OSCURO/CLARO ====================
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        const root = document.documentElement;
        
        // Función para aplicar tema
        function setTheme(theme) {
            root.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            if (icon) {
                if (theme === 'light') {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
            console.log(`Tema cambiado a: ${theme}`);
        }
        
        // Cargar tema guardado o preferencia del sistema
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
        }
        
        // Evento de clic
        themeToggle.addEventListener('click', () => {
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            // Animación
            themeToggle.style.transform = 'scale(1.2)';
            setTimeout(() => { themeToggle.style.transform = 'scale(1)'; }, 200);
        });
    } else {
        console.error('❌ No se encontró el botón con id="themeToggle"');
    }

    // ==================== DESCARGA DE CV CON TOAST ====================
    const cvButton = document.querySelector('.cv-download');
    if (cvButton) {
        cvButton.addEventListener('click', function(e) {
            // El enlace ya tiene download, solo añadimos animación y toast
            // No prevenimos el comportamiento por defecto para que descargue el PDF
            setTimeout(() => {
                const toast = document.createElement('div');
                toast.textContent = '📄 Descargando CV...';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 100px;
                    right: 30px;
                    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
                    color: white;
                    padding: 12px 25px;
                    border-radius: 50px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    box-shadow: 0 0 15px rgba(56,189,248,0.5);
                    z-index: 10000;
                    animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s forwards;
                `;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }, 100);
            
            // Animación del botón
            this.style.transform = 'scale(0.9)';
            setTimeout(() => { this.style.transform = 'scale(1)'; }, 200);
        });
    } else {
        console.error('❌ No se encontró el botón .cv-download');
    }

    // ==================== HEADER SCROLL EFFECT ====================
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }

    // ==================== ANIMACIÓN DE ESCRITURA (SUB TÍTULO) ====================
    const subtitle = document.querySelector('.subtitle');
    if (subtitle && !subtitle.classList.contains('typed')) {
        const originalText = subtitle.textContent;
        subtitle.textContent = '';
        subtitle.style.borderRight = '2px solid var(--accent)';
        let i = 0;
        function typeWriter() {
            if (i < originalText.length) {
                subtitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            } else {
                subtitle.style.borderRight = 'none';
                subtitle.classList.add('typed');
            }
        }
        setTimeout(typeWriter, 1000);
    }

    // ==================== PARTÍCULAS (solo en modo oscuro) ====================
    function createParticle() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDuration = (5 + Math.random() * 10) + 's';
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 15000);
        }
    }
    setInterval(createParticle, 3000);
});

// ==================== INYECTAR ESTILOS FALTANTES (si no están en tu CSS) ====================
if (!document.querySelector('#dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100px); opacity: 0; }
        }
        @keyframes floatParticle {
            0% { opacity: 0.8; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-100px) scale(0); }
        }
        .particle {
            position: fixed;
            width: 4px;
            height: 4px;
            background: var(--accent);
            border-radius: 50%;
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
            animation: floatParticle linear forwards;
        }
        .clickable-img {
            cursor: pointer;
        }
        header.scrolled {
            background-color: rgba(15, 23, 42, 0.98) !important;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        :root[data-theme="light"] header.scrolled {
            background-color: rgba(255,255,255,0.98) !important;
            box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }
    `;
    document.head.appendChild(style);
}