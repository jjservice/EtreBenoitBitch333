// Initialize cart from localStorage if it exists, otherwise an empty array
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Function to update the cart display
function updateCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  cartItemsContainer.innerHTML = '';
  let total = 0;
  let totalItems = 0; // Track the total number of items in the cart

  cart.forEach(item => {
    // Validate item properties to prevent displaying undefined values
    if (!item.id || !item.name || !item.image || isNaN(item.price) || isNaN(item.quantity)) {
      console.error("Invalid item in cart:", item);
      return; // Skip rendering this item if it's invalid
    }

    const cartItem = document.createElement('div');
    cartItem.classList.add('cart-item');
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <span>${item.name} - $${item.price}</span>
      
      <!-- Quantity input field -->
      <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-product-id="${item.id}">
      
      <span class="item-total-price">Total: $${(item.price * item.quantity).toFixed(2)}</span>
      
      <!-- Remove button -->
      <button class="remove-item" data-product-id="${item.id}">Remove</button>
    `;

    // Add event listener for the quantity input
    const quantityInput = cartItem.querySelector('.quantity-input');
    quantityInput.addEventListener('input', (e) => {
      const newQuantity = parseInt(e.target.value);
      if (newQuantity > 0) {
        updateItemQuantity(item.id, newQuantity);
      } else {
        // If invalid input (quantity less than 1), reset to the current quantity
        e.target.value = item.quantity;
      }
    });

    // Add to cart container
    cartItemsContainer.appendChild(cartItem);
    total += parseFloat(item.price) * item.quantity; // Update total based on quantity
    totalItems += item.quantity; // Add to total number of items in the cart
  });

  // Update total price
  document.getElementById('cart-total').textContent = `Total: $${total.toFixed(2)}`;

  // Show or hide the checkout button based on cart contents
  const checkoutBtn = document.getElementById('checkout-btn');
  checkoutBtn.style.display = cart.length > 0 ? 'inline-block' : 'none';

   // Show or hide the checkout button based on cart contents
   const promoInput = document.getElementById('promoCode');
   promoInput.style.display = cart.length > 0 ? 'flex' : 'none';

  // Update the cart item count indicator
  document.getElementById('cart-item-count').textContent = totalItems;
}


// Function to update item quantity in the cart
function updateItemQuantity(productId, newQuantity) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex !== -1) {
    cart[itemIndex].quantity = newQuantity;
    updateCart(); // Re-render the cart after updating quantity
  }
}


// Function to show a message when an item is added
function showAddToCartMessage(item) {

      // Play a notification sound
      const notificationSound = new Audio('./Flight-Sound.mp3'); // Provide the correct path to your sound file

      // Handle potential errors for the sound file
      notificationSound.onerror = function() {
        console.error('Error loading the sound file.');
      };
    
      // Ensure the sound plays after the user interaction
      notificationSound.play().catch(function(error) {
        console.error('Audio play failed:', error);
      });
    

  // Get the notification and the message element
  const notification = document.getElementById('custom-notification');
  const message = document.getElementById('notification-message');

  // Set the message content
  message.textContent = `Added ${item.quantity} x ${item.name} to your cart!`;

  // Show the notification by adding the 'show' class
  notification.classList.add('show');

  // Hide the notification after 5 seconds
  setTimeout(function() {
    notification.classList.remove('show');
  }, 5000);
}

// Example of how this could be triggered (add an item to the cart)
function addToCart(item) {
  showAddToCartMessage(item);
}



// Handle the 'Add to Cart' button click
document.querySelectorAll('.buy-now').forEach(button => {
  button.addEventListener('click', (event) => {
    const productId = event.target.getAttribute('data-product-id');
    const productName = event.target.getAttribute('data-name');
    const price = parseFloat(event.target.getAttribute('data-price'));
    const image = event.target.closest('.product').querySelector('img').src; // Get the product image URL
    const quantity = parseInt(event.target.closest('.product').querySelector('.quantity-input').value);
    const quantityInput = document.querySelector(`.quantity-input[data-product-id="${productId}"]`);

    const maxQuantity = quantityInput.getAttribute('max');
    const currentQuantity = quantityInput.value;

    // Check if the quantity exceeds the max limit
    if (parseInt(currentQuantity) > parseInt(maxQuantity)) {
      alert('The quantity exceeds the maximum allowed, product may be refunded!');
      return;  // Prevent adding to the cart
    }

    // Check if quantity is a valid number
    if (isNaN(quantity) || quantity <= 0) {
      alert("Please select a valid quantity.");
      return;
    }

    // Ensure all product data is valid before adding to the cart
    if (!productId || !productName || isNaN(price) || !image || isNaN(quantity) || quantity <= 0) {
      alert("Missing or invalid product data.");
      return;
    }

    // Add product to cart with image and quantity
    const existingItemIndex = cart.findIndex(item => item.id === productId);
    if (existingItemIndex === -1) {
      // Item is not already in the cart, add it
      cart.push({ id: productId, name: productName, price: price, image: image, quantity: quantity });
    } else {
      // Item is already in the cart, update quantity
      cart[existingItemIndex].quantity += quantity;
    }

    // Save the updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Show a message when item is added
    showAddToCartMessage({ name: productName, quantity });

    // Update the cart display
    updateCart();
  });
});

// Handle 'Remove' button click from cart
document.getElementById('cart-items').addEventListener('click', (event) => {
  if (event.target.classList.contains('remove-item')) {
    const productId = event.target.getAttribute('data-product-id');

    cart = cart.filter(item => item.id !== productId);

    // Save the updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update the cart display
    updateCart();
  }
});

// Initialize the cart display on page load
updateCart();


const stripe = Stripe('pk_live_51QTSb2LPa32ZluPp1YadZwNsFhMmn4a5u1sYzy0bgbIL1yD1LFuGXQcn3CgEBAwaBucY7RK5GwT51oEo44hDNbvo001nhm4Exe');

document.getElementById('checkout-btn').addEventListener('click', async () => {
  // Get the promo code and selected currency
  const promoCode = document.getElementById('promoCode').value;
  const currency = document.getElementById('currency-selector').value;

  // Send request to the server to create the checkout session with the cart items, promo code, and currency
  const response = await fetch('/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart, promoCode: promoCode, currency: currency }) // Include currency here
  });

  // Parse the session ID from the response
  const session = await response.json();

  // Redirect to Stripe Checkout with the session ID
  const { error } = await stripe.redirectToCheckout({ sessionId: session.id });

  if (error) {
    console.error('Error:', error);
  }
});
