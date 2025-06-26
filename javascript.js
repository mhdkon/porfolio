// Crear partículas flotantes
function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'floating-particles';
    document.body.appendChild(particlesContainer);
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Tamaño aleatorio entre 2px y 6px
        const size = Math.random() * 4 + 2;
        
        // Posición inicial aleatoria
        const posX = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = Math.random() * 20 + 10;
        
        // Estilos de la partícula
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.bottom = `-10px`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Efecto parallax para las secciones
function setupParallax() {
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset;
        
        sections.forEach(section => {
            const speed = section.getAttribute('data-speed') || 0.3;
            const offset = scrollPosition * speed;
            
            if (section.style.backgroundPositionY) {
                section.style.backgroundPositionY = `calc(50% + ${offset}px)`;
            }
        });
    });
}

// Efecto de escritura para el título
function typeWriterEffect() {
    const title = document.querySelector('.hero-content h1');
    const originalText = title.textContent;
    title.textContent = '';
    
    let i = 0;
    const speed = 100; // Velocidad en milisegundos
    
    function type() {
        if (i < originalText.length) {
            title.textContent += originalText.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Inicialización mejorada
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    loadSkills();
    setupMobileMenu();
    setupSmoothScrolling();
    setupScrollAnimations();
    createParticles();
    setupParallax();
    typeWriterEffect();
    
    // Añadir data-speed para parallax
    document.querySelector('.projects').setAttribute('data-speed', '0.5');
    document.querySelector('.about').setAttribute('data-speed', '0.3');
});