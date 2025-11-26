"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { FaLock, FaCreditCard } from "react-icons/fa";

interface StripeCheckoutFormProps {
  courseId: string;
  price: number;
  courseTitle: string;
  paymentIntentId: string;
}

export default function StripeCheckoutForm({
  courseId,
  price,
  courseTitle,
  paymentIntentId,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/users/courses/${courseId}/checkout/success?payment_intent=${paymentIntentId}&method=stripe`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        router.push(
          `/users/courses/${courseId}/checkout/success?payment_intent=${paymentIntent.id}&method=stripe`
        );
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 stripe-form-container">
      <div className="relative stripe-payment-wrapper">
        <div className="absolute inset-0 bg-gray-900/40 rounded-xl border border-red-500/20 backdrop-blur-sm pointer-events-none" />
        <div className="relative p-4 sm:p-5 md:p-6 payment-form-content">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <FaCreditCard className="text-red-400 text-sm sm:text-base" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Payment Details
            </h3>
          </div>

          <div className="stripe-payment-element-container">
            <PaymentElement
              onReady={() => setPaymentReady(true)}
              options={{
                layout: {
                  type: 'tabs',
                  defaultCollapsed: false,
                  radios: false,
                  spacedAccordionItems: isMobile ? false : true,
                },
                paymentMethodOrder: ['card'],
                fields: {
                  billingDetails: {
                    address: {
                      country: 'auto',
                    },
                  },
                },
                wallets: {
                  applePay: 'never',
                  googlePay: 'never',
                },
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 rounded-lg border border-red-500/30 p-3 sm:p-4"
        >
          <p className="text-red-300 text-xs sm:text-sm font-medium">
            {error}
          </p>
        </motion.div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading || !paymentReady}
        className={`
          w-full py-4 rounded-xl font-bold text-base sm:text-lg
          transition-all duration-200
          ${
            loading || !paymentReady
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/30'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay $${price.toFixed(2)}`
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
        <FaLock className="text-green-400" />
        <span>Powered by Stripe • PCI DSS Compliant</span>
      </div>

      <style jsx global>{`
        /* Desktop - keep original overflow behavior */
        @media (min-width: 1024px) {
          .stripe-payment-element-container {
            min-height: 280px;
          }
        }

        /* Mobile - CRITICAL FIXES */
        @media (max-width: 767px) {
          /* Remove ALL overflow restrictions */
          .stripe-form-container,
          .stripe-payment-wrapper,
          .payment-form-content,
          .stripe-payment-element-container {
            overflow: visible !important;
            position: relative !important;
          }

          /* Ensure proper container sizing */
          .stripe-payment-element-container {
            min-height: 400px !important;
            width: 100% !important;
            margin-bottom: 20px;
          }

          /* Force Stripe iframe to be interactive */
          .stripe-payment-element-container iframe,
          .stripe-payment-element-container > div,
          .stripe-payment-element-container * {
            pointer-events: auto !important;
            touch-action: manipulation !important;
            -webkit-user-select: auto !important;
            user-select: auto !important;
            -webkit-tap-highlight-color: transparent !important;
          }

          /* Ensure all parent elements allow interaction */
          body {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }

          /* Fix for iOS specific issues */
          .stripe-payment-element-container input,
          .stripe-payment-element-container select,
          .stripe-payment-element-container button {
            font-size: 16px !important; /* Prevents iOS zoom */
            min-height: 44px !important; /* iOS touch target */
            -webkit-appearance: none !important;
            appearance: none !important;
          }

          /* Ensure Stripe's payment tabs are fully clickable */
          .stripe-payment-element-container [role="tablist"],
          .stripe-payment-element-container [role="tab"],
          .stripe-payment-element-container [role="tabpanel"] {
            pointer-events: auto !important;
            touch-action: manipulation !important;
            cursor: pointer !important;
          }

          /* Remove any z-index conflicts */
          .stripe-form-container {
            z-index: 10 !important;
            isolation: isolate !important;
          }

          .stripe-payment-element-container {
            z-index: 11 !important;
          }

          /* Force visibility */
          .stripe-payment-element-container * {
            visibility: visible !important;
            opacity: 1 !important;
          }

          /* Allow scrolling within Stripe element if needed */
          .stripe-payment-element-container {
            max-height: none !important;
            overflow-y: visible !important;
          }
        }

        /* Tablet */
        @media (min-width: 768px) and (max-width: 1023px) {
          .stripe-payment-element-container {
            min-height: 320px;
            overflow: visible !important;
          }

          .stripe-payment-element-container * {
            pointer-events: auto !important;
            touch-action: manipulation !important;
          }
        }
      `}</style>
    </form>
  );
}