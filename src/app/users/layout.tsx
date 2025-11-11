// app/users/layout.tsx
"use client";

import CommandHeader from "@/components/Navbar";
import { LazyMotion, domAnimation } from "framer-motion";
import { usePathname } from "next/navigation";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isCourseDetailPage = pathname?.match(/^\/users\/courses\/[^/]+$/);

  if (isCourseDetailPage) {
    return <>{children}</>;
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-red-950/10" />
          
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
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        </div>

        {/* ✅ UPDATED: Reduced z-index from z-50 to z-40 */}
        <div className="sticky top-0 z-40">
          <CommandHeader />
        </div>
        
        <main className="relative">
          {children}
        </main>
      </div>
    </LazyMotion>
  );
}