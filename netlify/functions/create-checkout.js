// netlify/functions/create-checkout.js
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  try {
    // 1) CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    // 2) Only POST is allowed
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method Not Allowed' }),
      };
    }

    // 3) Parse JSON safely
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }

    const {
      mode = 'test',
      items = [],
      customer = {},
      successUrl,
      cancelUrl,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No items provided' }),
      };
    }
    if (!successUrl || !cancelUrl) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing successUrl or cancelUrl' }),
      };
    }

    // 4) Pick the correct Stripe secret from Netlify env vars
    //    - STRIPE_SECRET_KEY       -> live
    //    - STRIPE_SECRET_KEY_TEST  -> test
    const LIVE = process.env.STRIPE_SECRET_KEY;
    const TEST = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY; // fallback
    const secret = mode === 'live' ? LIVE : TEST;

    if (!secret) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Stripe secret key is not set' }),
      };
    }

    const stripe = require('stripe')(secret);

    const line_items = items.map((it) => ({
      quantity: Number(it.qty || 1),
      price_data: {
        currency: 'eur',
        unit_amount: Math.round(Number(it.price) * 100),
        product_data: { name: it.title || 'Item' },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: customer.email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session.id }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
