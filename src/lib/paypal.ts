// src/lib/paypal.ts

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ✅ FIX: Use server-side APP_URL
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface PayPalOrderData {
  amount: number;
  currency: string;
  courseId: string;
  buyerId: string;
  sellerId: string;
  description: string;
}

export function calculatePlatformFee(amountInCents: number): number {
  return Math.round(amountInCents * 0.10);
}

export function calculateSellerAmount(amountInCents: number): number {
  const platformFee = calculatePlatformFee(amountInCents);
  return amountInCents - platformFee;
}

let accessTokenCache: { token: string; expiresAt: number } | null = null;

async function getPayPalAccessToken(): Promise<string> {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return accessTokenCache.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal auth error:', error);
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000) - 60000,
  };

  return data.access_token;
}

export async function createPayPalOrder(orderData: PayPalOrderData) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const amountInCents = Math.round(orderData.amount * 100);
    const platformFee = calculatePlatformFee(amountInCents);
    const sellerAmount = calculateSellerAmount(amountInCents);

    // ✅ FIX: Properly construct URLs
    const returnUrl = `${APP_URL}/users/courses/${orderData.courseId}/checkout/success`;
    const cancelUrl = `${APP_URL}/users/courses/${orderData.courseId}/checkout`;

    console.log('🔧 Creating PayPal order with URLs:', {
      returnUrl,
      cancelUrl,
      APP_URL,
    });

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderData.courseId,
          custom_id: JSON.stringify({
            courseId: orderData.courseId,
            buyerId: orderData.buyerId,
            sellerId: orderData.sellerId,
            platformFee: platformFee / 100,
            sellerAmount: sellerAmount / 100,
          }),
          description: orderData.description,
          amount: {
            currency_code: orderData.currency,
            value: orderData.amount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: orderData.currency,
                value: orderData.amount.toFixed(2),
              },
            },
          },
          items: [
            {
              name: orderData.description,
              unit_amount: {
                currency_code: orderData.currency,
                value: orderData.amount.toFixed(2),
              },
              quantity: '1',
            },
          ],
        },
      ],
      application_context: {
        brand_name: 'Your Platform Name',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    console.log('📤 PayPal order payload:', JSON.stringify(orderPayload, null, 2));

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal order creation error:', error);
      throw new Error('Failed to create PayPal order');
    }

    const order = await response.json();
    
    console.log('✅ PayPal order created:', {
      orderId: order.id,
      status: order.status,
    });

    return {
      orderId: order.id,
      approvalUrl: order.links.find((link: any) => link.rel === 'approve')?.href,
    };
  } catch (error) {
    console.error('❌ PayPal order creation failed:', error);
    throw error;
  }
}

export async function capturePayPalOrder(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal capture error:', error);
      throw new Error('Failed to capture PayPal payment');
    }

    const captureData = await response.json();
    console.log('✅ PayPal payment captured:', captureData.id);
    
    return captureData;
  } catch (error) {
    console.error('❌ PayPal capture failed:', error);
    throw error;
  }
}

export async function getPayPalOrderDetails(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    
    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('PayPal order details error:', error);
      throw new Error('Failed to get PayPal order details');
    }

    const orderDetails = await response.json();
    return orderDetails;
  } catch (error) {
    console.error('❌ Failed to get PayPal order details:', error);
    throw error;
  }
}