// Configuration API
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
? 'http://localhost:3000/api' 
: 'https://oyokai-formation-backend-production.up.railway.app/api';

// Fonction utilitaire pour les appels API
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Erreur ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

// Fonction pour afficher les notifications
function showNotification(message, type = 'success') {
    // Supprimer les anciennes notifications
    const oldNotif = document.querySelector('.notification');
    if (oldNotif) oldNotif.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Styles pour la notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Ajouter les styles CSS pour les notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    }
    .notification-close:hover {
        opacity: 0.7;
    }
`;
document.head.appendChild(notificationStyles);

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

// Mise à jour de la fonction updateSlider pour gérer les slides dynamiques
function updateSlider() {
    const slider = document.querySelector('.testimonials-slider');
    const slides = document.querySelectorAll('.testimonials-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
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
            
            // Cacher les boutons s'il n'y a qu'une seule slide
            if (slides.length <= 1) {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            } else {
                prevBtn.style.display = 'block';
                nextBtn.style.display = 'block';
            }
        }
        
        // Cacher les indicateurs s'il n'y a qu'une seule slide
        const indicatorsContainer = document.querySelector('.slider-indicators');
        if (indicatorsContainer) {
            indicatorsContainer.style.display = slides.length <= 1 ? 'none' : 'flex';
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

// Gestion du formulaire de témoignage avec API
const testimonialForm = document.querySelector('.testimonial-form');
if (testimonialForm) {
    testimonialForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Vérifier la notation
        const activeStars = document.querySelectorAll('.rating-star.active').length;
        if (activeStars === 0) {
            showNotification('Veuillez donner une note en cliquant sur les étoiles.', 'error');
            return;
        }
        
        // Récupérer les données du formulaire - AMÉLIORATION
        const inputs = this.querySelectorAll('input');
        const select = this.querySelector('select');
        const textarea = this.querySelector('textarea');
        
        const firstName = inputs[0].value.trim(); // Premier input
        const lastName = inputs[1].value.trim();  // Deuxième input
        const formationValue = select.value;
        const message = textarea.value.trim();

        // Mapper les valeurs courtes vers les vraies valeurs
        const formationMap = {
            'management': 'Management et Leadership',
            'communication': 'Communication Professionnelle', 
            'digital': 'Transformation Digitale',
            'projet': 'Gestion de Projet',
            'personnel': 'Développement Personnel',
            'mesure': 'Formation sur Mesure'
        };

        const formation = formationMap[formationValue] || formationValue;
        
        console.log('Données récupérées:', { firstName, lastName, formation, message, rating: activeStars });
        
        // Validation côté client
        if (!firstName || !lastName || !formation || !message) {
            showNotification('Veuillez remplir tous les champs.', 'error');
            return;
        }
        
        // Préparer les données pour l'API
        const testimonialData = {
            first_name: firstName,
            last_name: lastName,
            formation: formation,
            rating: activeStars,
            message: message
        };
        
        console.log('Données envoyées à l\'API:', testimonialData);
        
        // Désactiver le bouton pendant l'envoi
        const submitBtn = this.querySelector('.submit-testimonial');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
        
        try {
            // Appel à l'API
            const response = await apiCall('/testimonials', {
                method: 'POST',
                body: JSON.stringify(testimonialData)
            });
            
            if (response.success) {
                showNotification('Merci pour votre témoignage ! Il sera publié après validation.', 'success');
                this.reset();
                
                // Réinitialiser les étoiles
                document.querySelectorAll('.rating-star').forEach(star => {
                    star.classList.remove('active');
                    star.style.color = 'rgba(255,255,255,0.3)';
                });
            }
        } catch (error) {
            showNotification('Erreur lors de l\'envoi du témoignage. Veuillez réessayer.', 'error');
            console.error('Erreur témoignage:', error);
        } finally {
            // Réactiver le bouton
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Gestion du formulaire de contact avec API
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Récupérer les données du formulaire
        const formData = new FormData(this);
        const contactData = {
            name: formData.get('nom') || this.querySelector('#nom').value,
            email: formData.get('email') || this.querySelector('#email').value,
            formation_interest: formData.get('formation') || this.querySelector('#formation').value,
            message: formData.get('message') || this.querySelector('#message').value
        };
        
        // Validation côté client
        if (!contactData.name || !contactData.email || !contactData.message) {
            showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
            return;
        }
        
        // Validation email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactData.email)) {
            showNotification('Veuillez saisir une adresse email valide.', 'error');
            return;
        }
        
        // Désactiver le bouton pendant l'envoi
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
        
        try {
            // Appel à l'API
            const response = await apiCall('/contact', {
                method: 'POST',
                body: JSON.stringify(contactData)
            });
            
            if (response.success) {
                showNotification('Votre message a été envoyé avec succès ! Nous vous recontacterons rapidement.', 'success');
                this.reset();
            }
        } catch (error) {
            showNotification('Erreur lors de l\'envoi du message. Veuillez réessayer.', 'error');
            console.error('Erreur contact:', error);
        } finally {
            // Réactiver le bouton
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Charger les témoignages approuvés depuis l'API
async function loadTestimonials() {
    try {
        const response = await apiCall('/testimonials/approved');
        
        if (response.success && response.data.length > 0) {
            generateTestimonialsHTML(response.data);
            console.log('Témoignages chargés:', response.data.length);
        } else {
            console.log('Aucun témoignage approuvé trouvé, utilisation des témoignages par défaut');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des témoignages:', error);
        // Continuer avec les témoignages statiques en cas d'erreur
    }
}

// Générer le HTML des témoignages dynamiquement
function generateTestimonialsHTML(testimonials) {
    const testimonialsSlider = document.querySelector('.testimonials-slider');
    if (!testimonialsSlider) return;
    
    // Organiser les témoignages par slides (3 par slide)
    const testimonialsPerSlide = 3;
    const slides = [];
    
    for (let i = 0; i < testimonials.length; i += testimonialsPerSlide) {
        slides.push(testimonials.slice(i, i + testimonialsPerSlide));
    }
    
    // Si pas assez de témoignages, créer au moins une slide
    if (slides.length === 0) return;
    
    // Générer le HTML pour chaque slide
    const slidesHTML = slides.map(slide => `
        <div class="testimonials-slide">
            ${slide.map(testimonial => `
                <div class="testimonial-card fade-in">
                    <p class="testimonial-text">${escapeHtml(testimonial.message)}</p>
                    <div class="testimonial-author">
                        <div class="author-info">
                            <h4>${escapeHtml(testimonial.first_name)} ${escapeHtml(testimonial.last_name)}</h4>
                            <p class="formation">${escapeHtml(testimonial.formation)}</p>
                            <div class="rating">
                                ${generateStars(testimonial.rating)}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
    
    // Remplacer le contenu du slider
    testimonialsSlider.innerHTML = slidesHTML;
    
    // Mettre à jour les indicateurs
    updateSliderIndicators(slides.length);
    
    // Réinitialiser le slider
    currentSlide = 0;
    updateSlider();
    
    // Réactiver les animations pour les nouveaux éléments
    const newCards = testimonialsSlider.querySelectorAll('.fade-in');
    newCards.forEach(card => {
        observer.observe(card);
    });
}

// Générer les étoiles pour la notation
function generateStars(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="star">${i <= rating ? '★' : '☆'}</span>`;
    }
    return starsHTML;
}

