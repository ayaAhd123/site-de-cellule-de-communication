// ========================================
// NAVIGATION & MENU MOBILE
// ========================================
document.addEventListener('DOMContentLoaded', function () {
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
    registrationForm.addEventListener('submit', async function (e) {
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
    loginForm.addEventListener('submit', async function (e) {
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
window.deleteRegistration = async function (id) {
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
window.validateRegistration = async function (id) {
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
        searchInput.addEventListener('input', function (e) {
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
    exportBtn.addEventListener('click', async function () {
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

// ========================================
// FIREBASE STORAGE FUNCTIONS
// ========================================
let storage = null;
let storageFunctions = null;

async function initStorage() {
    if (storage) return true;

    try {
        const firebaseModule = await import('./firebase-config.js');
        storage = firebaseModule.storage;

        const { ref: storageRef, uploadBytesResumable, getDownloadURL, deleteObject } =
            await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js");

        storageFunctions = { storageRef, uploadBytesResumable, getDownloadURL, deleteObject };

        console.log('✅ Firebase Storage initialized');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Storage:', error);
        return false;
    }
}

// ========================================
// CLOUDINARY UPLOAD FUNCTIONS
// ========================================
const cloudName = "dr09ffigi";
const uploadPreset = "celluleCommunication";

async function uploadToCloudinary(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                if (onProgress) onProgress(percent);
            }
        };

        xhr.onload = () => {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
                resolve(response.secure_url);
            } else {
                reject(new Error(response.error ? response.error.message : 'Upload Cloudinary échoué'));
            }
        };

        xhr.onerror = () => reject(new Error('Erreur réseau Cloudinary'));
        xhr.send(formData);
    });
}

async function deleteFile(url) {
    if (!url) return;

    try {
        await initStorage();
        const fileRef = storageFunctions.storageRef(storage, url);
        await storageFunctions.deleteObject(fileRef);
        console.log('✅ File deleted from storage');
    } catch (error) {
        console.error('Error deleting file:', error);
    }
}

// ========================================
// CROPPER.JS UTILITIES
// ========================================
let currentCropper = null;
let currentCropTarget = null; // { inputId: string, previewId: string, mode: 'round' | 'rect' }

function openCropper(file, target) {
    const modal = document.getElementById('cropper-modal');
    const image = document.getElementById('cropper-image');
    const title = document.getElementById('cropper-title');
    currentCropTarget = target;

    if (title) {
        title.textContent = target.mode === 'round' ? 'Recadrer la photo du membre' : 'Recadrer la photo de l\'événement';
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        image.src = e.target.result;
        modal.classList.add('show');
        modal.style.display = 'flex';

        if (currentCropper) {
            currentCropper.destroy();
        }

        const options = {
            aspectRatio: target.mode === 'round' ? 1 : (16 / 9),
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            ready: function () {
                if (target.mode === 'round') {
                    document.querySelector('.cropper-container').classList.add('cropper-round');
                } else {
                    document.querySelector('.cropper-container').classList.remove('cropper-round');
                }
            }
        };

        currentCropper = new Cropper(image, options);
    };
    reader.readAsDataURL(file);
}

// Cropper Actions
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('cropper-save');
    const cancelBtn = document.getElementById('cropper-cancel');
    const rotateLeft = document.getElementById('rotate-left');
    const rotateRight = document.getElementById('rotate-right');
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            if (!currentCropper) return;

            const canvasOptions = currentCropTarget.mode === 'round' ?
                { width: 400, height: 400 } :
                { width: 800, height: 450 };

            const canvas = currentCropper.getCroppedCanvas(canvasOptions);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const preview = document.getElementById(currentCropTarget.previewId);
                const input = document.getElementById(currentCropTarget.inputId);

                if (preview) {
                    preview.innerHTML = `<img src="${url}" alt="Preview" class="${currentCropTarget.mode === 'round' ? 'member-photo-preview-img' : ''}">`;
                }

                // Attach the blob to the input for later use
                input.dataset.croppedBlob = url; // We store the object URL
                input.croppedFile = new File([blob], "cropped_image.jpg", { type: "image/jpeg" });

                closeCropper();
            }, 'image/jpeg', 0.9);
        });
    }

    if (cancelBtn) cancelBtn.addEventListener('click', closeCropper);

    if (rotateLeft) rotateLeft.addEventListener('click', () => currentCropper?.rotate(-90));
    if (rotateRight) rotateRight.addEventListener('click', () => currentCropper?.rotate(90));
    if (zoomIn) zoomIn.addEventListener('click', () => currentCropper?.zoom(0.1));
    if (zoomOut) zoomOut.addEventListener('click', () => currentCropper?.zoom(-0.1));
});

