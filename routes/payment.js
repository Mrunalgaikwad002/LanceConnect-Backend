const express = require('express');
const router = express.Router();

// Check if Stripe is available
let stripe;
try {
  console.log('Stripe secret key:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing');
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (error) {
  console.error('Stripe not installed or invalid key:', error);
  stripe = null;
}

const authMiddleware = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Create Stripe checkout session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { gigId, gigTitle, freelancerId, amount, currency, customerEmail, customerName } = req.body;
    
    console.log('Creating checkout session with:', { gigId, gigTitle, freelancerId, amount, currency, customerEmail, customerName });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'inr',
            product_data: {
              name: gigTitle,
              description: `Order for ${gigTitle}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://lanceconnect.netlify.app'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://lanceconnect.netlify.app'}/payment-cancelled`,
      metadata: {
        gigId,
        freelancerId,
        customerEmail,
        customerName,
      },
      customer_email: customerEmail,
      billing_address_collection: 'required', // Required for Indian export regulations
      // Remove shipping_address_collection to avoid duplication
    });

    console.log('Stripe session created:', session.id);
    res.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session: ' + error.message });
  }
});

// Confirm payment and create order
router.post('/confirm-payment', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Create order
      const order = new Order({
        orderId: `ORD${Date.now()}`,
        title: session.line_items.data[0].description,
        gig: session.metadata.gigId,
        client: req.user.id,
        freelancer: session.metadata.freelancerId,
        amount: session.amount_total / 100,
        currency: session.currency,
        status: 'in_progress',
        paymentStatus: 'completed',
        stripeSessionId: sessionId,
      });

      await order.save();

      // Create payment record
      const payment = new Payment({
        paymentId: `PAY${Date.now()}`,
        order: order._id,
        client: req.user.id,
        freelancer: session.metadata.freelancerId,
        amount: session.amount_total / 100,
        currency: session.currency,
        paymentMethod: 'stripe',
        paymentGateway: 'stripe',
        status: 'completed',
        stripeSessionId: sessionId,
        gatewayResponse: session,
      });

      await payment.save();

      res.json({ success: true, order: order, payment: payment });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Stripe webhook to handle payment events
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Handle successful payment
    console.log('Payment completed:', session.id);
  }

  res.json({ received: true });
});

// Get payment status
router.get('/status/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({ status: session.payment_status, session });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

module.exports = router; 