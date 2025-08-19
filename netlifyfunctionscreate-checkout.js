// netlify/functions/create-checkout.js
const Stripe = require('stripe');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { items } = JSON.parse(event.body || '{}');
    if (!Array.isArray(items) || !items.length) {
      return { statusCode: 400, body: 'Missing items' };
    }

    const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // set in Netlify env
    const siteUrl = process.env.SITE_URL || 'http://localhost:8888';

    // Build line items with dynamic price_data in EUR
    const line_items = items.map(it => ({
      quantity: it.quantity || 1,
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(it.price) * 100),
        product_data: { name: String(it.title || 'Twinrender item').slice(0, 120) }
      }
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${siteUrl}/success.html`,
      cancel_url: `${siteUrl}/cancel.html`,
      billing_address_collection: 'auto',
      customer_creation: 'if_required'
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
