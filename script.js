// ========================================
// NAVIGATION & MENU MOBILE
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    // Toggle mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 30px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        }
    });
});

// ========================================
// SCROLL ANIMATIONS
// ========================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

// Observe all task cards, gallery items and stat cards
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.task-card, .gallery-item, .stat-card');
    elements.forEach(el => {
        el.classList.add('scroll-reveal');
        observer.observe(el);
    });
});

// ========================================
// GLOBAL FIREBASE UTILITIES
// ========================================
let database = null;
let firebaseFunctions = null;
let isFirebaseReady = false;

// Initialiser Firebase
async function initFirebase() {
    if (isFirebaseReady) {
        console.log('Firebase déjà initialisé');
        return true;
    }
    
    try {
        console.log('🔄 Initialisation de Firebase...');
        
        // Importer le module Firebase
        const firebaseModule = await import('./firebase-config.js');
        const { database: fbDatabase } = firebaseModule;
        
        // Importer les fonctions Firebase
        const { 
            ref, set, get, update, remove, onValue 
        } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js");
        
        // Stocker les références
        database = fbDatabase;
        firebaseFunctions = { ref, set, get, update, remove, onValue };
        
        if (!database) {
            throw new Error('Database Firebase non disponible');
        }
        
        console.log('✅ Firebase initialisé avec succès');
        isFirebaseReady = true;
        return true;
        
    } catch (error) {
        console.error('❌ Erreur d\'initialisation Firebase:', error);
        return false;
    }
}

// Vérifier que Firebase est prêt
async function ensureFirebaseReady() {
    if (!isFirebaseReady) {
        return await initFirebase();
    }
    return true;
}

// ========================================
// REGISTRATION FORM
// ========================================
const registrationForm = document.getElementById('registration-form');
const successMessage = document.getElementById('success-message');

if (registrationForm) {
    registrationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('📝 Soumission du formulaire...');
        
        try {
            // Initialiser Firebase
            const firebaseReady = await ensureFirebaseReady();
            if (!firebaseReady) {
                alert('Erreur de connexion à la base de données. Veuillez réessayer.');
                return;
            }
            
            // Get form data
            const formData = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString('fr-FR'),
                timestamp: Date.now(),
                nom: document.getElementById('nom').value,
                prenom: document.getElementById('prenom').value,
                filiere: document.getElementById('filiere').value,
                annee: document.getElementById('annee').value,
                telephone: document.getElementById('telephone').value,
                email: document.getElementById('email').value,
                interet: document.getElementById('interet').value,
                validated: false
            };
            
            // Save to Firebase
            await firebaseFunctions.set(firebaseFunctions.ref(database, 'registrations/' + formData.id), formData);
            
            // Show success message
            successMessage.style.display = 'block';
            
            // Reset form
            registrationForm.reset();
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
            
            // Scroll to success message
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        } catch (error) {
            console.error('Error saving registration:', error);
            alert('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.');
        }
    });
}

// ========================================
// ADMIN PANEL - PASSWORD MANAGEMENT
// ========================================
async function getAdminPassword() {
    try {
        if (!database) {
            await initFirebase();
        }
        
        const adminPasswordRef = firebaseFunctions.ref(database, 'adminPassword');
        const snapshot = await firebaseFunctions.get(adminPasswordRef);
        
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            // Créer le mot de passe par défaut
            await firebaseFunctions.set(adminPasswordRef, 'cmc2024');
            return 'cmc2024';
        }
    } catch (error) {
        console.error('Error getting admin password:', error);
        return 'cmc2024';
    }
}

// Persist new admin password to Firebase
async function setAdminPassword(newPass) {
    try {
        await ensureFirebaseReady();
        if (!firebaseFunctions || !database) throw new Error('Firebase non prêt');
        await firebaseFunctions.set(firebaseFunctions.ref(database, 'adminPassword'), newPass);
        console.log('✅ Mot de passe admin mis à jour dans Firebase');
    } catch (error) {
        console.error('Error setting admin password:', error);
        throw error;
    }
}

// setAdminPassword removed (change-password UI removed)

// ========================================
// ADMIN PANEL - LOGIN
// ========================================
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginError = document.getElementById('login-error');

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const password = document.getElementById('admin-password').value;
        const adminPassword = await getAdminPassword();

        if (password === adminPassword) {
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            
            // Initialiser les fonctionnalités admin
            await loadRegistrations();
            setupSearch();
            setupChangePasswordUI();
            setupRegistrationListener();
            
            // Clear error
            if (loginError) {
                loginError.textContent = '';
                loginError.classList.remove('show');
            }
        } else {
            loginError.textContent = '❌ Mot de passe incorrecte';
            loginError.classList.add('show');
        }
    });
}

// ========================================
// ADMIN PANEL - LOGOUT
// ========================================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        loginSection.style.display = 'flex';
        adminDashboard.style.display = 'none';
        document.getElementById('admin-password').value = '';
        if (loginError) {
            loginError.textContent = '';
            loginError.classList.remove('show');
        }
    });
}

// Change-password UI and logic removed

