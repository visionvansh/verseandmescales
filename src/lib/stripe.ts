// src/lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

// Platform fee percentage
export const PLATFORM_FEE_PERCENTAGE = parseInt(
  process.env.PLATFORM_FEE_PERCENTAGE || '10'
);

export function calculatePlatformFee(amount: number): number {
  return Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100);
}

export function calculateSellerAmount(amount: number): number {
  return amount - calculatePlatformFee(amount);
}

// ✅ SIMPLIFIED: Create Stripe Checkout Session (NO Connect)
export async function createStripeCheckoutSession({
  amount,
  currency,
  courseId,
  buyerId,
  sellerId,
  sellerEmail,
  sellerName,
  courseName,
  courseDescription,
  courseThumbnail,
  successUrl,
  cancelUrl,
  customerEmail,
}: {
  amount: number;
  currency: string;
  courseId: string;
  buyerId: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  courseName: string;
  courseDescription?: string;
  courseThumbnail?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
}) {
  const amountInCents = Math.round(amount * 100);
  const platformFee = calculatePlatformFee(amountInCents);
  const sellerAmount = calculateSellerAmount(amountInCents);

  console.log('💰 Payment breakdown:', {
    total: amountInCents / 100,
    platformFee: platformFee / 100,
    sellerAmount: sellerAmount / 100,
    sellerId,
    sellerEmail,
  });

  // ✅ Create or retrieve Stripe product
  const product = await stripe.products.create({
    name: courseName,
    description: courseDescription || `Access to ${courseName}`,
    images: courseThumbnail ? [courseThumbnail] : [],
    metadata: {
      courseId,
      sellerId,
      sellerEmail,
      sellerName,
    },
  });

  // ✅ Create price with automatic tax
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amountInCents,
    currency: currency.toLowerCase(),
    tax_behavior: 'exclusive', // Tax added on top
    metadata: {
      courseId,
      sellerId,
    },
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'us_bank_account', 'cashapp', 'link'],
    mode: 'payment',
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    
    // ✅ AUTOMATIC TAX COLLECTION
    automatic_tax: {
      enabled: true,
    },
    
    // ✅ Collect customer address for tax calculation
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: [
        'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 
        'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'IE', 'NZ',
        'SG', 'JP', 'KR', 'MX', 'BR', 'AE', 'SA', 'ZA', 'IN',
        'CN', 'TH', 'MY', 'PH', 'ID', 'VN', 'CO', 'PE', 'AR',
        'CL', 'IL', 'EG', 'KE', 'NG', 'PL', 'CZ', 'RO', 'GR',
      ],
    },
    
    // ✅ Tax ID collection for businesses
    tax_id_collection: {
      enabled: true,
    },
    
    metadata: {
      courseId,
      buyerId,
      sellerId,
      sellerEmail,
      sellerName,
      platformFee: (platformFee / 100).toFixed(2),
      sellerAmount: (sellerAmount / 100).toFixed(2),
    },
    
    // ✅ NO CONNECT - All money goes to your account
    payment_intent_data: {
      metadata: {
        courseId,
        buyerId,
        sellerId,
        sellerEmail,
        sellerName,
        platformFee: (platformFee / 100).toFixed(2),
        sellerAmount: (sellerAmount / 100).toFixed(2),
      },
    },
    
    success_url: successUrl,
    cancel_url: cancelUrl,
    
    // ✅ Allow promotional codes
    allow_promotion_codes: true,
    
    // ✅ Consent collection
    consent_collection: {
      terms_of_service: 'required',
    },
    
    // ✅ Custom branding
    custom_text: {
      submit: {
        message: 'Complete your purchase to get instant access. Tax will be calculated based on your location.',
      },
      shipping_address: {
        message: 'We collect your address for tax calculation purposes only.',
      },
    },
    
    // ✅ Customer fields
    phone_number_collection: {
      enabled: true,
    },
  });

  console.log('✅ Stripe session created (all funds to platform):', {
    sessionId: session.id,
    amount: amountInCents / 100,
    courseId,
    sellerId,
  });

  return session;
}

// ✅ Format tax amount for display
export function formatTaxAmount(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}