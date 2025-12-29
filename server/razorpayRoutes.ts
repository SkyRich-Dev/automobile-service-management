import type { Express, Request, Response } from 'express';
import { createRazorpayOrder, verifyRazorpayPayment, fetchRazorpayPayment, getRazorpayConfig, setRazorpayConfig } from './razorpayClient';

export function registerRazorpayRoutes(app: Express) {
  app.get('/api/razorpay/config', async (req: Request, res: Response) => {
    try {
      const config = getRazorpayConfig();
      if (!config) {
        return res.json({ configured: false });
      }
      res.json({ keyId: config.keyId, configured: true });
    } catch (error: any) {
      console.error('Error getting Razorpay config:', error);
      res.status(500).json({ error: 'Failed to get Razorpay configuration' });
    }
  });

  app.post('/api/razorpay/configure', async (req: Request, res: Response) => {
    try {
      const { keyId, keySecret } = req.body;

      if (!keyId || !keySecret) {
        return res.status(400).json({ error: 'Key ID and Key Secret are required' });
      }

      const testResponse = await fetch('https://api.razorpay.com/v1/orders?count=1', {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
        }
      });

      if (!testResponse.ok) {
        return res.status(400).json({ error: 'Invalid Razorpay credentials' });
      }

      setRazorpayConfig({ keyId, keySecret });

      res.json({ success: true, message: 'Razorpay configured successfully' });
    } catch (error: any) {
      console.error('Error configuring Razorpay:', error);
      res.status(500).json({ error: 'Failed to configure Razorpay' });
    }
  });

  app.post('/api/razorpay/create-order', async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'INR', invoiceId, notes } = req.body;

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const receipt = invoiceId ? `invoice_${invoiceId}` : `order_${Date.now()}`;
      const order = await createRazorpayOrder(
        amount,
        currency,
        receipt,
        { invoiceId: invoiceId || '', ...notes }
      );

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      });
    } catch (error: any) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: error.message || 'Failed to create order' });
    }
  });

  app.post('/api/razorpay/verify-payment', async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing required payment details' });
      }

      const isValid = await verifyRazorpayPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (isValid) {
        const payment = await fetchRazorpayPayment(razorpay_payment_id);
        res.json({
          verified: true,
          payment: {
            id: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
          },
        });
      } else {
        res.status(400).json({ verified: false, error: 'Payment verification failed' });
      }
    } catch (error: any) {
      console.error('Error verifying Razorpay payment:', error);
      res.status(500).json({ error: error.message || 'Failed to verify payment' });
    }
  });

  app.get('/api/razorpay/payment/:paymentId', async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      const payment = await fetchRazorpayPayment(paymentId);

      res.json({
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at,
      });
    } catch (error: any) {
      console.error('Error fetching Razorpay payment:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch payment' });
    }
  });
}
