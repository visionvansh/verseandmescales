// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verseandme Scales",
  description: "Platform build for selling",
  icons: { icon: "/logomake2.JPG" },
  // ✅ FIX: Add permissions policy to prevent PayPal geolocation errors
  other: {
    'permissions-policy': 'geolocation=(), microphone=(), camera=()',
  },
};

export const dynamic = 'force-dynamic';

// ✅ Initialize cache warming AFTER database is ready
let cacheInitialized = false;

if (typeof window === 'undefined' && !cacheInitialized) {
  cacheInitialized = true;
  
  // ✅ Wait for Next.js to be ready, then initialize
  setTimeout(() => {
    console.log('🔥 Initializing cache warming (delayed)...');
    
    import('@/lib/cache/init').then(({ initializeCacheWarming }) => {
      initializeCacheWarming().catch(err => {
        console.error('❌ Cache init failed:', err);
      });
    });
  }, 5000); // ✅ Wait 5 seconds after app starts
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/logomake2.JPG" type="image/JPG" />
        {/* ✅ FIX: Additional meta tag for PayPal permissions */}
        <meta 
          httpEquiv="Permissions-Policy" 
          content="geolocation=(), microphone=(), camera=()" 
        />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}