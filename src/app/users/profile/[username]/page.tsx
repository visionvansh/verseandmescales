//Volumes/vision/codes/course/my-app/src/app/users/profile/[username]/page.tsx
"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import FilterSidebar from "@/components/profile/FilterSidebar";
import PrivateProfileCard from "@/components/profile/PrivateProfileCard";
import { User } from "@/components/profile/data/mockProfileData";

interface PageProps {
  params: Promise<{ username: string }>;
}

// Optimized Skeleton Loader Component
const ProfilePageSkeleton = () => {
  return (
    <div className="relative z-10 mt-20">
      {/* Header Skeleton */}
      <div className="relative border-b border-red-500/20 bg-gradient-to-br from-gray-900/90 to-black/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar Skeleton */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800/40 animate-pulse border-4 border-red-500/20" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gray-800/40 animate-pulse border-2 border-red-500/20" 
                   style={{ animationDelay: '100ms' }} />
            </div>

            {/* Info Skeleton */}
            <div className="flex-1 space-y-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  {/* Username */}
                  <div className="h-8 bg-gray-800/40 rounded-lg animate-pulse w-48" />
                  {/* Bio */}
                  <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-full max-w-md" 
                       style={{ animationDelay: '150ms' }} />
                  <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-3/4 max-w-sm" 
                       style={{ animationDelay: '200ms' }} />
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <div className="h-10 w-32 bg-gray-800/40 rounded-lg animate-pulse" 
                       style={{ animationDelay: '250ms' }} />
                  <div className="h-10 w-10 bg-gray-800/40 rounded-lg animate-pulse" 
                       style={{ animationDelay: '300ms' }} />
                </div>
              </div>

              {/* Stats Skeleton */}
              <div className="flex gap-6 pt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="h-6 bg-gray-800/40 rounded-lg animate-pulse w-16" />
                    <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar Skeleton - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <div className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/20 p-5 backdrop-blur-xl">
                {/* Filter Title */}
                <div className="h-6 bg-gray-800/40 rounded-lg animate-pulse w-24 mb-4" />
                
                {/* Filter Options */}
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-gray-800/40 rounded-lg animate-pulse"
                      style={{ animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content Area Skeleton */}
          <div className="space-y-6">
            {/* Tabs Skeleton */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/95 rounded-2xl border border-red-500/20 backdrop-blur-xl">
              <div className="flex gap-2 p-4 border-b border-red-500/10">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-800/40 rounded-lg animate-pulse flex-1 max-w-[120px]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>

              {/* Content Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-gray-800/20 rounded-xl border border-red-500/10 p-4 space-y-3"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {/* Image placeholder */}
                      <div className="aspect-video bg-gray-800/40 rounded-lg animate-pulse" />
                      
                      {/* Title */}
                      <div className="h-5 bg-gray-800/40 rounded-lg animate-pulse w-3/4" />
                      
                      {/* Description lines */}
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-800/40 rounded-lg animate-pulse w-full" />
                        <div className="h-3 bg-gray-800/40 rounded-lg animate-pulse w-5/6" />
                      </div>
                      
                      {/* Footer */}
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-16" />
                        <div className="h-4 bg-gray-800/40 rounded-lg animate-pulse w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>   
    </div>
  );
};

export default function UserProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { username } = resolvedParams;
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      // Get current user
      const currentUserRes = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (currentUserRes.ok) {
        const currentUserData = await currentUserRes.json();
        setCurrentUser(currentUserData.user);
        setIsOwnProfile(currentUserData.user.username === username);
      }

      // Get profile
      const response = await fetch(`/api/profile/${username}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        router.push('/404');
        return;
      }

      const data = await response.json();
      setUser(data.profile);
      
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      router.push('/404');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LazyMotion features={domAnimation}>
        <ProfilePageSkeleton />
      </LazyMotion>
    );
  }

  if (!user) return null;

  return (
    <LazyMotion features={domAnimation}>
      {/* Content with mt-20 */}
      <div className="relative z-10 mt-20">
        <ProfileLayout
          header={<ProfileHeader user={user} isOwnProfile={isOwnProfile} />}
          sidebar={<FilterSidebar />}
        >
          {user.isPrivate && !isOwnProfile ? (
            <PrivateProfileCard />
          ) : (
            <ProfileTabs username={username} isOwnProfile={isOwnProfile} />
          )}
        </ProfileLayout>
      </div>
    </LazyMotion>
  );
}