function closeCropper() {
    const modal = document.getElementById('cropper-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    if (currentCropper) {
        currentCropper.destroy();
        currentCropper = null;
    }
}

// ========================================
// EVENTS MANAGEMENT
// ========================================
// Add event form handler
const eventForm = document.getElementById('event-form');
if (eventForm) {
    // File previews with Cropper
    document.getElementById('event-photo')?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            openCropper(file, { inputId: 'event-photo', previewId: 'event-photo-preview', mode: 'rect' });
        }
    });

    document.getElementById('event-video')?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        const preview = document.getElementById('event-video-preview');
        if (file && preview) {
            preview.innerHTML = `<p class="file-preview-name">📹 ${file.name}</p>`;
        }
    });

    eventForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = eventForm.querySelector('.submit-button');
        const btnText = document.getElementById('event-btn-text');
        const message = document.getElementById('event-message');
        const progress = document.getElementById('event-upload-progress');
        const progressFill = progress?.querySelector('.progress-fill');

        try {
            await ensureFirebaseReady();
            await initStorage();

            submitBtn.disabled = true;
            if (btnText) btnText.textContent = '⏳ Upload en cours...';
            if (progress) progress.style.display = 'block';
            if (message) {
                message.textContent = '';
                message.className = 'form-message';
            }

            const name = document.getElementById('event-name').value;
            const description = document.getElementById('event-description').value;
            const photoInput = document.getElementById('event-photo');
            const videoFile = document.getElementById('event-video').files[0];

            // Use cropped file if available, otherwise original
            const photoFile = photoInput.croppedFile || photoInput.files[0];

            if (!photoFile) {
                throw new Error('Photo requise');
            }

            // Upload photo vers Cloudinary
            const photoURL = await uploadToCloudinary(photoFile, (prog) => {
                if (progressFill) progressFill.style.width = `${prog / 2}%`;
            });

            // Upload video vers Cloudinary si elle existe
            let videoURL = null;
            if (videoFile) {
                videoURL = await uploadToCloudinary(videoFile, (prog) => {
                    if (progressFill) progressFill.style.width = `${50 + prog / 2}%`;
                });
            } else {
                if (progressFill) progressFill.style.width = '100%';
            }

            // Save to database
            const eventData = {
                id: Date.now().toString(),
                name,
                description,
                photoURL,
                videoURL,
                timestamp: Date.now()
            };

            await firebaseFunctions.set(
                firebaseFunctions.ref(database, 'events/' + eventData.id),
                eventData
            );

            if (message) {
                message.textContent = '✅ Événement ajouté avec succès!';
                message.className = 'form-message success';
            }

            eventForm.reset();
            document.getElementById('event-photo-preview').innerHTML = '';
            document.getElementById('event-video-preview').innerHTML = '';

            // Clear cropped file references
            const eventPhotoInput = document.getElementById('event-photo');
            delete eventPhotoInput.croppedFile;
            delete eventPhotoInput.dataset.croppedBlob;

            setTimeout(() => {
                if (progress) progress.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
                if (message) {
                    message.textContent = '';
                    message.className = 'form-message';
                }
            }, 3000);

        } catch (error) {
            console.error('Error adding event:', error);
            if (message) {
                message.textContent = '❌ Erreur: ' + error.message;
                message.className = 'form-message error';
            }
        } finally {
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = '➕ Ajouter l\'événement';
        }
    });
}

