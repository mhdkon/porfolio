/* ===== MENÚ RESPONSIVO ===== */
const barra = document.querySelector('.barra');
const navegation = document.querySelector('.navegation');

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

/* ===== SCROLL SUAVE ===== */
const anchors = document.querySelectorAll('a[href^="#"]');

anchors.forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = anchor.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    window.scrollTo({
      top: targetElement.offsetTop - 80,
      behavior: 'smooth'
    });
  });
});

/* ===== MODAL DE PROYECTOS ===== */
const modal = document.getElementById('modal');
const imgsClick = document.querySelectorAll('.clickable-img');
const cerrar = document.querySelector('.cerrar');

imgsClick.forEach(img => {
  img.addEventListener('click', () => {
    modal.style.display = 'flex';
    // Cambiar imagen del modal según la imagen clicada
    modal.querySelector('img').src = img.src;
    modal.querySelector('img').alt = img.alt;
  });
});

// Cerrar modal al hacer clic en la X
cerrar.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', e => {
  if(e.target === modal) modal.style.display = 'none';
});
