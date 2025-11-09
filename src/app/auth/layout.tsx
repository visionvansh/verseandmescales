// app/auth/layout.tsx
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RedirectLoader } from '@/components/ui/RedirectLoader';
import { LazyMotion, domAnimation } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setShowRedirect(true);
      setTimeout(() => {
        router.push('/users');
      }, 2000);
    }
  }, [isAuthenticated, isLoading, router]);

  if (showRedirect) {
    return (
      <RedirectLoader
        message="Already signed in!"
        submessage="Redirecting to your dashboard..."
        icon="verified"
        show={true}
      />
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen overflow-hidden bg-black">
        {/* Clean Background - No decorative blocks */}
        <div className="absolute inset-0 z-0">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-red-950/10" />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                linear-gradient(rgba(239, 68, 68, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(239, 68, 68, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
          
          {/* Vignette effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <main className="relative">
          {children}
        </main>
      </div>
    </LazyMotion>
  );
}