// Load events in admin
async function loadEvents() {
    try {
        await ensureFirebaseReady();

        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'events'));
        const events = snapshot.exists() ? snapshot.val() : {};
        const eventsArray = Object.values(events);

        const tableBody = document.getElementById('events-table-body');
        const totalEvents = document.getElementById('total-events');
        const noEventsMessage = document.getElementById('no-events-message');

        if (totalEvents) totalEvents.textContent = eventsArray.length;

        if (tableBody) tableBody.innerHTML = '';

        if (eventsArray.length === 0) {
            if (noEventsMessage) noEventsMessage.style.display = 'block';
            return;
        } else {
            if (noEventsMessage) noEventsMessage.style.display = 'none';
        }

        eventsArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(event => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><img src="${event.photoURL}" alt="${event.name}"></td>
                    <td>${event.name}</td>
                    <td>${event.description.substring(0, 50)}...</td>
                    <td>${event.videoURL ? '✅ Oui' : '❌ Non'}</td>
                    <td>
                        <button class="edit-btn" onclick="editEvent('${event.id}')">✏️ Modifier</button>
                        <button class="delete-btn" onclick="deleteEvent('${event.id}')">🗑️ Supprimer</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Global functions for edit/delete (ensure available for onclick)
window.editEvent = async function (id) {
    try {
        await ensureFirebaseReady();
        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'events/' + id));
        if (!snapshot.exists()) return;
        const event = snapshot.val();
        document.getElementById('edit-event-id').value = id;
        document.getElementById('edit-event-name').value = event.name;
        document.getElementById('edit-event-description').value = event.description;
        const modal = document.getElementById('edit-event-modal');
        modal.classList.add('show');
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading event for edit:', error);
    }
};

window.deleteEvent = async function (id) {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
        await ensureFirebaseReady();
        await initStorage();
        const eventRef = firebaseFunctions.ref(database, 'events/' + id);
        const snapshot = await firebaseFunctions.get(eventRef);
        if (snapshot.exists()) {
            const event = snapshot.val();
            if (event.photoURL) await deleteFile(event.photoURL);
            if (event.videoURL) await deleteFile(event.videoURL);
            await firebaseFunctions.remove(eventRef);
            alert('✅ Événement supprimé');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('❌ Erreur lors de la suppression');
    }
};


// Edit event photo preview with Cropper
document.getElementById('edit-event-photo')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        openCropper(file, { inputId: 'edit-event-photo', previewId: 'edit-event-photo-preview', mode: 'rect' });
    }
});

// Edit event form handler
const editEventForm = document.getElementById('edit-event-form');
if (editEventForm) {
    editEventForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = editEventForm.querySelector('.submit-button');
        const message = document.getElementById('edit-event-message');
        const progress = document.getElementById('edit-event-progress');

        try {
            await ensureFirebaseReady();
            await initStorage();

            submitBtn.disabled = true;
            if (progress) progress.style.display = 'block';
            const progressFill = progress?.querySelector('.progress-fill');

            const id = document.getElementById('edit-event-id').value;
            const name = document.getElementById('edit-event-name').value;
            const description = document.getElementById('edit-event-description').value;
            const photoInput = document.getElementById('edit-event-photo');
            const videoFile = document.getElementById('edit-event-video').files[0];

            const photoFile = photoInput.croppedFile || photoInput.files[0];

            const eventRef = firebaseFunctions.ref(database, 'events/' + id);
            const snapshot = await firebaseFunctions.get(eventRef);
            const currentEvent = snapshot.val();

            let photoURL = currentEvent.photoURL;
            let videoURL = currentEvent.videoURL;

            // Upload
            if (photoFile) {
                photoURL = await uploadToCloudinary(photoFile, (prog) => {
                    if (progressFill) progressFill.style.width = `${prog / 2}%`;
                });
            }

            if (videoFile) {
                videoURL = await uploadToCloudinary(videoFile, (prog) => {
                    const start = photoFile ? 50 : 0;
                    const scale = photoFile ? 2 : 1;
                    if (progressFill) progressFill.style.width = `${start + prog / scale}%`;
                });
            }
            else {
                if (progressFill) progressFill.style.width = '100%';
            }

            await firebaseFunctions.update(eventRef, {
                name,
                description,
                photoURL,
                videoURL
            });

            if (message) {
                message.textContent = '✅ Modification enregistrée!';
                message.className = 'form-message success';
            }

            setTimeout(() => {
                document.getElementById('edit-event-modal').style.display = 'none';
                editEventForm.reset();
                const editPhotoInput = document.getElementById('edit-event-photo');
                delete editPhotoInput.croppedFile;
                delete editPhotoInput.dataset.croppedBlob;
            }, 2000);

        } catch (error) {
            console.error('Error updating event:', error);
            if (message) {
                message.textContent = '❌ Erreur: ' + error.message;
                message.className = 'form-message error';
            }
        } finally {
            submitBtn.disabled = false;
            if (progress) progress.style.display = 'none';
        }
    });
}

