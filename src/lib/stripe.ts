//Volumes/vision/codes/course/my-app/src/lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover', // ✅ Use the version TypeScript expects
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