// Échapper les caractères HTML pour éviter les injections
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mettre à jour les indicateurs du slider selon le nombre de slides
function updateSliderIndicators(slideCount) {
    const indicatorsContainer = document.querySelector('.slider-indicators');
    if (!indicatorsContainer) return;
    
    // Générer les nouveaux indicateurs
    let indicatorsHTML = '';
    for (let i = 0; i < slideCount; i++) {
        indicatorsHTML += `<span class="indicator ${i === 0 ? 'active' : ''}" data-slide="${i}"></span>`;
    }
    
    indicatorsContainer.innerHTML = indicatorsHTML;
    
    // Réattacher les event listeners
    const indicators = indicatorsContainer.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToSlide(index));
    });
    
    // Mettre à jour les variables globales
    window.slides = document.querySelectorAll('.testimonials-slide');
}

// Fonction utilitaire pour recharger les témoignages (utile pour les tests)
window.reloadTestimonials = function() {
    loadTestimonials();
};

// Charger les formations depuis l'API et mettre à jour le DOM
async function loadFormations() {
    try {
        const response = await apiCall('/formations');
        
        if (response.success && response.data.length > 0) {
            updateFormationsGrid(response.data);
            updateFormationSelects(response.data);
            console.log('Formations chargées:', response.data.length);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des formations:', error);
        // Garder les formations statiques en cas d'erreur
    }
}

// Mettre à jour la grille des formations
function updateFormationsGrid(formations) {
    const formationsGrid = document.querySelector('.formations-grid');
    if (!formationsGrid) return;
    
    // Créer le HTML pour chaque formation
    const formationsHTML = formations.map(formation => `
        <div class="formation-card fade-in">
            <div class="card-content">
                <h3>${formation.title}</h3>
                <p>${formation.short_description}</p>
                <div class="card-footer">
                    <span class="duration">${formation.duration}</span>
                    <span class="price">${formation.price_display}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Remplacer le contenu
    formationsGrid.innerHTML = formationsHTML;
    
    // Réactiver les animations
    const newCards = formationsGrid.querySelectorAll('.fade-in');
    newCards.forEach(card => {
        observer.observe(card);
    });
}

// Mettre à jour les listes déroulantes des formulaires
function updateFormationSelects(formations) {
    const selects = document.querySelectorAll('select[name="formation"], select[name="formation_interest"]');
    
    selects.forEach(select => {
        // Garder la première option (vide)
        const firstOption = select.querySelector('option[value=""]');
        select.innerHTML = '';
        
        if (firstOption) {
            select.appendChild(firstOption);
        }
        
        // Ajouter les formations depuis l'API
        formations.forEach(formation => {
            const option = document.createElement('option');
            option.value = formation.title;
            option.textContent = formation.title;
            select.appendChild(option);
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

// Charger le logo
function loadLogo() {
    const logoImg = document.getElementById('logo-img');
    if (!logoImg) return;
    
    logoImg.onerror = function() {
        console.log('Logo non trouvé, utilisation du texte par défaut');
        const logoContainer = document.querySelector('.logo');
        if (logoContainer) {
            logoContainer.innerHTML = '<span style="font-size: 2rem; font-weight: bold; color: white;">OYOKAÏ</span>';
        }
    };
    
    logoImg.onload = function() {
        console.log('Logo chargé avec succès!');
    };
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    loadLogo();
    loadTestimonials();
    loadFormations(); // Nouveau !
    
    // Log pour vérifier la connexion API
    console.log('🔗 API configurée sur:', API_BASE_URL);
});