// ========================================
// MEMBERS MANAGEMENT
// ========================================
const memberForm = document.getElementById('member-form');
if (memberForm) {
    // File preview with Cropper
    document.getElementById('member-photo')?.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            openCropper(file, { inputId: 'member-photo', previewId: 'member-photo-preview', mode: 'round' });
        }
    });

    memberForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = memberForm.querySelector('.submit-button');
        const btnText = document.getElementById('member-btn-text');
        const message = document.getElementById('member-message');
        const progress = document.getElementById('member-upload-progress');
        const progressFill = progress?.querySelector('.progress-fill');

        try {
            await ensureFirebaseReady();
            await initStorage();

            submitBtn.disabled = true;
            if (btnText) btnText.textContent = '⏳ Upload en cours...';
            if (progress) progress.style.display = 'block';
            if (message) {
                message.textContent = '';
                message.className = 'form-message';
            }

            const name = document.getElementById('member-name').value;
            const role = document.getElementById('member-role').value;
            const description = document.getElementById('member-description').value;
            const photoInput = document.getElementById('member-photo');

            const photoFile = photoInput.croppedFile || photoInput.files[0];

            if (!photoFile) {
                throw new Error('Photo requise');
            }

            // Upload photo vers Cloudinary
            const photoURL = await uploadToCloudinary(photoFile, (prog) => {
                if (progressFill) progressFill.style.width = `${prog}%`;
            });

            // Save to database
            const memberData = {
                id: Date.now().toString(),
                name,
                role,
                description,
                photoURL,
                timestamp: Date.now()
            };

            await firebaseFunctions.set(
                firebaseFunctions.ref(database, 'members/' + memberData.id),
                memberData
            );

            if (message) {
                message.textContent = '✅ Membre ajouté avec succès!';
                message.className = 'form-message success';
            }

            memberForm.reset();
            document.getElementById('member-photo-preview').innerHTML = '';

            // Clear cropped references
            const memberPhotoInput = document.getElementById('member-photo');
            delete memberPhotoInput.croppedFile;
            delete memberPhotoInput.dataset.croppedBlob;

            setTimeout(() => {
                if (progress) progress.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
                if (message) {
                    message.textContent = '';
                    message.className = 'form-message';
                }
            }, 3000);

        } catch (error) {
            console.error('Error adding member:', error);
            if (message) {
                message.textContent = '❌ Erreur: ' + error.message;
                message.className = 'form-message error';
            }
        } finally {
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = '➕ Ajouter le membre';
        }
    });
}

// Load members in admin
async function loadMembers() {
    try {
        await ensureFirebaseReady();

        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'members'));
        const members = snapshot.exists() ? snapshot.val() : {};
        const membersArray = Object.values(members);

        const tableBody = document.getElementById('members-table-body');
        const totalMembers = document.getElementById('total-members');
        const noMembersMessage = document.getElementById('no-members-message');

        if (totalMembers) totalMembers.textContent = membersArray.length;

        if (tableBody) tableBody.innerHTML = '';

        if (membersArray.length === 0) {
            if (noMembersMessage) noMembersMessage.style.display = 'block';
            return;
        } else {
            if (noMembersMessage) noMembersMessage.style.display = 'none';
        }

        membersArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(member => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><img src="${member.photoURL}" alt="${member.name}"></td>
                    <td>${member.name}</td>
                    <td>${member.role}</td>
                    <td>${member.description.substring(0, 50)}...</td>
                    <td>
                        <button class="edit-btn" onclick="editMember('${member.id}')">✏️ Modifier</button>
                        <button class="delete-btn" onclick="deleteMember('${member.id}')">🗑️ Supprimer</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

    } catch (error) {
        console.error('Error loading members:', error);
    }
}