// ========================================
// ADMIN PANEL - LOAD REGISTRATIONS
// ========================================
async function loadRegistrations() {
    try {
        // S'assurer que Firebase est initialisé
        await ensureFirebaseReady();
        
        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'registrations'));
        const registrations = snapshot.exists() ? snapshot.val() : {};
        const registrationsArray = Object.values(registrations);
        
        const tableBody = document.getElementById('table-body');
        const totalRegistrations = document.getElementById('total-registrations');
        const noDataMessage = document.getElementById('no-data-message');
        
        // Update statistics
        if (totalRegistrations) {
            totalRegistrations.textContent = registrationsArray.length;
        }
        
        // Clear table
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        
        // Check if there are registrations
        if (registrationsArray.length === 0) {
            if (noDataMessage) {
                noDataMessage.style.display = 'block';
            }
            return;
        } else {
            if (noDataMessage) {
                noDataMessage.style.display = 'none';
            }
        }
        
        // Sort by timestamp (most recent first) and populate table
        registrationsArray
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(reg => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reg.date || ''}</td>
                    <td>${reg.nom || ''}</td>
                    <td>${reg.prenom || ''}</td>
                    <td>${reg.filiere || ''}</td>
                    <td>${reg.annee || ''}</td>
                    <td>${reg.telephone || ''}</td>
                    <td>${reg.email || ''}</td>
                    <td>${reg.interet || ''}</td>
                    <td>
                        <button class="validate-btn ${reg.validated ? 'valid' : ''}" onclick="validateRegistration('${reg.id}')">
                            ${reg.validated ? 'Validé' : 'Non validé'}
                        </button>
                        <button class="delete-btn" onclick="deleteRegistration('${reg.id}')">
                            🗑️ Supprimer
                        </button>
                    </td>
                `;
                if (tableBody) {
                    tableBody.appendChild(row);
                }
            });
            
        // Initialiser la recherche après chargement des données
        setTimeout(setupSearch, 100);
        
    } catch (error) {
        console.error('Error loading registrations:', error);
        const noDataMessage = document.getElementById('no-data-message');
        if (noDataMessage) {
            noDataMessage.style.display = 'block';
            noDataMessage.textContent = 'Erreur de chargement des données';
        }
    }
}

// ========================================
// SETUP REAL-TIME LISTENER FOR REGISTRATIONS
// ========================================
function setupRegistrationListener() {
    if (!isFirebaseReady || !database) return;
    
    try {
        const registrationsRef = firebaseFunctions.ref(database, 'registrations');
        firebaseFunctions.onValue(registrationsRef, () => {
            loadRegistrations();
        });
    } catch (error) {
        console.error('Error setting up registration listener:', error);
    }
}

// ========================================
// ADMIN PANEL - DELETE REGISTRATION
// ========================================
window.deleteRegistration = async function(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
        try {
            await ensureFirebaseReady();
            await firebaseFunctions.remove(firebaseFunctions.ref(database, 'registrations/' + id));
        } catch (error) {
            console.error('Error deleting registration:', error);
            alert('Erreur lors de la suppression');
        }
    }
};

// ========================================
// ADMIN PANEL - VALIDATE REGISTRATION
// ========================================
window.validateRegistration = async function(id) {
    try {
        await ensureFirebaseReady();
        
        const regRef = firebaseFunctions.ref(database, 'registrations/' + id);
        const snapshot = await firebaseFunctions.get(regRef);
        
        if (snapshot.exists()) {
            const currentData = snapshot.val();
            const updatedData = {
                ...currentData,
                validated: !currentData.validated
            };
            
            await firebaseFunctions.update(regRef, updatedData);
        }
    } catch (error) {
        console.error('Error validating registration:', error);
        alert('Erreur lors de la validation');
    }
};

// ========================================
// ADMIN PANEL - SEARCH FUNCTION - CORRIGÉ
// ========================================
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    
    if (searchInput) {
        // Recherche en temps réel
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#table-body tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Gérer le message "aucune donnée"
            const noDataMessage = document.getElementById('no-data-message');
            if (noDataMessage) {
                const visibleRows = Array.from(rows).filter(row => row.style.display !== 'none');
                if (searchTerm && visibleRows.length === 0) {
                    noDataMessage.style.display = 'block';
                    noDataMessage.textContent = 'Aucun résultat trouvé pour "' + searchTerm + '"';
                } else if (!searchTerm && rows.length === 0) {
                    noDataMessage.style.display = 'block';
                    noDataMessage.textContent = 'Aucune inscription enregistrée';
                } else {
                    noDataMessage.style.display = 'none';
                }
            }
        });
    }
}

// Initialiser la recherche au chargement
document.addEventListener('DOMContentLoaded', setupSearch);

// ========================================
// ADMIN PANEL - EXPORT CSV
// ========================================
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', async function() {
        try {
            await ensureFirebaseReady();
            
            const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'registrations'));
            const registrations = snapshot.exists() ? snapshot.val() : {};
            const registrationsArray = Object.values(registrations);
            
            if (registrationsArray.length === 0) {
                alert('Aucune donnée à exporter');
                return;
            }
            
            // Create CSV content
            let csv = 'Date,Nom,Prénom,Filière,Année,Téléphone,Email,Intérêt,Validé\n';
            
            registrationsArray.forEach(reg => {
                csv += `${reg.date},${reg.nom},${reg.prenom},${reg.filiere},${reg.annee},${reg.telephone},${reg.email},${reg.interet},${reg.validated ? 'Oui' : 'Non'}\n`;
            });
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `inscriptions_cmc_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Erreur lors de l\'exportation');
        }
    });
}

