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


// Seleccionamos todos los enlaces con href que empiezan con "#"
const anchors = document.querySelectorAll('a[href^="#"]');

// Iteramos sobre cada uno de esos enlaces
anchors.forEach(function(anchor) {
  
  // Añadimos un evento de "click" a cada enlace
  anchor.addEventListener('click', function(e) {
    
    // Prevenimos el comportamiento por defecto del enlace (ir al destino de inmediato)
    e.preventDefault();
    
    // Obtenemos el valor del atributo href (el ID del destino)
    const targetId = anchor.getAttribute('href');
    
    // Encontramos el elemento al que queremos hacer scroll
    const targetElement = document.querySelector(targetId);
    
    // Hacemos el scroll con un pequeño ajuste de 80px hacia arriba
    window.scrollTo({
      top: targetElement.offsetTop - 80,
      behavior: 'smooth'  // Esto hace que el scroll sea suave
    });
  });
});




