// Shopping Cart functionality for Granado Clone

class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.cartContainer = document.querySelector('.cart-items');
        this.totalElement = document.querySelector('.cart-total');
        this.cartCounter = document.querySelector('.cart-counter');
        this.init();
    }

    init() {
        this.renderCart();
        this.setupEventListeners();
        this.updateCartCounter();
    }

    setupEventListeners() {
        // Event delegation for cart item actions
        if (this.cartContainer) {
            this.cartContainer.addEventListener('click', (e) => {
                const target = e.target;

                if (target.classList.contains('remove-item')) {
                    const itemId = target.closest('.cart-item').dataset.id;
                    this.removeItem(itemId);
                }

                if (target.classList.contains('quantity-decrease')) {
                    const itemId = target.closest('.cart-item').dataset.id;
                    this.updateQuantity(itemId, 'decrease');
                }

                if (target.classList.contains('quantity-increase')) {
                    const itemId = target.closest('.cart-item').dataset.id;
                    this.updateQuantity(itemId, 'increase');
                }
            });
        }

        // Checkout button
        const checkoutButton = document.querySelector('.checkout-button');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', () => this.handleCheckout());
        }
    }

    renderCart() {
        if (!this.cartContainer) return;

        if (this.cart.length === 0) {
            this.cartContainer.innerHTML = `
                <div class="empty-cart text-center py-8">
                    <i class="fas fa-shopping-cart text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600">Seu carrinho está vazio</p>
                    <a href="produtos.html" class="inline-block mt-4 px-6 py-2 bg-moss-green text-white rounded hover:bg-opacity-90 transition duration-300">
                        Continuar Comprando
                    </a>
                </div>
            `;
            return;
        }

        this.cartContainer.innerHTML = this.cart.map(item => `
            <div class="cart-item flex items-center justify-between p-4 border-b" data-id="${item.id}">
                <div class="flex items-center space-x-4">
                    <img src="${item.image || 'assets/img/placeholder.jpg'}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                    <div>
                        <h3 class="font-medium">${item.name}</h3>
                        <p class="text-gray-600">R$ ${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="quantity-controls flex items-center space-x-2">
                        <button class="quantity-decrease p-1 rounded-full hover:bg-gray-100">
                            <i class="fas fa-minus text-sm"></i>
                        </button>
                        <span class="quantity-value px-2">${item.quantity}</span>
                        <button class="quantity-increase p-1 rounded-full hover:bg-gray-100">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    </div>
                    <span class="item-total font-medium">
                        R$ ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                    <button class="remove-item text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateTotal();
    }

    updateTotal() {
        if (!this.totalElement) return;

        const total = this.cart.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        this.totalElement.innerHTML = `
            <div class="flex justify-between items-center py-4">
                <span class="text-lg font-medium">Total:</span>
                <span class="text-xl font-bold">R$ ${total.toFixed(2)}</span>
            </div>
        `;
    }

    updateCartCounter() {
        if (!this.cartCounter) return;

        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        this.cartCounter.textContent = totalItems;
        this.cartCounter.classList.toggle('hidden', totalItems === 0);

        // Update localStorage
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    addItem(product) {
        const existingProduct = this.cart.find(item => item.id === product.id);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }

        this.showNotification('Produto adicionado ao carrinho!');
        this.renderCart();
        this.updateCartCounter();
    }

    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.showNotification('Produto removido do carrinho');
        this.renderCart();
        this.updateCartCounter();
    }

    updateQuantity(itemId, action) {
        const item = this.cart.find(item => item.id === itemId);
        if (!item) return;

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                return this.removeItem(itemId);
            }
        }

        this.renderCart();
        this.updateCartCounter();
    }

    async handleCheckout() {
        try {
            // Here you would typically send the cart data to your backend
            const response = await fetch('/backend/php/checkout.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.cart)
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Pedido realizado com sucesso!', 'success');
                this.clearCart();
            } else {
                throw new Error(data.message || 'Erro ao processar o pedido');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification(
                'Erro ao processar o pedido. Tente novamente.',
                'error'
            );
        }
    }

    clearCart() {
        this.cart = [];
        localStorage.removeItem('cart');
        this.renderCart();
        this.updateCartCounter();
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const cart = new ShoppingCart();

    // Add to cart buttons on product pages
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productCard = button.closest('.product-card');
            const product = {
                id: productCard.dataset.id,
                name: productCard.querySelector('.product-name').textContent,
                price: productCard.querySelector('.product-price').dataset.price,
                image: productCard.querySelector('.product-image')?.src
            };
            cart.addItem(product);
        });
    });
});

// Add CSS styles for cart-specific elements
const style = document.createElement('style');
style.textContent = `
    .cart-item {
        transition: all 0.3s ease;
    }

    .cart-item:hover {
        background-color: rgba(0, 0, 0, 0.02);
    }

    .quantity-controls button {
        transition: all 0.2s ease;
    }

    .quantity-controls button:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    .remove-item {
        transition: color 0.2s ease;
    }

    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }

    .cart-item.removing {
        animation: fadeOut 0.3s ease-out forwards;
    }
`;
document.head.appendChild(style);