// Additional setAdminPassword removed (change-password functionality deleted)

// ========================================
// PASSWORD VISIBILITY TOGGLES
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // toggle for login admin password
    const adminToggle = document.getElementById('admin-pass-toggle');
    const adminInput = document.getElementById('admin-password');

    if (adminToggle && adminInput) {
        adminToggle.addEventListener('click', () => {
            const t = adminInput.getAttribute('type') === 'password' ? 'text' : 'password';
            adminInput.setAttribute('type', t);
            adminToggle.classList.toggle('active');
        });
    }

    // toggles for change-password inputs
    document.querySelectorAll('.password-toggle[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            const newType = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', newType);
            btn.classList.toggle('active');
        });
    });
});

// change-password helper references removed

// ========================================
// CHANGE PASSWORD UI & LOGIC
// ========================================
function setupChangePasswordUI() {
    const changeBtn = document.getElementById('change-pass-btn');
    const panel = document.getElementById('change-password-panel');
    const form = document.getElementById('change-password-form');
    const cancelBtn = document.getElementById('cancel-change');
    const msg = document.getElementById('change-pass-msg');

    if (!changeBtn || !panel || !form) {
        // If any of the UI elements missing, skip setup
        return;
    }

    // Ensure panel hidden
    panel.style.display = 'none';

    // Toggle panel on button click
    changeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        if (msg) { msg.textContent = ''; msg.className = ''; }
    });

    // Hide panel when clicking outside
    document.addEventListener('click', (e) => {
        if (panel.style.display !== 'block') return;
        if (!panel.contains(e.target) && e.target !== changeBtn) {
            panel.style.display = 'none';
        }
    });

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            panel.style.display = 'none';
            form.reset();
            if (msg) { msg.textContent = ''; msg.className = ''; }
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!msg) return;
        msg.textContent = '';
        msg.className = '';

        const current = (document.getElementById('current-pass') || {}).value?.trim() || '';
        const npass = (document.getElementById('new-pass') || {}).value?.trim() || '';
        const confirm = (document.getElementById('confirm-pass') || {}).value?.trim() || '';

        if (!current || !npass || !confirm) {
            msg.textContent = '❌ Tous les champs sont requis';
            msg.className = 'error';
            return;
        }

        if (npass.length < 6) {
            msg.textContent = '❌ Le nouveau mot de passe doit contenir au moins 6 caractères';
            msg.className = 'error';
            return;
        }

        if (npass !== confirm) {
            msg.textContent = '❌ La confirmation ne correspond pas';
            msg.className = 'error';
            return;
        }

        try {
            const adminPassword = await getAdminPassword();
            if (current !== adminPassword) {
                msg.textContent = '❌ Mot de passe actuel incorrect';
                msg.className = 'error';
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            await setAdminPassword(npass);

            msg.textContent = '✅ Mot de passe mis à jour avec succès';
            msg.className = 'success';

            setTimeout(() => {
                panel.style.display = 'none';
                form.reset();
                msg.textContent = '';
                msg.className = '';
                if (submitBtn) submitBtn.disabled = false;
            }, 1800);
        } catch (err) {
            console.error('Erreur changement mot de passe:', err);
            msg.textContent = '❌ Une erreur est survenue';
            msg.className = 'error';
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}

// ========================================
// SMOOTH SCROLL FOR ALL LINKS
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
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

// ========================================
// PARALLAX EFFECT ON HERO
// ========================================
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrolled = window.pageYOffset;
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ========================================
// ABOUT TITLE HIDE ON SCROLL
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const about = document.getElementById('about');
    const aboutTitle = document.querySelector('#about .section-title');

    if (!about || !aboutTitle) return;

    // Ensure initial visible state
    aboutTitle.style.opacity = '1';
    aboutTitle.style.transform = 'translateY(0)';

    const onScroll = () => {
        const rect = about.getBoundingClientRect();
        const triggerPoint = 120;

        if (rect.top <= triggerPoint && rect.bottom > triggerPoint) {
            aboutTitle.style.opacity = '0';
            aboutTitle.style.transform = 'translateY(-10px)';
        } else {
            aboutTitle.style.opacity = '1';
            aboutTitle.style.transform = 'translateY(0)';
        }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
});

// ========================================
// INITIALIZE FIREBASE ON ADMIN PAGE LOAD
// ========================================
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Admin page loaded');
        
        // Initialiser Firebase en arrière-plan
        setTimeout(async () => {
            try {
                await initFirebase();
                console.log('Firebase ready for admin page');
            } catch (error) {
                console.error('Error initializing Firebase for admin:', error);
            }
        }, 500);
    });
}

console.log('✅ Script.js loaded successfully');