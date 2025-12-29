export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

let razorpayConfig: RazorpayConfig | null = null;

export function setRazorpayConfig(config: RazorpayConfig) {
  razorpayConfig = config;
}

export function getRazorpayConfig(): RazorpayConfig | null {
  if (!razorpayConfig) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (keyId && keySecret) {
      razorpayConfig = { keyId, keySecret };
    }
  }
  return razorpayConfig;
}

export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR',
  receipt: string,
  notes?: Record<string, string>
) {
  const config = getRazorpayConfig();
  if (!config) {
    throw new Error('Razorpay not configured');
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Razorpay error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

export async function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const config = getRazorpayConfig();
  if (!config) {
    throw new Error('Razorpay not configured');
  }

  const crypto = await import('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', config.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

export async function fetchRazorpayPayment(paymentId: string) {
  const config = getRazorpayConfig();
  if (!config) {
    throw new Error('Razorpay not configured');
  }

  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Razorpay error: ${JSON.stringify(error)}`);
  }

  return response.json();
}
