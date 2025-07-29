// Animation au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Header au scroll
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 100) {
        header.classList.add('header-scrolled');
    } else {
        header.classList.remove('header-scrolled');
    }
});

// Navigation smooth
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Système de carrousel pour les témoignages
let currentSlide = 0;
const slider = document.querySelector('.testimonials-slider');
const slides = document.querySelectorAll('.testimonials-slide');
const indicators = document.querySelectorAll('.indicator');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function updateSlider() {
    if (slider && slides.length > 0) {
        slider.style.transform = `translateX(-${currentSlide * 100}%)`;
        
        // Mettre à jour les indicateurs
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentSlide);
        });
        
        // Mettre à jour les boutons
        if (prevBtn && nextBtn) {
            prevBtn.disabled = currentSlide === 0;
            nextBtn.disabled = currentSlide === slides.length - 1;
        }
    }
}

function nextSlide() {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlider();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlider();
    }
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    updateSlider();
}

// Event listeners pour les contrôles
if (nextBtn) nextBtn.addEventListener('click', nextSlide);
if (prevBtn) prevBtn.addEventListener('click', prevSlide);

indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => goToSlide(index));
});

// Initialiser le slider
updateSlider();

// Support tactile pour mobile
let startX = 0;
let currentX = 0;
let isDragging = false;

if (slider) {
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    slider.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
    });

    slider.addEventListener('touchend', () => {
        if (!isDragging) return;
        
        const diff = startX - currentX;
        if (Math.abs(diff) > 50) { // Seuil minimum pour déclencher le swipe
            if (diff > 0 && currentSlide < slides.length - 1) {
                nextSlide();
            } else if (diff < 0 && currentSlide > 0) {
                prevSlide();
            }
        }
        isDragging = false;
    });
}

// Système de notation par étoiles
document.querySelectorAll('.rating-star').forEach(star => {
    star.addEventListener('click', function() {
        const rating = parseInt(this.dataset.rating);
        const stars = this.parentNode.querySelectorAll('.rating-star');
        
        stars.forEach((s, index) => {
            if (index < rating) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    });
    
    star.addEventListener('mouseover', function() {
        const rating = parseInt(this.dataset.rating);
        const stars = this.parentNode.querySelectorAll('.rating-star');
        
        stars.forEach((s, index) => {
            s.style.color = index < rating ? '#B8E986' : 'rgba(255,255,255,0.3)';
        });
    });
});

// Réinitialiser les étoiles au mouseout
const ratingStars = document.querySelector('.rating-stars');
if (ratingStars) {
    ratingStars.addEventListener('mouseleave', function() {
        const stars = this.querySelectorAll('.rating-star');
        stars.forEach(star => {
            star.style.color = star.classList.contains('active') ? '#B8E986' : 'rgba(255,255,255,0.3)';
        });
    });
}

// Gestion du formulaire de témoignage
const testimonialForm = document.querySelector('.testimonial-form');
if (testimonialForm) {
    testimonialForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const activeStars = document.querySelectorAll('.rating-star.active').length;
        if (activeStars === 0) {
            alert('Veuillez donner une note en cliquant sur les étoiles.');
            return;
        }
        
        alert('Merci pour votre témoignage ! Il sera publié après validation.');
        this.reset();
        
        // Réinitialiser les étoiles
        document.querySelectorAll('.rating-star').forEach(star => {
            star.classList.remove('active');
            star.style.color = 'rgba(255,255,255,0.3)';
        });
    });
}

// Animation des statistiques
const animateStats = () => {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        const increment = target / 100;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current) + (stat.textContent.includes('%') ? '%' : stat.textContent.includes('+') ? '+' : '');
        }, 20);
    });
};

// Observer pour les statistiques
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            statsObserver.unobserve(entry.target);
        }
    });
});

const aboutSection = document.querySelector('.about');
if (aboutSection) {
    statsObserver.observe(aboutSection);
}

// Gestion du formulaire de contact
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Merci pour votre message ! Nous vous recontacterons bientôt.');
        this.reset();
    });
}

// Charger le logo
async function loadLogo() {
    const logoImg = document.getElementById('logo-img');
    if (!logoImg) return;
    
    try {
        // Essayer les noms de fichiers les plus probables
        const fileNames = [
            'images/logo.png',
            'images/logo.jpg', 
            'images/logo.jpeg',
            'images/oyokai.png',
            'images/oyokai.jpg'
        ];
        
        for (const fileName of fileNames) {
            try {
                // Tester si l'image existe
                const img = new Image();
                img.onload = () => {
                    logoImg.src = fileName;
                    console.log(`Logo chargé avec succès: ${fileName}`);
                };
                img.onerror = () => {
                    throw new Error(`Impossible de charger: ${fileName}`);
                };
                img.src = fileName;
                return; // Sortir si succès
            } catch (error) {
                console.log(`Échec de chargement: ${fileName}`);
                continue;
            }
        }
        
        // Si aucun fichier n'a été trouvé, afficher le texte
        throw new Error('Aucun fichier logo trouvé');
        
    } catch (error) {
        console.log('Logo non trouvé, utilisation du texte par défaut');
        const logoContainer = document.querySelector('.logo');
        if (logoContainer) {
            logoContainer.innerHTML = '<span style="font-size: 2rem; font-weight: bold; color: white;">OYOKAÏ</span>';
        }
    }
}

// Charger le logo au démarrage
document.addEventListener('DOMContentLoaded', loadLogo);