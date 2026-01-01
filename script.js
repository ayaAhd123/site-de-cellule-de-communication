// ========================================
// GLOBAL FIREBASE UTILITIES - CORRIGÉ
// ========================================
let database = null;
let firebaseFunctions = null;
let isFirebaseReady = false;

// Initialiser Firebase une seule fois
async function initFirebase() {
    if (isFirebaseReady) {
        console.log('Firebase déjà initialisé');
        return true;
    }
    
    try {
        console.log('🔄 Initialisation de Firebase...');
        
        // Importer les modules Firebase
        const { database: fbDatabase } = await import('./firebase-config.js');
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
        console.log('📦 Database:', database);
        isFirebaseReady = true;
        return true;
        
    } catch (error) {
        console.error('❌ Erreur d\'initialisation Firebase:', error);
        return false;
    }
}

// Vérifier que Firebase est prêt avant utilisation
async function ensureFirebaseReady() {
    if (!isFirebaseReady) {
        return await initFirebase();
    }
    return true;
}

// ========================================
// ADMIN PANEL - LOAD REGISTRATIONS - CORRIGÉ
// ========================================
async function loadRegistrations() {
    console.log('🔄 Chargement des inscriptions...');
    
    // Vérifier que Firebase est prêt
    const firebaseReady = await ensureFirebaseReady();
    if (!firebaseReady) {
        console.error('❌ Firebase non disponible');
        showError('Erreur de connexion à la base de données');
        return;
    }
    
    const tableBody = document.getElementById('table-body');
    const totalRegistrations = document.getElementById('total-registrations');
    const noDataMessage = document.getElementById('no-data-message');
    
    try {
        // Créer la référence
        const registrationsRef = firebaseFunctions.ref(database, 'registrations');
        console.log('📝 Référence créée:', registrationsRef);
        
        // Récupérer les données
        console.log('📥 Récupération des données...');
        const snapshot = await firebaseFunctions.get(registrationsRef);
        
        if (!snapshot.exists()) {
            console.log('ℹ️ Aucune donnée trouvée');
            if (tableBody) tableBody.innerHTML = '';
            if (totalRegistrations) totalRegistrations.textContent = '0';
            if (noDataMessage) {
                noDataMessage.style.display = 'block';
                noDataMessage.textContent = 'Aucune inscription enregistrée.';
            }
            return;
        }
        
        const registrations = snapshot.val();
        const registrationsArray = Object.values(registrations);
        
        console.log(`📈 ${registrationsArray.length} inscriptions trouvées`);
        
        // Mettre à jour les statistiques
        if (totalRegistrations) {
            totalRegistrations.textContent = registrationsArray.length;
        }
        
        // Vider le tableau
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        
        // Masquer le message "pas de données"
        if (noDataMessage) {
            noDataMessage.style.display = 'none';
        }
        
        // Trier et afficher les données
        registrationsArray
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .forEach(reg => {
                const row = document.createElement('tr');
                
                // S'assurer que tous les champs existent
                const safeReg = {
                    id: reg.id || 'N/A',
                    date: reg.date || 'N/A',
                    nom: reg.nom || 'N/A',
                    prenom: reg.prenom || 'N/A',
                    filiere: reg.filiere || 'N/A',
                    annee: reg.annee || 'N/A',
                    telephone: reg.telephone || 'N/A',
                    email: reg.email || 'N/A',
                    interet: reg.interet || 'N/A',
                    validated: reg.validated || false
                };
                
                row.innerHTML = `
                    <td>${safeReg.date}</td>
                    <td>${safeReg.nom}</td>
                    <td>${safeReg.prenom}</td>
                    <td>${safeReg.filiere}</td>
                    <td>${safeReg.annee}</td>
                    <td>${safeReg.telephone}</td>
                    <td>${safeReg.email}</td>
                    <td>${safeReg.interet}</td>
                    <td>
                        <button class="validate-btn ${safeReg.validated ? 'valid' : ''}" 
                                onclick="validateRegistration('${safeReg.id}')">
                            ${safeReg.validated ? 'Validé' : 'Non validé'}
                        </button>
                        <button class="delete-btn" onclick="deleteRegistration('${safeReg.id}')">
                            🗑️ Supprimer
                        </button>
                    </td>
                `;
                
                if (tableBody) {
                    tableBody.appendChild(row);
                }
            });
        
        console.log('✅ Données chargées avec succès');
        
    } catch (error) {
        console.error('❌ Erreur de chargement des inscriptions:', error);
        showError('Erreur de chargement des données: ' + error.message);
    }
}

