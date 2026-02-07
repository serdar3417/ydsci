import { Store } from './store.js';
import { UI } from './ui.js';

// Ensure UI is available globally for inline onclick handlers
window.UI = UI;

const initApp = () => {
    console.log('App Initializing...');
    Store.init();
    UI.init();

    // Basic Routing/Navigation
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Use currentTarget to ensure we get the button, not inner icon
            const button = e.currentTarget;
            const target = button.dataset.target;

            console.log('Nav Click:', target);

            // Handle specialized actions
            if (target === 'add') {
                UI.showAddModal();
                return;
            }

            // Update UI Interface
            navButtons.forEach(b => b.classList.remove('active'));
            if (!button.classList.contains('center-fab')) {
                button.classList.add('active');
            }

            // Switch View
            UI.switchView(target);
        });
    });

    // Render Initial View (Home)
    UI.renderHome();
};

// Start App
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
