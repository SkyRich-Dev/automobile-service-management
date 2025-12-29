import type { Express, Request, Response } from 'express';
import { getUncachableStripeClient, getStripePublishableKey } from './stripeClient';
import { sql } from 'drizzle-orm';
import { db, pool } from './db';

export function registerStripeRoutes(app: Express) {
  app.get('/api/stripe/publishable-key', async (req: Request, res: Response) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error('Error getting publishable key:', error);
      res.status(500).json({ error: 'Failed to get Stripe configuration' });
    }
  });

  app.get('/api/stripe/products', async (req: Request, res: Response) => {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = true ORDER BY name`
      );
      res.json({ data: result.rows });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/stripe/products-with-prices', async (req: Request, res: Response) => {
    try {
      const result = await db.execute(
        sql`
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.active as product_active,
            p.metadata as product_metadata,
            pr.id as price_id,
            pr.unit_amount,
            pr.currency,
            pr.recurring,
            pr.active as price_active
          FROM stripe.products p
          LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          WHERE p.active = true
          ORDER BY p.name, pr.unit_amount
        `
      );

      const productsMap = new Map();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error: any) {
      console.error('Error fetching products with prices:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/stripe/prices', async (req: Request, res: Response) => {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE active = true ORDER BY unit_amount`
      );
      res.json({ data: result.rows });
    } catch (error: any) {
      console.error('Error fetching prices:', error);
      res.status(500).json({ error: 'Failed to fetch prices' });
    }
  });

  app.post('/api/stripe/create-checkout-session', async (req: Request, res: Response) => {
    try {
      const { priceId, amount, invoiceId, customerEmail, successUrl, cancelUrl, currency = 'inr' } = req.body;

      if (!priceId && !amount) {
        return res.status(400).json({ error: 'Price ID or amount is required' });
      }

      const stripe = await getUncachableStripeClient();

      let lineItems: any[];
      if (priceId) {
        lineItems = [{ price: priceId, quantity: 1 }];
      } else {
        lineItems = [{
          price_data: {
            currency: currency,
            product_data: {
              name: `Invoice #${invoiceId || 'Service Payment'}`,
              description: 'AutoServ Enterprise - Service Payment',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }];
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        customer_email: customerEmail,
        success_url: successUrl || `${req.protocol}://${req.get('host')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/payment/cancel`,
        metadata: {
          invoiceId: invoiceId || '',
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  app.post('/api/stripe/create-payment-intent', async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'inr', invoiceId, customerEmail } = req.body;

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const stripe = await getUncachableStripeClient();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: {
          invoiceId: invoiceId || '',
          customerEmail: customerEmail || '',
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  app.get('/api/stripe/payment-status/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const stripe = await getUncachableStripeClient();

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      res.json({
        status: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency,
      });
    } catch (error: any) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({ error: 'Failed to fetch payment status' });
    }
  });
}