// Fonction pour afficher les erreurs
function showError(message) {
    const noDataMessage = document.getElementById('no-data-message');
    if (noDataMessage) {
        noDataMessage.style.display = 'block';
        noDataMessage.textContent = message;
        noDataMessage.style.color = '#dc3545';
    }
    
    const tableBody = document.getElementById('table-body');
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    
    const totalRegistrations = document.getElementById('total-registrations');
    if (totalRegistrations) {
        totalRegistrations.textContent = '0';
    }
}

// ========================================
// ADMIN PANEL - PASSWORD MANAGEMENT - CORRIGÉ
// ========================================
async function getAdminPassword() {
    try {
        const firebaseReady = await ensureFirebaseReady();
        if (!firebaseReady) {
            console.log('⚠️ Firebase non prêt, utilisation du mot de passe par défaut');
            return 'cmc2024';
        }
        
        const adminPasswordRef = firebaseFunctions.ref(database, 'adminPassword');
        const snapshot = await firebaseFunctions.get(adminPasswordRef);
        
        if (snapshot.exists()) {
            const password = snapshot.val();
            console.log('🔑 Mot de passe admin récupéré');
            return password;
        } else {
            console.log('ℹ️ Pas de mot de passe trouvé, utilisation du défaut');
            return 'cmc2024';
        }
    } catch (error) {
        console.error('❌ Erreur récupération mot de passe:', error);
        return 'cmc2024';
    }
}

async function setAdminPassword(newPass) {
    try {
        const firebaseReady = await ensureFirebaseReady();
        if (!firebaseReady) {
            throw new Error('Firebase non disponible');
        }
        
        const adminPasswordRef = firebaseFunctions.ref(database, 'adminPassword');
        await firebaseFunctions.set(adminPasswordRef, newPass);
        console.log('✅ Mot de passe admin mis à jour');
    } catch (error) {
        console.error('❌ Erreur mise à jour mot de passe:', error);
        throw error;
    }
}

// ========================================
// SETUP REAL-TIME LISTENER - CORRIGÉ
// ========================================
function setupRegistrationListener() {
    if (!isFirebaseReady || !database) {
        console.log('⚠️ Impossible de configurer l\'écouteur: Firebase non initialisé');
        return;
    }
    
    try {
        console.log('👂 Configuration de l\'écouteur en temps réel...');
        
        const registrationsRef = firebaseFunctions.ref(database, 'registrations');
        firebaseFunctions.onValue(registrationsRef, (snapshot) => {
            console.log('🔄 Mise à jour en temps réel détectée');
            loadRegistrations();
        });
        
        console.log('✅ Écouteur en temps réel configuré');
    } catch (error) {
        console.error('❌ Erreur configuration écouteur:', error);
    }
}

// ========================================
// ADMIN PANEL - DELETE REGISTRATION - CORRIGÉ
// ========================================
window.deleteRegistration = async function(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
        return;
    }
    
    try {
        const firebaseReady = await ensureFirebaseReady();
        if (!firebaseReady) {
            alert('Erreur: Firebase non disponible');
            return;
        }
        
        const regRef = firebaseFunctions.ref(database, 'registrations/' + id);
        await firebaseFunctions.remove(regRef);
        
        console.log(`✅ Inscription ${id} supprimée`);
        // L'écouteur en temps réel mettra à jour automatiquement
        
    } catch (error) {
        console.error('❌ Erreur suppression inscription:', error);
        alert('Erreur lors de la suppression: ' + error.message);
    }
};

// ========================================
// ADMIN PANEL - VALIDATE REGISTRATION - CORRIGÉ
// ========================================
window.validateRegistration = async function(id) {
    try {
        const firebaseReady = await ensureFirebaseReady();
        if (!firebaseReady) {
            alert('Erreur: Firebase non disponible');
            return;
        }
        
        const regRef = firebaseFunctions.ref(database, 'registrations/' + id);
        const snapshot = await firebaseFunctions.get(regRef);
        
        if (snapshot.exists()) {
            const currentData = snapshot.val();
            await firebaseFunctions.update(regRef, {
                ...currentData,
                validated: !currentData.validated
            });
            
            console.log(`✅ Inscription ${id} ${!currentData.validated ? 'validée' : 'invalidée'}`);
        } else {
            alert('Inscription non trouvée');
        }
    } catch (error) {
        console.error('❌ Erreur validation inscription:', error);
        alert('Erreur lors de la validation: ' + error.message);
    }
};

