// ===== CONFIGURATION & VARIABLES GLOBALES =====
const API_BASE = 'https://oyokai-formation-backend-production.up.railway.app/api';
let currentUser = null;
let currentToken = null;

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    
    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('formationForm').addEventListener('submit', handleFormationSubmit);
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    
    // Menu navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => navigateToSection(item.dataset.section));
    });
    
    // Auto-generate slug from title
    document.getElementById('formationTitle').addEventListener('input', function() {
        const slug = this.value.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        document.getElementById('formationSlug').value = slug;
    });
    
    // Fermeture des modales en cliquant à l'extérieur
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
});

// ===== AUTHENTIFICATION =====
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLogin();
        return;
    }
    
    currentToken = token;
    verifyToken();
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showAdmin();
        } else {
            localStorage.removeItem('adminToken');
            showLogin();
        }
    } catch (error) {
        console.error('Erreur vérification token:', error);
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const spinner = document.getElementById('loginSpinner');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    spinner.style.display = 'inline-block';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('adminToken', data.token);
            currentToken = data.token;
            currentUser = data.user;
            showAdmin();
        } else {
            showAlert('loginAlert', data.error, 'danger');
        }
    } catch (error) {
        showAlert('loginAlert', 'Erreur de connexion', 'danger');
    } finally {
        spinner.style.display = 'none';
        submitBtn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    currentToken = null;
    currentUser = null;
    showLogin();
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('adminContainer').style.display = 'none';
}

function showAdmin() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'flex';
    
    // Mettre à jour l'interface
    document.getElementById('userWelcome').textContent = `Bienvenue ${currentUser.first_name || currentUser.username}`;
    document.getElementById('currentUser').textContent = `${currentUser.first_name || currentUser.username} (${currentUser.role})`;
    
    // Charger le dashboard
    loadDashboard();
}

// ===== NAVIGATION =====
function navigateToSection(section) {
    // Mettre à jour les menus
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Mettre à jour les sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    
    // Mettre à jour le titre
    const titles = {
        dashboard: 'Dashboard',
        formations: 'Gestion des Formations',
        testimonials: 'Gestion des Témoignages',
        contacts: 'Messages de Contact',
        users: 'Utilisateurs Administrateurs',
        stats: 'Statistiques Avancées'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    // Charger le contenu
    switch(section) {
        case 'dashboard': loadDashboard(); break;
        case 'formations': loadFormations(); break;
        case 'testimonials': loadTestimonials(); break;
        case 'contacts': loadContacts(); break;
        case 'users': loadUsers(); break;
        case 'stats': loadStats(); break;
    }
}

// ===== API CALLS =====
async function apiCall(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`,
            ...options.headers
        }
    });
    
    if (response.status === 401) {
        logout();
        return null;
    }
    
    return await response.json();
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        const data = await apiCall('/admin/dashboard');
        if (data && data.success) {
            const stats = data.data;
            
            document.getElementById('totalFormations').textContent = stats.formations.total;
            document.getElementById('pendingTestimonials').textContent = stats.testimonials.pending;
            document.getElementById('unreadContacts').textContent = stats.contacts.unread;
            
            // Derniers contacts
            const contactsHtml = stats.recentContacts.map(contact => `
                <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                    <div>
                        <strong>${contact.name}</strong> - ${contact.email}<br>
                        <small>${contact.formation_interest || 'Demande générale'}</small>
                    </div>
                    <div>
                        <span class="badge badge-${contact.status === 'unread' ? 'warning' : 'secondary'}">
                            ${contact.status === 'unread' ? 'Non lu' : 'Lu'}
                        </span>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('recentContacts').innerHTML = contactsHtml || '<p>Aucun contact récent</p>';
        }
    } catch (error) {
        console.error('Erreur dashboard:', error);
    }
}

