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
};

export const dynamic = 'force-dynamic';

// ✅ Initialize cache warming ONCE at module level (not on every render)
let cacheInitialized = false;

if (typeof window === 'undefined' && !cacheInitialized) {
  cacheInitialized = true;
  console.log('🔥 Initializing cache warming (once)...');
  
  // ✅ Use dynamic import to prevent blocking
  import('@/lib/cache/init').then(({ initializeCacheWarming }) => {
    initializeCacheWarming().catch(err => {
      console.error('❌ Cache init failed:', err);
    });
  });
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