window.editMember = async function (id) {
    try {
        await ensureFirebaseReady();
        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'members/' + id));
        if (!snapshot.exists()) return;
        const member = snapshot.val();
        document.getElementById('edit-member-id').value = id;
        document.getElementById('edit-member-name').value = member.name;
        document.getElementById('edit-member-role').value = member.role;
        document.getElementById('edit-member-description').value = member.description;
        const modal = document.getElementById('edit-member-modal');
        modal.classList.add('show');
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading member for edit:', error);
    }
};

window.deleteMember = async function (id) {
    if (!confirm('Supprimer ce membre ?')) return;
    try {
        await ensureFirebaseReady();
        await initStorage();
        const memberRef = firebaseFunctions.ref(database, 'members/' + id);
        const snapshot = await firebaseFunctions.get(memberRef);
        if (snapshot.exists()) {
            const member = snapshot.val();
            if (member.photoURL) await deleteFile(member.photoURL);
            await firebaseFunctions.remove(memberRef);
            alert('✅ Membre supprimé');
        }
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('❌ Erreur lors de la suppression');
    }
};


// Edit member photo preview with Cropper
document.getElementById('edit-member-photo')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        openCropper(file, { inputId: 'edit-member-photo', previewId: 'edit-member-photo-preview', mode: 'round' });
    }
});

// Edit member form handler
const editMemberForm = document.getElementById('edit-member-form');
if (editMemberForm) {
    editMemberForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = editMemberForm.querySelector('.submit-button');
        const message = document.getElementById('edit-member-message');
        const progress = document.getElementById('edit-member-progress');

        try {
            await ensureFirebaseReady();
            await initStorage();

            submitBtn.disabled = true;
            if (progress) progress.style.display = 'block';
            const progressFill = progress?.querySelector('.progress-fill');

            const id = document.getElementById('edit-member-id').value;
            const name = document.getElementById('edit-member-name').value;
            const role = document.getElementById('edit-member-role').value;
            const description = document.getElementById('edit-member-description').value;
            const photoInput = document.getElementById('edit-member-photo');

            const photoFile = photoInput.croppedFile || photoInput.files[0];

            if (photoFile) {
                photoURL = await uploadToCloudinary(photoFile, (prog) => {
                    if (progressFill) progressFill.style.width = `${prog}%`;
                });
            }

            const memberRef = firebaseFunctions.ref(database, 'members/' + id);
            await firebaseFunctions.update(memberRef, {
                name,
                role,
                description,
                photoURL
            });

            if (message) {
                message.textContent = '✅ Modification enregistrée!';
                message.className = 'form-message success';
            }

            setTimeout(() => {
                document.getElementById('edit-member-modal').style.display = 'none';
                editMemberForm.reset();
                const editMemberPhotoInput = document.getElementById('edit-member-photo');
                delete editMemberPhotoInput.croppedFile;
                delete editMemberPhotoInput.dataset.croppedBlob;
            }, 2000);

        } catch (error) {
            console.error('Error updating member:', error);
            if (message) {
                message.textContent = '❌ Erreur: ' + error.message;
                message.className = 'form-message error';
            }
        } finally {
            submitBtn.disabled = false;
            if (progress) progress.style.display = 'none';
        }
    });
}

// ========================================
// MODAL CLOSE HANDLERS
// ========================================
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
        const modalId = this.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });
});

// Close modals on outside click
window.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        event.target.classList.remove('show');
    }
});

// ========================================
// LOAD DATA WHEN ADMIN LOGS IN
// ========================================
const originalLoadRegistrations = loadRegistrations;
loadRegistrations = async function () {
    await originalLoadRegistrations();
    await loadEvents();
    await loadMembers();
};

// Setup real-time listeners for events and members
function setupEventsListener() {
    if (!isFirebaseReady || !database) return;

    try {
        const eventsRef = firebaseFunctions.ref(database, 'events');
        firebaseFunctions.onValue(eventsRef, () => {
            loadEvents();
        });
    } catch (error) {
        console.error('Error setting up events listener:', error);
    }
}

function setupMembersListener() {
    if (!isFirebaseReady || !database) return;

    try {
        const membersRef = firebaseFunctions.ref(database, 'members');
        firebaseFunctions.onValue(membersRef, () => {
            loadMembers();
        });
    } catch (error) {
        console.error('Error setting up members listener:', error);
    }
}