// ===== FORMATIONS =====
async function loadFormations() {
    const container = document.getElementById('formationsList');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
    
    try {
        const filter = document.getElementById('formationFilter').value;
        const data = await apiCall(`/admin/formations?status=${filter}`);
        
        if (data && data.success) {
            const formations = data.data;
            
            if (formations.length === 0) {
                container.innerHTML = '<p>Aucune formation trouvée</p>';
                return;
            }
            
            const tableHtml = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Titre</th>
                                <th>Catégorie</th>
                                <th>Durée</th>
                                <th>Prix</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${formations.map(formation => `
                                <tr>
                                    <td><strong>${formation.title}</strong></td>
                                    <td>${formation.category || '-'}</td>
                                    <td>${formation.duration || '-'}</td>
                                    <td>${formation.price_display || '-'}</td>
                                    <td>
                                        <span class="badge badge-${formation.active ? 'success' : 'secondary'}">
                                            ${formation.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" onclick="editFormation(${formation.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-${formation.active ? 'warning' : 'success'} btn-sm" 
                                                onclick="toggleFormation(${formation.id})">
                                            <i class="fas fa-${formation.active ? 'pause' : 'play'}"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteFormation(${formation.id}, '${formation.title}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = tableHtml;
        }
    } catch (error) {
        container.innerHTML = '<p class="alert alert-danger">Erreur lors du chargement</p>';
    }
}

function openFormationModal(formation = null) {
    const modal = document.getElementById('formationModal');
    const form = document.getElementById('formationForm');
    
    if (formation) {
        document.getElementById('formationModalTitle').textContent = 'Modifier la Formation';
        document.getElementById('formationId').value = formation.id;
        document.getElementById('formationTitle').value = formation.title;
        document.getElementById('formationSlug').value = formation.slug;
        document.getElementById('formationCategory').value = formation.category || '';
        document.getElementById('formationDuration').value = formation.duration || '';
        document.getElementById('formationPrice').value = formation.price_display || '';
        document.getElementById('formationShortDesc').value = formation.short_description || '';
        document.getElementById('formationFullDesc').value = formation.full_description || '';
        document.getElementById('formationObjectives').value = formation.objectives || '';
        document.getElementById('formationTargetAudience').value = formation.target_audience || '';
        document.getElementById('formationPrerequisites').value = formation.prerequisites || '';
        document.getElementById('formationSortOrder').value = formation.sort_order || 0;
        document.getElementById('formationActive').checked = formation.active;
    } else {
        document.getElementById('formationModalTitle').textContent = 'Nouvelle Formation';
        form.reset();
        document.getElementById('formationId').value = '';
        document.getElementById('formationActive').checked = true;
        document.getElementById('formationSortOrder').value = 0;
    }
    
    modal.classList.add('show');
}

function closeFormationModal() {
    document.getElementById('formationModal').classList.remove('show');
}

async function handleFormationSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('formationTitle').value,
        slug: document.getElementById('formationSlug').value,
        category: document.getElementById('formationCategory').value,
        duration: document.getElementById('formationDuration').value,
        price_display: document.getElementById('formationPrice').value,
        short_description: document.getElementById('formationShortDesc').value,
        full_description: document.getElementById('formationFullDesc').value,
        objectives: document.getElementById('formationObjectives').value,
        target_audience: document.getElementById('formationTargetAudience').value,
        prerequisites: document.getElementById('formationPrerequisites').value,
        sort_order: parseInt(document.getElementById('formationSortOrder').value) || 0,
        active: document.getElementById('formationActive').checked
    };
    
    const formationId = document.getElementById('formationId').value;
    const isEdit = !!formationId;
    
    try {
        const endpoint = isEdit ? `/admin/formations/${formationId}` : '/admin/formations';
        const method = isEdit ? 'PUT' : 'POST';
        
        const data = await apiCall(endpoint, {
            method: method,
            body: JSON.stringify(formData)
        });
        
        if (data && data.success) {
            closeFormationModal();
            loadFormations();
            showAlert('formationsAlert', data.message, 'success');
        } else {
            showAlert('formationAlert', data.error, 'danger');
        }
    } catch (error) {
        showAlert('formationAlert', 'Erreur lors de l\'enregistrement', 'danger');
    }
}

async function editFormation(id) {
    try {
        const data = await apiCall(`/admin/formations/${id}`);
        if (data && data.success) {
            openFormationModal(data.data);
        }
    } catch (error) {
        console.error('Erreur chargement formation:', error);
    }
}

async function toggleFormation(id) {
    try {
        const data = await apiCall(`/admin/formations/${id}/toggle`, { method: 'PATCH' });
        if (data && data.success) {
            loadFormations();
            showAlert('formationsAlert', data.message, 'success');
        }
    } catch (error) {
        console.error('Erreur toggle formation:', error);
    }
}

async function deleteFormation(id, title) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la formation "${title}" ?`)) {
        return;
    }
    
    try {
        const data = await apiCall(`/admin/formations/${id}`, { method: 'DELETE' });
        if (data && data.success) {
            loadFormations();
            showAlert('formationsAlert', data.message, 'success');
        }
    } catch (error) {
        console.error('Erreur suppression formation:', error);
    }
}

// ===== TÉMOIGNAGES =====
async function loadTestimonials() {
    const container = document.getElementById('testimonialsList');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
    
    try {
        const data = await apiCall('/testimonials/all');
        
        if (data && data.success) {
            const testimonials = data.data;
            
            if (testimonials.length === 0) {
                container.innerHTML = '<p>Aucun témoignage trouvé</p>';
                return;
            }
            
            const tableHtml = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Formation</th>
                                <th>Note</th>
                                <th>Message</th>
                                <th>Statut</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${testimonials.map(testimonial => `
                                <tr>
                                    <td><strong>${testimonial.first_name} ${testimonial.last_name}</strong></td>
                                    <td>${testimonial.formation}</td>
                                    <td>${'★'.repeat(testimonial.rating)}${'☆'.repeat(5-testimonial.rating)}</td>
                                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                                        ${testimonial.message.substring(0, 100)}${testimonial.message.length > 100 ? '...' : ''}
                                    </td>
                                    <td>
                                        <span class="badge badge-${
                                            testimonial.status === 'approved' ? 'success' : 
                                            testimonial.status === 'rejected' ? 'danger' : 'warning'
                                        }">
                                            ${testimonial.status === 'approved' ? 'Approuvé' : 
                                              testimonial.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                        </span>
                                    </td>
                                    <td>${new Date(testimonial.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        ${testimonial.status === 'pending' ? `
                                            <button class="btn btn-success btn-sm" onclick="approveTestimonial(${testimonial.id})">
                                                <i class="fas fa-check"></i>
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick="rejectTestimonial(${testimonial.id})">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        ` : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = tableHtml;
        }
    } catch (error) {
        container.innerHTML = '<p class="alert alert-danger">Erreur lors du chargement</p>';
    }
}

async function approveTestimonial(id) {
    try {
        const data = await apiCall(`/testimonials/${id}/approve`, { method: 'PUT' });
        if (data && data.success) {
            loadTestimonials();
            showAlert('testimonialsAlert', data.message, 'success');
        }
    } catch (error) {
        console.error('Erreur approbation témoignage:', error);
    }
}

async function rejectTestimonial(id) {
    try {
        const data = await apiCall(`/testimonials/${id}/reject`, { method: 'PUT' });
        if (data && data.success) {
            loadTestimonials();
            showAlert('testimonialsAlert', data.message, 'success');
        }
    } catch (error) {
        console.error('Erreur rejet témoignage:', error);
    }
}

// ===== CONTACTS =====
async function loadContacts() {
    const container = document.getElementById('contactsList');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
    
    try {
        const data = await apiCall('/contact/all');
        
        if (data && data.success) {
            const contacts = data.data;
            
            if (contacts.length === 0) {
                container.innerHTML = '<p>Aucun message trouvé</p>';
                return;
            }
            
            const tableHtml = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Formation d'intérêt</th>
                                <th>Message</th>
                                <th>Statut</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${contacts.map(contact => `
                                <tr style="${contact.status === 'unread' ? 'background-color: #fff3cd;' : ''}">
                                    <td><strong>${contact.name}</strong></td>
                                    <td>${contact.email}</td>
                                    <td>${contact.formation_interest || '-'}</td>
                                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                                        ${contact.message.substring(0, 100)}${contact.message.length > 100 ? '...' : ''}
                                    </td>
                                    <td>
                                        <span class="badge badge-${contact.status === 'unread' ? 'warning' : 'secondary'}">
                                            ${contact.status === 'unread' ? 'Non lu' : 'Lu'}
                                        </span>
                                    </td>
                                    <td>${new Date(contact.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        ${contact.status === 'unread' ? `
                                            <button class="btn btn-primary btn-sm" onclick="markContactAsRead(${contact.id})">
                                                <i class="fas fa-check"></i> Marquer lu
                                            </button>
                                        ` : ''}
                                        <a href="mailto:${contact.email}" class="btn btn-secondary btn-sm">
                                            <i class="fas fa-reply"></i>
                                        </a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = tableHtml;
        }
    } catch (error) {
        container.innerHTML = '<p class="alert alert-danger">Erreur lors du chargement</p>';
    }
}

async function markContactAsRead(id) {
    try {
        const data = await apiCall(`/contact/${id}/read`, { method: 'PUT' });
        if (data && data.success) {
            loadContacts();
            loadDashboard(); // Mettre à jour les compteurs
        }
    } catch (error) {
        console.error('Erreur marquage contact:', error);
    }
}

// ===== UTILISATEURS =====
async function loadUsers() {
    const container = document.getElementById('usersList');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
    
    try {
        const data = await apiCall('/admin/users');
        
        if (data && data.success) {
            const users = data.data;
            
            const tableHtml = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom d'utilisateur</th>
                                <th>Email</th>
                                <th>Nom complet</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Dernière connexion</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td><strong>${user.username}</strong></td>
                                    <td>${user.email}</td>
                                    <td>${user.first_name || ''} ${user.last_name || ''}</td>
                                    <td>
                                        <span class="badge badge-primary">${user.role}</span>
                                    </td>
                                    <td>
                                        <span class="badge badge-${user.active ? 'success' : 'secondary'}">
                                            ${user.active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td>${user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'}</td>
                                    <td>
                                        ${user.id !== currentUser.id ? `
                                            <button class="btn btn-${user.active ? 'warning' : 'success'} btn-sm" 
                                                    onclick="toggleUser(${user.id})">
                                                <i class="fas fa-${user.active ? 'pause' : 'play'}"></i>
                                                ${user.active ? 'Désactiver' : 'Activer'}
                                            </button>
                                        ` : '<em>Votre compte</em>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            container.innerHTML = tableHtml;
        }
    } catch (error) {
        container.innerHTML = '<p class="alert alert-danger">Erreur lors du chargement</p>';
    }
}

function openUserModal() {
    document.getElementById('userModal').classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

async function handleUserSubmit(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        first_name: document.getElementById('userFirstName').value,
        last_name: document.getElementById('userLastName').value,
        role: document.getElementById('userRole').value
    };
    
    try {
        const data = await apiCall('/admin/users', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (data && data.success) {
            closeUserModal();
            loadUsers();
            showAlert('usersAlert', data.message, 'success');
        } else {
            showAlert('userAlert', data.error, 'danger');
        }
    } catch (error) {
        showAlert('userAlert', 'Erreur lors de la création', 'danger');
    }
}

async function toggleUser(id) {
    try {
        const data = await apiCall(`/admin/users/${id}/toggle`, { method: 'PATCH' });
        if (data && data.success) {
            loadUsers();
            showAlert('usersAlert', data.message, 'success');
        }
    } catch (error) {
        console.error('Erreur toggle utilisateur:', error);
    }
}

// ===== STATISTIQUES =====
async function loadStats() {
    const container = document.getElementById('statsContent');
    container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
    
    try {
        const period = document.getElementById('statsPeriod').value;
        const data = await apiCall(`/admin/stats?period=${period}`);
        
        if (data && data.success) {
            const stats = data.data;
            
            let html = `
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.contactsEvolution.reduce((sum, day) => sum + parseInt(day.count), 0)}</div>
                        <div class="stat-label">Contacts sur ${period} jours</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.testimonialsEvolution.reduce((sum, day) => sum + parseInt(day.count), 0)}</div>
                        <div class="stat-label">Témoignages sur ${period} jours</div>
                    </div>
                </div>
            `;
            
            if (stats.topFormationsInterest.length > 0) {
                html += `
                    <h4>Formations les plus demandées</h4>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr><th>Formation</th><th>Demandes</th></tr>
                            </thead>
                            <tbody>
                                ${stats.topFormationsInterest.map(item => `
                                    <tr>
                                        <td>${item.formation_interest}</td>
                                        <td><strong>${item.count}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        }
    } catch (error) {
        container.innerHTML = '<p class="alert alert-danger">Erreur lors du chargement</p>';
    }
}

// ===== UTILITAIRES =====
function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }
}