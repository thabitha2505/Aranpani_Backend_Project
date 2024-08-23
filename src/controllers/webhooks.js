const express = require('express');
const Stripe = require('stripe');
const Payment = require('../entities/Payment');
const dataSource = require('../dataSource');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    console.log('Received webhook request headers:', req.headers);
    console.log('Request body:', req.body.toString());

    if (!sig) {
        console.error('No stripe-signature header value was provided.');
        return res.status(400).send('Webhook Error: No stripe-signature header value was provided.');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            try {
                const paymentRepository = dataSource.getRepository(Payment);
                const payment = await paymentRepository.findOne({
                    where: { stripe_payment_intent_id: paymentIntent.id },
                });

                if (payment) {
                    payment.trans_status = 'completed';
                    payment.paid_amt = paymentIntent.amount_received / 100; // Stripe amount is in cents
                    payment.payment_link_enabled = true;
                    await paymentRepository.save(payment);
                }
            } catch (err) {
                console.error('Error updating payment record:', err);
                return res.status(500).send('Server error');
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

module.exports = router;
