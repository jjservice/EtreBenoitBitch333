const express = require('express');
const Stripe = require('stripe');
require('dotenv').config(); // Load environment variables from .env file
const axios = require('axios'); // Import axios for API requests

const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Access Stripe key from .env
const bodyParser = require('body-parser');
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Currency conversion function
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    console.log('No conversion needed, currencies are the same');
    return amount; // No conversion needed if the currencies are the same
  }

  try {
    const apiKey = '9b5f32e0f280df881b2e2bb80ba1c383'; // CurrencyLayer API Key
    const url = `https://api.currencylayer.com/live?access_key=${apiKey}&source=${fromCurrency}&currencies=${toCurrency}`;

    // Fetch conversion rates from CurrencyLayer API
    const response = await axios.get(url);
    console.log('CurrencyLayer API Response:', response.data);

    // Check if the API request was successful and the rates are available
    if (response.data.success !== true) {
      throw new Error('CurrencyLayer API request failed');
    }

    // Extract the exchange rate for the target currency
    const exchangeRate = response.data.quotes[`${fromCurrency}${toCurrency}`];

    if (!exchangeRate) {
      throw new Error(`Exchange rate not available for ${toCurrency}`);
    }

    // Convert the amount to the target currency
    const convertedAmount = Math.round(amount * exchangeRate);
    console.log(`Converted ${amount} from ${fromCurrency} to ${toCurrency}: ${convertedAmount}`);
    return convertedAmount;
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error('Currency conversion failed');
  }
};

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items, promoCode, currency } = req.body; // Get the currency from the request

    // Log received items, promoCode, and currency for debugging
    console.log('Received items:', items);
    console.log('Promo Code:', promoCode);
    console.log('Currency:', currency); // Log the selected currency

    // Default to USD if no currency is provided
    const selectedCurrency = currency ? currency.toUpperCase() : 'USD';

    // Create a map to accumulate quantities for each item
    const itemMap = items.reduce((acc, item) => {
      if (acc[item.name]) {
        acc[item.name].quantity += item.quantity;
      } else {
        acc[item.name] = { ...item };
      }
      return acc;
    }, {});

    // Convert the item map back to an array of line items
    const line_items = Object.values(itemMap).map(item => {
      console.log(`Creating line item for: ${item.name}, price: ${item.price}, quantity: ${item.quantity}`);
      return {
        price_data: {
          currency: 'USD', // Keep currency as USD for the initial calculation
          product_data: {
            name: item.name,
            images: [item.image], // Add image URL(s) for the product
          },
          unit_amount: Math.round(item.price * 100), // Price in cents (Stripe requires prices in cents)
        },
        quantity: item.quantity,
      };
    });

    // Calculate the total amount (in cents) for USD
    const totalAmountUSD = line_items.reduce((total, item) => total + (item.price_data.unit_amount * item.quantity), 0);
    console.log(`Total amount in USD: ${totalAmountUSD}`);

    // Convert the total amount to the selected currency
    const finalAmount = await convertCurrency(totalAmountUSD, 'USD', selectedCurrency);
    console.log(`Total amount after currency conversion: ${finalAmount}`);

    // Recalculate line items to reflect the converted amount
    const convertedLineItems = line_items.map(item => {
      const convertedUnitAmount = Math.round(item.price_data.unit_amount * (finalAmount / totalAmountUSD));
      console.log(`Converted unit amount for ${item.name}: ${convertedUnitAmount}`);
      return {
        price_data: {
          currency: selectedCurrency, // Set to selected currency
          product_data: {
            name: item.price_data.product_data.name,
            images: item.price_data.product_data.images,
          },
          unit_amount: convertedUnitAmount, // Use converted amount for Stripe
        },
        quantity: item.quantity,
      };
    });

    let discount = 0;
    if (promoCode) {
      if (promoCode === 'DISCOUNT10') {
        // Apply a 10% discount if the promo code is valid
        discount = Math.round(finalAmount * 0.10);
        console.log('Applying 10% discount:', discount);
      } else if (promoCode === 'FLAT5') {
        // Apply a flat $5 discount
        discount = 500; // = $5 in cents
        console.log('Applying flat $5 discount:', discount);
      }
    }

    // Adjust the total price after the discount
    const amountAfterDiscount = finalAmount - discount;
    console.log(`Amount after discount: ${amountAfterDiscount}`);

    // Create a discount coupon if needed
    let discountCoupon = null;
    if (discount > 0) {
      discountCoupon = await stripe.coupons.create({
        amount_off: discount,
        currency: selectedCurrency, // Set currency for coupon
      });
      console.log('Discount coupon created:', discountCoupon.id);
    }

    // Create the checkout session with the selected currency and converted total
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: convertedLineItems, // Use the converted line items here
      mode: 'payment',
      success_url: 'https://jjservice.github.io/L-Su-Ca/successEtre.html',
      cancel_url: 'https://jjservice.github.io/L-Su-Ca/cancelEtre.html',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'], // Allowed shipping countries
      },
      billing_address_collection: 'required', // Collect billing address
      discounts: discountCoupon ? [{
        coupon: discountCoupon.id, // Apply the created discount coupon
      }] : [], // Only apply discount if there is one
    });

    // Send the session ID to the frontend
    console.log('Stripe session created with ID:', session.id);
    res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating session:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Serve static files (for success/cancel pages)
app.use(express.static('public'));

// Start the server
app.listen(4400, () => {
  console.log('Server running on http://localhost:4400');
});