// Update login success handler to include new listeners
const originalLoginHandler = loginForm?.querySelector('button[type="submit"]');
if (loginForm && originalLoginHandler) {
    loginForm.addEventListener('submit', async function (e) {
        // Let the original handler run first
        setTimeout(() => {
            if (adminDashboard && adminDashboard.style.display === 'block') {
                setupEventsListener();
                setupMembersListener();
            }
        }, 500);
    });
}

// ========================================
// PUBLIC PAGE - LOAD EVENTS AND MEMBERS
// ========================================
async function loadPublicEvents() {
    try {
        await ensureFirebaseReady();

        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'events'));
        const events = snapshot.exists() ? snapshot.val() : {};
        const eventsArray = Object.values(events);

        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        // Clear existing gallery items (keep them or replace, your choice)
        // For now, we'll replace them
        galleryGrid.innerHTML = '';

        if (eventsArray.length === 0) {
            galleryGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 3rem;">Aucun événement disponible.</p>';
            return;
        }

        eventsArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(event => {
                const item = document.createElement('div');
                item.className = 'gallery-item';

                const hasVideo = event.videoURL ? true : false;

                item.innerHTML = `
                    <img src="${event.photoURL}" alt="${event.name}">
                    <div class="gallery-overlay">
                        <h4>${event.name}</h4>
                        <p>${event.description}</p>
                        ${hasVideo ? `<button class="watch-video-btn" onclick="showVideoModal('${event.videoURL}')">Voir la vidéo</button>` : ''}
                    </div>
                `;

                galleryGrid.appendChild(item);
            });
    } catch (error) {
        console.error('Error loading public events:', error);
    }
}

async function loadPublicMembers() {
    try {
        await ensureFirebaseReady();

        const snapshot = await firebaseFunctions.get(firebaseFunctions.ref(database, 'members'));
        const members = snapshot.exists() ? snapshot.val() : {};
        const membersArray = Object.values(members);

        const teamGrid = document.getElementById('team-grid');
        if (!teamGrid) return;

        teamGrid.innerHTML = '';

        if (membersArray.length === 0) {
            teamGrid.innerHTML = '<p class="loading-message">Aucun membre disponible.</p>';
            return;
        }

        membersArray.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
            .forEach(member => {
                const card = document.createElement('div');
                card.className = 'team-member';

                card.innerHTML = `
                    <img src="${member.photoURL}" alt="${member.name}" class="member-photo">
                    <div class="member-info">
                        <h3 class="member-name">${member.name}</h3>
                        <p class="member-role">${member.role}</p>
                        <p class="member-description">${member.description}</p>
                    </div>
                `;

                teamGrid.appendChild(card);
            });
    } catch (error) {
        console.error('Error loading public members:', error);
    }
}

// Video modal functions
window.showVideoModal = function (videoURL) {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    const source = video.querySelector('source');

    source.src = videoURL;
    video.load();

    modal.classList.add('show');
    modal.style.display = 'flex';
};

// Close video modal
const closeVideoBtn = document.querySelector('.close-video-modal');
if (closeVideoBtn) {
    closeVideoBtn.addEventListener('click', function () {
        const modal = document.getElementById('video-modal');
        const video = document.getElementById('modal-video');

        video.pause();
        video.currentTime = 0;

        modal.classList.remove('show');
        modal.style.display = 'none';
    });
}

// Close video modal on outside click
const videoModal = document.getElementById('video-modal');
if (videoModal) {
    videoModal.addEventListener('click', function (e) {
        if (e.target === videoModal) {
            const video = document.getElementById('modal-video');
            video.pause();
            video.currentTime = 0;

            videoModal.classList.remove('show');
            videoModal.style.display = 'none';
        }
    });
}

// Load events and members when page loads (for index.html)
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait a bit then load public data
        setTimeout(async () => {
            try {
                await initFirebase();
                await loadPublicEvents();
                await loadPublicMembers();
            } catch (error) {
                console.error('Error loading public data:', error);
            }
        }, 1000);
    });
}

console.log('✅ Script.js loaded successfully');