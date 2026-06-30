// EcoStore app logic

// State
let cart = loadCart();
let currentCategory = "Todos";
let currentProductId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryFilters();
  renderProducts();
  updateCartBadge();
});

// Navigation
function showScreen(id) {
  const sections = document.querySelectorAll('section');
  sections.forEach(section => section.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showHome() {
  showScreen('home');
}

function showProduct(id) {
  currentProductId = id;
  renderProductDetails(id);
  showScreen('product');
}

function showCart() {
  renderCart();
  showScreen('cart');
}

function showCheckout() {
  renderCheckoutSummary();
  showScreen('checkout');
}

function showCheckoutSuccess() {
  showScreen('checkout-success');
}

// Formatting
function formatPrice(value) {
  return 'R$ ' + value.toFixed(2);
}

// Category filters
function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  container.innerHTML = CATEGORIES.map(category => {
    const activeClass = category === currentCategory
      ? 'bg-leaf-600 text-white shadow-md'
      : 'bg-white text-leaf-800 hover:bg-leaf-100';
    return `<button onclick="filterCategory('${category}')" class="${activeClass} px-5 py-2 rounded-full font-medium transition-all border border-leaf-200">${category}</button>`;
  }).join('');
}

function filterCategory(category) {
  currentCategory = category;
  renderCategoryFilters();
  renderProducts();
}

// Product rendering
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const filtered = currentCategory === 'Todos'
    ? PRODUCTS
    : PRODUCTS.filter(product => product.category === currentCategory);

  grid.innerHTML = filtered.map(product => `
    <div class="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden border border-leaf-100 cursor-pointer group" onclick="showProduct(${product.id})">
      <div class="h-40 bg-gradient-to-br from-leaf-200 to-leaf-400 flex items-center justify-center group-hover:scale-105 transition-transform">
        <span class="text-6xl">${product.emoji}</span>
      </div>
      <div class="p-5">
        <span class="text-xs font-bold text-leaf-600 uppercase tracking-wide">${product.category}</span>
        <h3 class="text-lg font-bold text-gray-800 mt-1 mb-2">${product.name}</h3>
        <p class="text-leaf-700 font-bold text-xl mb-4">${formatPrice(product.price)}</p>
        <button onclick="event.stopPropagation(); showProduct(${product.id})" class="w-full bg-leaf-100 hover:bg-leaf-200 text-leaf-800 py-2 rounded-xl font-semibold transition-colors">
          Ver detalhes
        </button>
      </div>
    </div>
  `).join('');
}

// Product detail screen
function renderProductDetails(id) {
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  document.getElementById('product-emoji').textContent = product.emoji;
  document.getElementById('product-category').textContent = product.category;
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-description').textContent = product.description;
  document.getElementById('product-price').textContent = formatPrice(product.price);
  document.getElementById('product-quantity').value = 1;
}

function increaseProductQuantity() {
  const input = document.getElementById('product-quantity');
  input.value = Number(input.value) + 1;
}

function decreaseProductQuantity() {
  const input = document.getElementById('product-quantity');
  const value = Number(input.value);
  if (value > 1) input.value = value - 1;
}

// Cart logic
function addToCart(productId) {
  const qtyInput = document.getElementById('product-quantity');
  const quantity = qtyInput ? qtyInput.value : '1';
  const product = PRODUCTS.find(p => p.id === productId);
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity = existing.quantity += Number(quantity);
  } else {
    cart.push({ ...product, quantity: Number(quantity) });
  }

  saveCart();
  renderCart();
  updateCartBadge();
  showHome();
}

function addToCartFromProduct() {
  if (currentProductId) {
    addToCart(currentProductId);
  }
}

function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  cart.splice(index, 1);
  saveCart();
  renderCart();
  updateCartBadge();
}

function changeCartQuantity(productId, delta) {
  const item = cart.find(item => item.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
  updateCartBadge();
}

function calculateTotal() {
  return cart.reduce((sum, item) => sum + (item.price) * item.quantity, 0);
}

function renderCart() {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6">
        <p class="text-leaf-700 text-lg font-medium">Seu carrinho está vazio. 🛒</p>
        <button onclick="showHome()" class="mt-3 text-leaf-600 font-semibold hover:underline">Ver produtos</button>
      </div>
    `;
  }

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'flex flex-col sm:flex-row items-center gap-4 py-4 border-b border-leaf-100 last:border-b-0';
    row.innerHTML = `
      <div class="w-16 h-16 bg-gradient-to-br from-leaf-200 to-leaf-400 rounded-2xl flex items-center justify-center text-3xl shrink-0">
        ${item.emoji}
      </div>
      <div class="flex-1 text-center sm:text-left">
        <h4 class="font-bold text-gray-800">${item.name}</h4>
        <p class="text-sm text-gray-500">${formatPrice(item.price)} unidade</p>
      </div>
      <div class="flex items-center bg-earth-100 rounded-full overflow-hidden">
        <button onclick="changeCartQuantity(${item.id}, -1)" class="px-3 py-1 hover:bg-leaf-200 transition-colors text-leaf-800 font-bold">−</button>
        <span class="w-10 text-center font-semibold">${item.quantity}</span>
        <button onclick="changeCartQuantity(${item.id}, 1)" class="px-3 py-1 hover:bg-leaf-200 transition-colors text-leaf-800 font-bold">+</button>
      </div>
      <p class="font-bold text-leaf-700 min-w-[80px] text-right">${formatPrice(item.price * item.quantity)}</p>
      <button onclick="removeFromCart(${item.id})" class="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-semibold">
        Remover
      </button>
    `;
    container.appendChild(row);
  });

  document.getElementById('cart-total').textContent = formatPrice(calculateTotal());
}

// Checkout summary
function renderCheckoutSummary() {
  const container = document.getElementById('checkout-summary');
  container.innerHTML = cart.map(item => `
    <div class="flex justify-between items-center py-2 border-b border-leaf-100 last:border-b-0">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${item.emoji}</span>
        <div>
          <p class="font-semibold text-gray-800">${item.name}</p>
          <p class="text-sm text-gray-500">${item.quantity}x ${formatPrice(item.price)}</p>
        </div>
      </div>
      <p class="font-bold text-leaf-700">${formatPrice(item.price * item.quantity)}</p>
    </div>
  `).join('');

  document.getElementById('checkout-total').textContent = formatPrice(calculateTotal());
}

function confirmOrder(event) {
  event.preventDefault();
  showCheckoutSuccess();
}

// Persistence
function saveCart() {
  localStorage.setItem('ecostore_cart', JSON.stringify(cart));
}

function loadCart() {
  const data = localStorage.getItem('ecostore_cart');
  return data ? JSON.parse(data) : [];
}

// Badge
function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  badge.textContent = cart.length;
}
