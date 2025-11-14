// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { initializeCacheWarming } from "@/lib/cache/init";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verseandme Scales",
  description: "Platform build for selling",
  icons: {
    icon: "/logomake2.JPG",
  },
};

export const dynamic = 'force-dynamic'

// ✅ Initialize cache warming once at module load (server-side only)
if (typeof window === 'undefined') {
  console.log('🔥 Root layout loaded on server, initializing cache warming...');
  initializeCacheWarming().catch(err => {
    console.error('❌ Cache warming initialization failed:', err);
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