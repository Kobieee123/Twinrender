// netlify/functions/create-checkout.js
const stripe = require("stripe");

exports.handler = async (event) => {
  try {
    // check mode (default = test)
    const mode = process.env.MODE || "test";

    // choose the correct secret key from Netlify environment variables
    const secretKey =
      mode === "live"
        ? process.env.STRIPE_SECRET_KEY   // live key
        : process.env.STRIPE_SECRET_KEY_TEST; // test key

    const stripeClient = stripe(secretKey);

    // parse request body
    const { lineItems, successUrl, cancelUrl } = JSON.parse(event.body);

    // create checkout session
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
