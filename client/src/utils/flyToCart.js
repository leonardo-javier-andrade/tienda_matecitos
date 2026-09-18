/**
 * Fly-to-cart animation utility.
 * Creates a clone of the product image and animates it flying
 * toward the cart button in the nav bar.
 */
export function flyToCart(imgElement) {
  const cartBtn = document.querySelector('[data-cart-target]');
  if (!imgElement || !cartBtn) return;

  const imgRect = imgElement.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();

  // Create flying clone
  const clone = document.createElement('img');
  clone.src = imgElement.src;
  clone.className = 'fly-to-cart-clone';
  clone.style.cssText = `
    position: fixed;
    z-index: 9999;
    top: ${imgRect.top}px;
    left: ${imgRect.left}px;
    width: ${imgRect.width}px;
    height: ${imgRect.height}px;
    object-fit: cover;
    border-radius: 12px;
    pointer-events: none;
    transition: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(clone);

  // Calculate destination (center of cart button)
  const destX = cartRect.left + cartRect.width / 2 - 14;
  const destY = cartRect.top + cartRect.height / 2 - 14;

  // Force reflow before applying animation
  clone.offsetHeight;

  // Apply animation
  clone.style.transition = 'all 0.65s cubic-bezier(0.2, 0.6, 0.35, 1)';
  clone.style.top = `${destY}px`;
  clone.style.left = `${destX}px`;
  clone.style.width = '28px';
  clone.style.height = '28px';
  clone.style.borderRadius = '50%';
  clone.style.opacity = '0.3';
  clone.style.transform = 'rotate(20deg)';
  clone.style.boxShadow = 'none';

  // Pulse the cart button on arrival
  clone.addEventListener('transitionend', () => {
    clone.remove();
    cartBtn.classList.add('cart-pulse');
    setTimeout(() => cartBtn.classList.remove('cart-pulse'), 400);
  }, { once: true });

  // Safety cleanup
  setTimeout(() => {
    if (clone.parentNode) clone.remove();
  }, 1000);
}

/**
 * Fly-to-cart for when there's no <img> element (e.g. placeholder).
 * Creates a small emoji element instead.
 */
export function flyToCartPlaceholder(sourceElement) {
  const cartBtn = document.querySelector('[data-cart-target]');
  if (!sourceElement || !cartBtn) return;

  const srcRect = sourceElement.getBoundingClientRect();
  const cartRect = cartBtn.getBoundingClientRect();

  const el = document.createElement('div');
  el.textContent = '🧉';
  el.style.cssText = `
    position: fixed;
    z-index: 9999;
    top: ${srcRect.top + srcRect.height / 2 - 20}px;
    left: ${srcRect.left + srcRect.width / 2 - 20}px;
    width: 40px;
    height: 40px;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  `;

  document.body.appendChild(el);
  el.offsetHeight;

  el.style.transition = 'all 0.65s cubic-bezier(0.2, 0.6, 0.35, 1)';
  el.style.top = `${cartRect.top}px`;
  el.style.left = `${cartRect.left}px`;
  el.style.width = '20px';
  el.style.height = '20px';
  el.style.fontSize = '0.8rem';
  el.style.opacity = '0.3';

  el.addEventListener('transitionend', () => {
    el.remove();
    cartBtn.classList.add('cart-pulse');
    setTimeout(() => cartBtn.classList.remove('cart-pulse'), 400);
  }, { once: true });

  setTimeout(() => {
    if (el.parentNode) el.remove();
  }, 1000);
}
