/**
 * 🚀 ROUTER JS VANILLA - DASHPOOL CMC
 * Gère l'accès masqué à l'administration via l'URL /admin
 */
const DashPoolRouter = (function () {

    // Configuration
    const ADMIN_PATH = '/admin';
    const ADMIN_HASH = '#admin';
    const PUBLIC_CONTENT_ID = 'public-root'; // ID facultatif pour le wrap de votre index

    function init() {
        // Détecter les changements d'URL sans rechargement
        window.addEventListener('popstate', handleRouting);

        // Initialiser au chargement de la page
        handleRouting();

        // Intercepter les clics sur les liens internes si besoin
        document.addEventListener('click', e => {
            if (e.target.tagName === 'A' && e.target.getAttribute('href') === ADMIN_PATH) {
                e.preventDefault();
                navigate(ADMIN_PATH);
            }
        });
    }

    function handleRouting() {
        const path = window.location.pathname;
        const hash = window.location.hash;

        // Vérification de la route admin
        if (path === ADMIN_PATH || path.endsWith(ADMIN_PATH) || hash === ADMIN_HASH) {
            showAdmin();
        } else {
            showPublic();
        }
    }

    function showAdmin() {
        console.log("🔑 Accès DashPool (Admin) détecté...");

        // On change le titre de l'onglet
        document.title = "DashPool - Administration";

        // Pour un affichage propre sans flash, on peut simplement rediriger
        // vers admin.html si on veut garder les fichiers séparés physiquement.
        // Si vous préférez une seule page (SPA), on injecte le contenu.

        if (!window.location.pathname.includes('admin')) {
            window.location.href = 'admin.html';
        }
    }

    function showPublic() {
        // Si on est sur admin.html mais qu'on veut le public, on redirige vers l'accueil
        if (window.location.pathname.includes('admin.html')) {
            window.location.href = 'index.html';
        }
    }

    function navigate(path) {
        window.history.pushState({}, "", path);
        handleRouting();
    }

    return {
        init: init
    };

})();

// Lancement automatique
DashPoolRouter.init();
