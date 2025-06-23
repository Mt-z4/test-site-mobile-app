// Main JavaScript for Power Flash

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            const isExpanded = mobileMenu.classList.contains('active');
            mobileMenuButton.setAttribute('aria-expanded', isExpanded);
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
            mobileMenu.classList.remove('active');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        }
    });
});

// IIFE to avoid global scope pollution
(function() {
    'use strict';

    // DOM Elements
    const cartButtons = document.querySelectorAll('.add-to-cart');
    const bannerSlider = document.querySelector('.banner-slider');
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    const productsContainer = document.querySelector('.products-grid');
    const searchInput = document.querySelector('.search-input');
    const favoritesCounter = document.querySelector('.favorites-counter');
    
    // Initialize favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    updateFavoritesCounter();

    // Search functionality
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase().trim();
                if (productsContainer) {
                    const products = productsContainer.querySelectorAll('.product-card');
                    products.forEach(product => {
                        const name = product.querySelector('.product-name').textContent.toLowerCase();
                        const description = product.querySelector('.product-description')?.textContent.toLowerCase() || '';
                        const isMatch = name.includes(searchTerm) || description.includes(searchTerm);
                        product.style.display = isMatch || searchTerm === '' ? 'block' : 'none';
                    });
                }
            }, 300);
        });
    }

    // Handle favorites
    function updateFavoritesCounter() {
        if (favoritesCounter) {
            favoritesCounter.textContent = favorites.length;
            favoritesCounter.classList.toggle('hidden', favorites.length === 0);
        }
    }

    function toggleFavorite(productId, button) {
        const index = favorites.indexOf(productId);
        const icon = button.querySelector('i');

        if (index === -1) {
            favorites.push(productId);
            icon.classList.remove('far');
            icon.classList.add('fas');
            showNotification('Produto adicionado aos favoritos!');
        } else {
            favorites.splice(index, 1);
            icon.classList.remove('fas');
            icon.classList.add('far');
            showNotification('Produto removido dos favoritos!');
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
        updateFavoritesCounter();
    }

    // Initialize favorites buttons
    document.querySelectorAll('.add-to-wishlist').forEach(button => {
        const productId = button.closest('.product-card')?.dataset.id;
        if (productId) {
            const icon = button.querySelector('i');
            if (favorites.includes(productId)) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
            button.addEventListener('click', (e) => {
                e.preventDefault();
                toggleFavorite(productId, button);
            });
        }
    });

    // Handle category selection from submenu
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const category = new URL(e.target.href).searchParams.get('categoria');
            if (category) {
                localStorage.setItem('selectedCategory', category);
            }
        });
    });

    // Apply selected category on products page load
    if (window.location.pathname.includes('produtos.html')) {
        const urlCategory = new URL(window.location).searchParams.get('categoria');
        const savedCategory = localStorage.getItem('selectedCategory');
        const categoryToApply = urlCategory || savedCategory;

        if (categoryToApply) {
            const categorySelect = document.querySelector('#category-filter');
            if (categorySelect) {
                categorySelect.value = categoryToApply;
                // Trigger change event to filter products
                categorySelect.dispatchEvent(new Event('change'));
            }
            // Clear saved category after applying
            if (!urlCategory) {
                localStorage.removeItem('selectedCategory');
            }
        }
    }

    // Function to load products from JSON
    async function loadProducts() {
        try {
            const response = await fetch('/data/produtos.json');
            const data = await response.json();
            if (data && Array.isArray(data.products)) {
                // Sort by featured first for initial load
                const sortedProducts = [...data.products].sort((a, b) => 
                    (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
                );
                renderProducts(sortedProducts);
            }
        } catch (error) {
            console.error('Error loading products:', error);
            if (productsContainer) {
                productsContainer.innerHTML = '<p class="text-center text-gray-600 col-span-full">Erro ao carregar produtos. Por favor, tente novamente.</p>';
            }
        }
    }

    // Function to render products
    function renderProducts(products) {
        if (!productsContainer) return;
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="text-center text-gray-600 col-span-full">Nenhum produto encontrado.</p>';
            return;
        }

        productsContainer.innerHTML = products.map(product => `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300" 
                 data-id="${product.id}" 
                 data-category="${product.category}">
                <div class="relative group">
                    <div class="aspect-w-1 aspect-h-1">
                        <img src="${product.image}" 
                             alt="${product.name}" 
                             class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                             onerror="this.src='assets/img/placeholder.jpg'">
                    </div>
                    <div class="absolute top-4 right-4">
                        <button class="add-to-wishlist w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors duration-300">
                            <i class="far fa-heart text-gray-600 hover:text-old-pink transition-colors duration-300"></i>
                        </button>
                    </div>
                    ${product.featured ? `
                        <div class="absolute top-4 left-4">
                            <span class="featured-badge">Destaque</span>
                        </div>
                    ` : ''}
                </div>
                <div class="p-6">
                    <h3 class="product-name text-lg font-medium mb-2 hover:text-moss-green transition-colors duration-300">
                        ${product.name}
                    </h3>
                    <p class="text-gray-600 text-sm mb-4">${product.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="product-price text-xl font-bold" data-price="${product.price}">
                            R$ ${product.price.toFixed(2)}
                        </span>
                        <button class="add-to-cart bg-moss-green text-white px-4 py-2 rounded hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105">
                            Adicionar
                        </button>
                    </div>
                    ${product.stock <= 20 ? `
                        <p class="text-old-pink text-sm mt-2">
                            ${product.stock <= 10 ? 'Últimas unidades!' : 'Estoque baixo'} 
                            (${product.stock} ${product.stock === 1 ? 'unidade' : 'unidades'})
                        </p>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Initialize functionality after rendering products
        initializeCart();
        initializeWishlist();
    }

    // Store products data globally
    let productsData = null;

    // Function to initialize filters and sorting
    async function initializeFilters() {
        const categorySelect = document.querySelector('#category-filter');
        const sortSelect = document.querySelector('#sort-options');
        
        try {
            const response = await fetch('/data/produtos.json');
            productsData = await response.json();
            
            if (categorySelect && productsData.categories) {
                // Populate categories
                const categoryOptions = productsData.categories.map(category => 
                    `<option value="${category.slug}">${category.name}</option>`
                ).join('');
                categorySelect.innerHTML = `
                    <option value="">Todas as Categorias</option>
                    ${categoryOptions}
                `;
            }

            // Add event listeners for filtering and sorting
            if (categorySelect) {
                categorySelect.addEventListener('change', () => {
                    const selectedCategory = categorySelect.value;
                    const sortValue = sortSelect ? sortSelect.value : 'relevance';
                    filterAndSortProducts(selectedCategory, sortValue);
                });
            }

            if (sortSelect) {
                sortSelect.addEventListener('change', () => {
                    const selectedCategory = categorySelect ? categorySelect.value : '';
                    const sortValue = sortSelect.value;
                    filterAndSortProducts(selectedCategory, sortValue);
                });
            }

            // Initial load with all products sorted by featured items first
            filterAndSortProducts('', 'relevance');
        } catch (error) {
            console.error('Error initializing filters:', error);
            if (productsContainer) {
                productsContainer.innerHTML = `
                    <div class="text-center col-span-full py-8">
                        <p class="text-red-600">Erro ao carregar produtos. Por favor, tente novamente.</p>
                        <button onclick="window.location.reload()" class="mt-4 bg-moss-green text-white px-4 py-2 rounded hover:bg-opacity-90">
                            Tentar novamente
                        </button>
                    </div>
                `;
            }
        }
    }

    // Function to filter and sort products
    async function filterAndSortProducts(category, sortOption) {
        if (!productsData || !productsData.products) {
            console.error('No products data available');
            return;
        }

        try {
            console.log('Filtering with category:', category, 'sort:', sortOption);
            
            // Show loading state
            if (productsContainer) {
                productsContainer.innerHTML = `
                    <div class="text-center col-span-full py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-moss-green mx-auto"></div>
                        <p class="mt-4 text-gray-600">Filtrando produtos...</p>
                    </div>
                `;
            }

            let filteredProducts = [...productsData.products];
            console.log('Initial products:', filteredProducts.length);

            // Apply category filter
            if (category) {
                filteredProducts = filteredProducts.filter(product => {
                    const match = product.category.toLowerCase() === category.toLowerCase();
                    console.log('Checking product:', product.name, 'category:', product.category, 'match:', match);
                    return match;
                });
                console.log('After category filter:', filteredProducts.length, 'products');
            }

            // Apply sorting
            switch (sortOption) {
                case 'price-asc':
                    filteredProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'price-desc':
                    filteredProducts.sort((a, b) => b.price - a.price);
                    break;
                case 'name-asc':
                    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name-desc':
                    filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'relevance':
                default:
                    // For relevance, show featured items first, then sort by stock level
                    filteredProducts.sort((a, b) => {
                        if (a.featured !== b.featured) {
                            return b.featured ? 1 : -1;
                        }
                        return b.stock - a.stock;
                    });
                    break;
            }

            // Add a small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 300));

            renderProducts(filteredProducts);
        } catch (error) {
            console.error('Error filtering products:', error);
            if (productsContainer) {
                productsContainer.innerHTML = `
                    <div class="text-center col-span-full py-8">
                        <p class="text-red-600">Erro ao filtrar produtos. Por favor, tente novamente.</p>
                    </div>
                `;
            }
        }
    }

    // Function to initialize wishlist
    function initializeWishlist() {
        document.querySelectorAll('.add-to-wishlist').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const icon = this.querySelector('i');
                icon.classList.toggle('far');
                icon.classList.toggle('fas');
                icon.classList.toggle('text-old-pink');
            });
        });
    }


    // Cart functionality
    function initializeCart() {
        // Get cart from localStorage or initialize empty array
        let cart = JSON.parse(localStorage.getItem('cart')) || [];

        // Add to cart functionality
        cartButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const productCard = this.closest('.product-card');
                const product = {
                    id: productCard.dataset.id,
                    name: productCard.querySelector('.product-name').textContent,
                    price: productCard.querySelector('.product-price').dataset.price,
                    quantity: 1
                };

                // Check if product already exists in cart
                const existingProductIndex = cart.findIndex(item => item.id === product.id);
                
                if (existingProductIndex > -1) {
                    cart[existingProductIndex].quantity += 1;
                } else {
                    cart.push(product);
                }

                // Save updated cart to localStorage
                localStorage.setItem('cart', JSON.stringify(cart));
                
                // Show success message
                showNotification('Produto adicionado ao carrinho!');
                
                // Update cart counter
                updateCartCounter();
            });
        });
    }

    // Banner slider functionality
    function initializeBannerSlider() {
        if (!bannerSlider) return;

        const slides = bannerSlider.querySelectorAll('.slide');
        let currentSlide = 0;
        const slideInterval = 5000; // 5 seconds

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }

        // Start automatic slider
        let slideTimer = setInterval(nextSlide, slideInterval);

        // Pause on hover
        bannerSlider.addEventListener('mouseenter', () => {
            clearInterval(slideTimer);
        });

        // Resume on mouse leave
        bannerSlider.addEventListener('mouseleave', () => {
            slideTimer = setInterval(nextSlide, slideInterval);
        });

        // Initialize first slide
        showSlide(currentSlide);
    }

    // Mobile menu functionality
    function initializeMobileMenu() {
        if (!mobileMenuButton || !mobileMenu) return;

        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            this.setAttribute('aria-expanded', 
                this.getAttribute('aria-expanded') === 'false' ? 'true' : 'false'
            );
        });
    }

    // Notification system
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Update cart counter
    function updateCartCounter() {
        const counter = document.querySelector('.cart-counter');
        if (!counter) return;

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        counter.textContent = totalItems;
        counter.classList.toggle('hidden', totalItems === 0);
    }

    // Form validation
    function initializeFormValidation() {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;

                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.classList.add('error');
                        
                        // Show error message
                        const errorMessage = field.dataset.error || 'Este campo é obrigatório';
                        showFieldError(field, errorMessage);
                    } else {
                        field.classList.remove('error');
                        removeFieldError(field);
                    }
                });

                if (isValid) {
                    // If it's the contact form
                    if (form.id === 'contact-form') {
                        submitContactForm(form);
                    }
                    // Add other form submissions as needed
                }
            });
        });
    }

    // Show field error
    function showFieldError(field, message) {
        // Remove existing error message if any
        removeFieldError(field);

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    // Remove field error
    function removeFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // Submit contact form
    async function submitContactForm(form) {
        try {
            const formData = new FormData(form);
            const response = await fetch('/backend/php/contato.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Mensagem enviada com sucesso!', 'success');
                form.reset();
            } else {
                showNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showNotification('Erro ao enviar mensagem. Tente novamente.', 'error');
        }
    }

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            // Initialize basic functionality
            initializeCart();
            updateCartCounter();

            // Initialize products page functionality if on products page
            const productsContainer = document.querySelector('.products-grid');
            if (productsContainer) {
                // Show loading state
                productsContainer.innerHTML = `
                    <div class="text-center col-span-full py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-moss-green mx-auto"></div>
                        <p class="mt-4 text-gray-600">Carregando produtos...</p>
                    </div>
                `;

                // Initialize filters and load initial products
                await initializeFilters();
            }
        } catch (error) {
            console.error('Error initializing:', error);
            if (productsContainer) {
                productsContainer.innerHTML = `
                    <div class="text-center col-span-full py-8">
                        <p class="text-red-600">Erro ao carregar produtos. Por favor, tente novamente.</p>
                        <button onclick="window.location.reload()" class="mt-4 bg-moss-green text-white px-4 py-2 rounded hover:bg-opacity-90">
                            Tentar novamente
                        </button>
                    </div>
                `;
            }
        }
    });

    // Handle smooth scrolling for anchor links
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

})();

// Add notification styles once when the script loads
(function addNotificationStyles() {
    const styleId = 'powerflash-notification-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 4px;
                color: white;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }

            .notification-success {
                background-color: var(--color-moss-green);
            }

            .notification-error {
                background-color: #dc3545;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .field-error {
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }

            .error {
                border-color: #dc3545 !important;
            }
        `;
        document.head.appendChild(style);
    }
})();
