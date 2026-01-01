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
// REGISTRATION FORM
// ========================================
const registrationForm = document.getElementById('registration-form');
const successMessage = document.getElementById('success-message');

if (registrationForm) {
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            id: Date.now(),
            date: new Date().toLocaleDateString('fr-FR'),
            nom: document.getElementById('nom').value,
            prenom: document.getElementById('prenom').value,
            filiere: document.getElementById('filiere').value,
            annee: document.getElementById('annee').value,
            telephone: document.getElementById('telephone').value,
            email: document.getElementById('email').value,
                interet: document.getElementById('interet').value,
                validated: false
        };
        
        // Get existing registrations or initialize empty array
        let registrations = JSON.parse(localStorage.getItem('registrations')) || [];
        
        // Add new registration
        registrations.push(formData);
        
        // Save to localStorage
        localStorage.setItem('registrations', JSON.stringify(registrations));
        
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
    });
}

// ========================================
// ADMIN PANEL - LOGIN (uses persisted admin password)
// ========================================
function getAdminPassword() {
    return localStorage.getItem('adminPassword') || 'cmc2024';
}

function setAdminPassword(newPass) {
    localStorage.setItem('adminPassword', newPass);
}

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginError = document.getElementById('login-error');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const password = document.getElementById('admin-password').value;

        if (password === getAdminPassword()) {
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            loadRegistrations();
            // clear previous error if any
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
        loginError.textContent = '';
    });
}

// ========================================
// CHANGE PASSWORD UI & LOGIC
// ========================================
function initChangePasswordUI() {
    const changeBtn = document.getElementById('change-pass-btn');
    const panel = document.getElementById('change-password-panel');
    const form = document.getElementById('change-password-form');
    const cancelBtn = document.getElementById('cancel-change');
    const msg = document.getElementById('change-pass-msg');

    if (!changeBtn || !panel || !form || !msg) return;

    changeBtn.addEventListener('click', () => {
        panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
        msg.textContent = '';
        msg.className = '';
    });

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            panel.style.display = 'none';
            try { form.reset(); } catch (e) {}
            msg.textContent = '';
            msg.className = '';
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
            const current = (document.getElementById('current-pass').value || '').trim();
            const npass = (document.getElementById('new-pass').value || '').trim();
            const confirm = (document.getElementById('confirm-pass').value || '').trim();

            msg.className = '';

            if (current !== getAdminPassword()) {
                msg.textContent = '❌ Mot de passe actuel incorrecte.';
                msg.className = 'error';
                return;
            }

            if (npass.length < 4) {
                msg.textContent = '❌ Le nouveau mot de passe doit contenir au moins 4 caractères.';
                msg.className = 'error';
                return;
            }

            if (npass !== confirm) {
                msg.textContent = '❌ La confirmation ne correspond pas.';
                msg.className = 'error';
                return;
            }

            setAdminPassword(npass);
            msg.textContent = '✅ Mot de passe mis à jour avec succès.';
            msg.className = 'success';
            form.reset();
            setTimeout(() => {
                panel.style.display = 'none';
                msg.textContent = '';
                msg.className = '';
            }, 1800);
        } catch (err) {
            console.error('change password error', err);
            msg.textContent = '❌ Une erreur est survenue.';
            msg.className = 'error';
        }
    });
}

document.addEventListener('DOMContentLoaded', initChangePasswordUI);
initChangePasswordUI();

// --- Debug helpers and delegated handlers ---
// Add delegated click handler to ensure toggle works even if elements
// are not present when specific init runs.
function debugLog(...args) {
    try { console.log('[CMC DEBUG]', ...args); } catch (e) {}
}

document.addEventListener('click', function (e) {
    const t = e.target;
    if (!t) return;

    // Toggle change password panel when clicking the button
    if (t.id === 'change-pass-btn' || (t.closest && t.closest('#change-pass-btn'))) {
        const panel = document.getElementById('change-password-panel');
        const msg = document.getElementById('change-pass-msg');
        debugLog('delegated click on change-pass-btn, panel=', !!panel);
        if (panel) {
            panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
        }
        if (msg) { msg.textContent = ''; msg.className = ''; }
    }

    // Handle cancel button
    if (t.id === 'cancel-change' || (t.closest && t.closest('#cancel-change'))) {
        const panel = document.getElementById('change-password-panel');
        const form = document.getElementById('change-password-form');
        const msg = document.getElementById('change-pass-msg');
        debugLog('delegated click on cancel-change');
        if (panel) panel.style.display = 'none';
        if (form) { try { form.reset(); } catch (err) {} }
        if (msg) { msg.textContent = ''; msg.className = ''; }
    }
});