// ========================================
// REGISTRATION FORM - CORRIGÉ
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
            
            // Récupérer les données du formulaire
            const formData = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString('fr-FR'),
                timestamp: Date.now(),
                nom: document.getElementById('nom').value.trim(),
                prenom: document.getElementById('prenom').value.trim(),
                filiere: document.getElementById('filiere').value.trim(),
                annee: document.getElementById('annee').value,
                telephone: document.getElementById('telephone').value.trim(),
                email: document.getElementById('email').value.trim(),
                interet: document.getElementById('interet').value,
                validated: false
            };
            
            console.log('📦 Données à enregistrer:', formData);
            
            // Vérifier les champs requis
            const requiredFields = ['nom', 'prenom', 'filiere', 'annee', 'telephone', 'email', 'interet'];
            for (const field of requiredFields) {
                if (!formData[field]) {
                    alert(`Le champ ${field} est requis`);
                    return;
                }
            }
            
            // Enregistrer dans Firebase
            const regRef = firebaseFunctions.ref(database, 'registrations/' + formData.id);
            await firebaseFunctions.set(regRef, formData);
            
            console.log('✅ Inscription enregistrée avec succès!');
            
            // Afficher le message de succès
            if (successMessage) {
                successMessage.style.display = 'block';
                successMessage.textContent = '✅ Inscription enregistrée avec succès !';
                successMessage.style.backgroundColor = '#d4edda';
                successMessage.style.color = '#155724';
                successMessage.style.padding = '15px';
                successMessage.style.borderRadius = '5px';
                successMessage.style.marginTop = '20px';
                successMessage.style.textAlign = 'center';
            }
            
            // Réinitialiser le formulaire
            registrationForm.reset();
            
            // Masquer le message après 5 secondes
            setTimeout(() => {
                if (successMessage) {
                    successMessage.style.display = 'none';
                }
            }, 5000);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement:', error);
            alert('Erreur: ' + error.message);
        }
    });
}

// ========================================
// ADMIN PANEL - LOGIN - CORRIGÉ
// ========================================
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginError = document.getElementById('login-error');

if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('admin-password').value;
        console.log('🔐 Tentative de connexion...');
        
        try {
            const adminPassword = await getAdminPassword();
            
            if (password === adminPassword) {
                console.log('✅ Connexion réussie');
                loginSection.style.display = 'none';
                adminDashboard.style.display = 'block';
                
                // Initialiser Firebase si pas encore fait
                await ensureFirebaseReady();
                
                // Charger les inscriptions
                await loadRegistrations();
                
                // Configurer l'écouteur en temps réel
                setupRegistrationListener();
                
                // Effacer les erreurs
                if (loginError) {
                    loginError.textContent = '';
                    loginError.classList.remove('show');
                }
            } else {
                console.log('❌ Mot de passe incorrect');
                if (loginError) {
                    loginError.textContent = '❌ Mot de passe incorrect';
                    loginError.classList.add('show');
                }
            }
        } catch (error) {
            console.error('❌ Erreur lors de la connexion:', error);
            if (loginError) {
                loginError.textContent = '❌ Erreur de connexion';
                loginError.classList.add('show');
            }
        }
    });
}

// ========================================
// INITIALISATION AU CHARGEMENT
// ========================================
console.log('🚀 Script.js chargé');

// Initialiser Firebase au chargement si sur page admin
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('📄 Page admin chargée');
        
        // Initialiser Firebase en arrière-plan
        setTimeout(async () => {
            try {
                const ready = await initFirebase();
                console.log(ready ? '✅ Firebase prêt' : '❌ Firebase non initialisé');
                
                // Tester la connexion
                if (ready) {
                    const testRef = firebaseFunctions.ref(database, 'test');
                    try {
                        await firebaseFunctions.get(testRef);
                        console.log('✅ Connexion Firebase testée avec succès');
                    } catch (testError) {
                        // C'est normal si le nœud n'existe pas
                        console.log('ℹ️ Test Firebase:', testError.message);
                    }
                }
            } catch (error) {
                console.error('❌ Erreur initialisation:', error);
            }
        }, 1000);
    });
}