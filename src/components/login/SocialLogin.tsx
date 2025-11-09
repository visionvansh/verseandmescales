// components/auth/SocialLogin.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaApple, FaMicrosoft } from "react-icons/fa";

interface SocialLoginProps {
  onSocialLogin?: (provider: "google" | "apple" | "microsoft") => Promise<void>;
  setError: (error: string | null) => void;
}

const SocialLogin = ({ setError }: SocialLoginProps) => {
  const [isLoading, setIsLoading] = useState<'google' |'microsoft' | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'microsoft') => {
    setIsLoading(provider);
    setError(null);

    try {
      // Generate CSRF state token
      const state = crypto.randomUUID();
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', provider);
      
      // Store current page context
      const currentPath = window.location.pathname;
      const isSignup = currentPath.includes('signup');
      sessionStorage.setItem('oauth_intent', isSignup ? 'signup' : 'signin');
      
      // Redirect to OAuth flow
      const redirectUrl = new URL(`/api/auth/social/${provider}`, window.location.origin);
      redirectUrl.searchParams.set('state', isSignup ? 'signup' : 'signin');
      redirectUrl.searchParams.set('csrf', state);
      
      window.location.href = redirectUrl.toString();
    } catch (err: any) {
      setError(err.message || `${provider} login failed. Please try again.`);
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-gray-300">Sign in with</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <motion.button
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading !== null}
          className="relative bg-gradient-to-br from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 border border-red-500/30 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading === 'google' ? (
            <motion.div 
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <FaGoogle className="text-xl" />
          )}
        </motion.button>

        <motion.button
          onClick={() => handleSocialLogin('microsoft')}
          disabled={isLoading !== null}
          className="relative bg-gradient-to-br from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading === 'microsoft' ? (
            <motion.div 
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <FaMicrosoft className="text-xl" />
          )}
        </motion.button>

       
      
      </div>

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-gray-600/50"></div>
        <span className="text-gray-400 text-sm px-4 bg-gray-900/50 rounded-full py-1">or sign in with email</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-600/50 to-gray-600/50"></div>
      </div>
    </div>
  );
};

export default SocialLogin;