// Delegated submit handler as a fallback
document.addEventListener('submit', function (e) {
    if (!e.target || e.target.id !== 'change-password-form') return;
    debugLog('delegated submit for change-password-form');
    e.preventDefault();

    try {
        const current = (document.getElementById('current-pass').value || '').trim();
        const npass = (document.getElementById('new-pass').value || '').trim();
        const confirm = (document.getElementById('confirm-pass').value || '').trim();
        const msg = document.getElementById('change-pass-msg');
        const panel = document.getElementById('change-password-panel');

        if (msg) msg.className = '';

        if (current !== getAdminPassword()) {
            if (msg) { msg.textContent = '❌ Mot de passe actuel incorrecte.'; msg.className = 'error'; }
            return;
        }

        if (npass.length < 4) {
            if (msg) { msg.textContent = '❌ Le nouveau mot de passe doit contenir au moins 4 caractères.'; msg.className = 'error'; }
            return;
        }

        if (npass !== confirm) {
            if (msg) { msg.textContent = '❌ La confirmation ne correspond pas.'; msg.className = 'error'; }
            return;
        }

        setAdminPassword(npass);
        if (msg) { msg.textContent = '✅ Mot de passe mis à jour avec succès.'; msg.className = 'success'; }
        try { e.target.reset(); } catch (err) {}
        setTimeout(() => {
            if (panel) panel.style.display = 'none';
            if (msg) { msg.textContent = ''; msg.className = ''; }
        }, 1800);
    } catch (err) {
        console.error('delegated change password error', err);
        const msg = document.getElementById('change-pass-msg');
        if (msg) { msg.textContent = '❌ Une erreur est survenue.'; msg.className = 'error'; }
    }
});

// ========================================
// PASSWORD VISIBILITY TOGGLES
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // toggle for login admin password (single toggle)
    const adminToggle = document.getElementById('admin-pass-toggle');
    const adminInput = document.getElementById('admin-password');

    if (adminToggle && adminInput) {
        adminToggle.addEventListener('click', () => {
            const t = adminInput.getAttribute('type') === 'password' ? 'text' : 'password';
            adminInput.setAttribute('type', t);
            adminToggle.classList.toggle('active');
        });
    }

    // toggles for change-password inputs (using data-target)
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

// ========================================
// ADMIN PANEL - LOAD REGISTRATIONS
// ========================================
function loadRegistrations() {
    const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    const tableBody = document.getElementById('table-body');
    const totalRegistrations = document.getElementById('total-registrations');
    const noDataMessage = document.getElementById('no-data-message');
    
    // Update statistics
    if (totalRegistrations) {
        totalRegistrations.textContent = registrations.length;
    }
    
    // Clear table
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    
    // Check if there are registrations
    if (registrations.length === 0) {
        if (noDataMessage) {
            noDataMessage.style.display = 'block';
        }
        return;
    } else {
        if (noDataMessage) {
            noDataMessage.style.display = 'none';
        }
    }
    
    // Populate table
    registrations.reverse().forEach(reg => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reg.date}</td>
            <td>${reg.nom}</td>
            <td>${reg.prenom}</td>
            <td>${reg.filiere}</td>
            <td>${reg.annee}</td>
            <td>${reg.telephone}</td>
            <td>${reg.email}</td>
            <td>${reg.interet}</td>
            <td>
                <button class="validate-btn ${reg.validated ? 'valid' : ''}" onclick="validateRegistration(${reg.id})">
                    ${reg.validated ? 'Valider' : 'non valider'}
                </button>
                <button class="delete-btn" onclick="deleteRegistration(${reg.id})">
                    🗑️ Supprimer
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ========================================
// ADMIN PANEL - DELETE REGISTRATION
// ========================================
function deleteRegistration(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
        let registrations = JSON.parse(localStorage.getItem('registrations')) || [];
        registrations = registrations.filter(reg => reg.id !== id);
        localStorage.setItem('registrations', JSON.stringify(registrations));
        loadRegistrations();
    }
}

// Toggle validation state for a registration and persist to localStorage
function validateRegistration(id) {
    let registrations = JSON.parse(localStorage.getItem('registrations')) || [];
    const idx = registrations.findIndex(r => r.id === id);
    if (idx === -1) return;

    // Toggle validated flag
    registrations[idx].validated = !registrations[idx].validated;

    // Persist and refresh table
    localStorage.setItem('registrations', JSON.stringify(registrations));
    loadRegistrations();
}

// Toggle validation state for a registration and persist to localStorage
// (no validateRegistration in original)

// ========================================
// ADMIN PANEL - SEARCH
// ========================================
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#table-body tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// ========================================
// ADMIN PANEL - EXPORT CSV
// ========================================
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
    exportBtn.addEventListener('click', function() {
        const registrations = JSON.parse(localStorage.getItem('registrations')) || [];
        
        if (registrations.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }
        
        // Create CSV content
        let csv = 'Date,Nom,Prénom,Filière,Année,Téléphone,Email,Intérêt\n';
        
        registrations.forEach(reg => {
            csv += `${reg.date},${reg.nom},${reg.prenom},${reg.filiere},${reg.annee},${reg.telephone},${reg.email},${reg.interet}\n`;
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
// ABOUT TITLE HIDE ON SCROLL (KEEP TEXT & IMAGE READABLE)
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
        // When the about section's top is near the top of viewport, hide the title
        const triggerPoint = 120; // px from top where title will hide

        if (rect.top <= triggerPoint && rect.bottom > triggerPoint) {
            aboutTitle.style.opacity = '0';
            aboutTitle.style.transform = 'translateY(-10px)';
        } else {
            aboutTitle.style.opacity = '1';
            aboutTitle.style.transform = 'translateY(0)';
        }
    };

    // run once and on scroll
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
});
