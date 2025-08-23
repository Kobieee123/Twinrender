// netlify/functions/create-checkout.js
const Stripe = require('stripe');

// ==== MANUAL SWITCH ====
// Zet "test" of "live" in de client (index.html) mee in de payload,
// of hardcode hieronder indien je wilt.
const SECRET_KEYS = {
  test: "sk_test_51RxuD8HoOWyFBTgUaxgO5MOesc7LbG8AWRzK6257nKL7Zn6fxKrWKUWSFPFfPZIHrCpF2f4HKFNjj2yB3vNVgm2000a9Xa4Ysx", // <-- jouw TEST secret key
  live: "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"  // <-- jouw LIVE secret key
};

exports.handler = async (event) => {
  // CORS for local tests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: cors()
    };
  }

  try {
    const { mode = "test", items = [], customer = {}, successUrl, cancelUrl } = JSON.parse(event.body||'{}');
    const stripe = new Stripe(SECRET_KEYS[mode] || SECRET_KEYS.test);

    // Bereken bedrag (centen)
    const amount = Math.round(items.reduce((s, it) => s + (Number(it.price)||0) * (it.qty||1), 0) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customer.email || undefined,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: items.map(i=>i.title).join(' + ') || 'Twinrender order' },
          unit_amount: amount,
        },
        quantity: 1
      }],
      success_url: successUrl || 'https://twinrender.netlify.app/success.html',
      cancel_url: cancelUrl || 'https://twinrender.netlify.app/',
    });

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({ id: session.id })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: cors(),
      body: err.message
    };
  }
};

function cors(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };
}
