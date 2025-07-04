// para abrir el menu al hacer clik
const barra = document.querySelector('.barra');
const navegation = document.querySelector('.navegation');

barra.addEventListener('click', () => {
  barra.classList.toggle('active');
  navegation.classList.toggle('active');
});

// Cerrar menú al hacer clic en un el buton
document.querySelectorAll('.navegation a').forEach(link => {
  link.addEventListener('click', () => {
    barra.classList.remove('active');
    navegation.classList.remove('active');
  });
});

// para ser efecto el hacer click
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    window.scrollTo({
      top: targetElement.offsetTop - 80,
      behavior: 'smooth'
    });
  });
});



