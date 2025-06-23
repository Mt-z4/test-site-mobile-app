document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('active');
        });
    }

    // Mobile submenu toggles
    const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
    mobileMenuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                item.classList.toggle('active');
            });
        }
    });

    // Update date and time
    function updateDateTime() {
        const now = new Date();
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        };
        const timeStr = now.toLocaleTimeString('pt-BR', options);
        
        const dateOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        const dateStr = now.toLocaleDateString('pt-BR', dateOptions);
        
        const dateTimeElement = document.querySelector('.text-sm.text-gray-600');
        if (dateTimeElement) {
            dateTimeElement.textContent = `${timeStr}, ${dateStr}`;
        }
    }

    // Update time immediately and then every minute
    updateDateTime();
    setInterval(updateDateTime, 60000);

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu && mobileMenuButton) {
            const isClickInside = mobileMenu.contains(e.target) || mobileMenuButton.contains(e.target);
            if (!isClickInside && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('active');
            }
        }
    });

    // Handle submenu positioning
    const submenus = document.querySelectorAll('.submenu');
    submenus.forEach(submenu => {
        const rect = submenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            submenu.style.left = 'auto';
            submenu.style.right = '0';
        }
    });
});
