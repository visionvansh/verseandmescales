"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileLayout from "@/components/profile/ProfileLayout";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import FilterSidebar from "@/components/profile/FilterSidebar";
import { User } from "@/components/profile/data/mockProfileData";

// Optimized Skeleton Loader Component
const ProfilePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="relative z-10">
        {/* Header Skeleton */}
        <div className="relative border-b border-red-500/20 bg-black mt-20">
          <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-5 md:py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-5 md:gap-6">
              {/* Avatar Skeleton */}
              <div className="relative">
                <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full bg-gray-800/40 animate-pulse border-4 border-red-500/20" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-800/40 animate-pulse border-2 border-red-500/20" 
                     style={{ animationDelay: '100ms' }} />
              </div>

              {/* Info Skeleton */}
              <div className="flex-1 space-y-3 sm:space-y-4 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="space-y-2 sm:space-y-3 flex-1">
                    {/* Username */}
                    <div className="h-6 sm:h-7 md:h-8 bg-gray-800/40 rounded-lg animate-pulse w-32 xs:w-40 sm:w-48" />
                    {/* Bio */}
                    <div className="h-3 sm:h-4 bg-gray-800/40 rounded-lg animate-pulse w-full max-w-md" 
                         style={{ animationDelay: '150ms' }} />
                    <div className="h-3 sm:h-4 bg-gray-800/40 rounded-lg animate-pulse w-3/4 max-w-sm" 
                         style={{ animationDelay: '200ms' }} />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3">
                    <div className="h-9 sm:h-10 w-24 xs:w-28 sm:w-32 bg-gray-800/40 rounded-lg animate-pulse" 
                         style={{ animationDelay: '250ms' }} />
                    <div className="h-9 sm:h-10 w-9 sm:w-10 bg-gray-800/40 rounded-lg animate-pulse" 
                         style={{ animationDelay: '300ms' }} />
                  </div>
                </div>

                {/* Stats Skeleton */}
                <div className="flex gap-3 xs:gap-4 sm:gap-5 md:gap-6 pt-3 sm:pt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1 sm:space-y-2" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="h-5 sm:h-6 bg-gray-800/40 rounded-lg animate-pulse w-12 xs:w-14 sm:w-16" />
                      <div className="h-3 sm:h-4 bg-gray-800/40 rounded-lg animate-pulse w-16 xs:w-18 sm:w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="container mx-auto px-3 xs:px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-5 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr] gap-4 sm:gap-5 md:gap-6">
            {/* Sidebar Skeleton - Desktop Only */}
            <div className="hidden lg:block">
              <div className="sticky top-6 space-y-4">
                <div className="bg-black rounded-xl sm:rounded-2xl border border-red-500/20 p-4 sm:p-5">
                  {/* Filter Title */}
                  <div className="h-5 sm:h-6 bg-gray-800/40 rounded-lg animate-pulse w-20 sm:w-24 mb-3 sm:mb-4" />
                  
                  {/* Filter Options */}
                  <div className="space-y-2 sm:space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-9 sm:h-10 bg-gray-800/40 rounded-lg animate-pulse"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area Skeleton */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Tabs Skeleton */}
              <div className="bg-black rounded-xl sm:rounded-2xl border border-red-500/20">
                <div className="flex gap-2 p-3 sm:p-4 border-b border-red-500/10 overflow-x-auto">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-9 sm:h-10 bg-gray-800/40 rounded-lg animate-pulse flex-shrink-0 w-24 xs:w-28 sm:w-32"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  ))}
                </div>

                {/* Content Grid */}
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-4 md:gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="bg-gray-800/20 rounded-lg sm:rounded-xl border border-red-500/10 p-3 sm:p-4 space-y-2 sm:space-y-3"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {/* Image placeholder */}
                        <div className="aspect-video bg-gray-800/40 rounded-md sm:rounded-lg animate-pulse" />
                        
                        {/* Title */}
                        <div className="h-4 sm:h-5 bg-gray-800/40 rounded-lg animate-pulse w-3/4" />
                        
                        {/* Description lines */}
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="h-2.5 sm:h-3 bg-gray-800/40 rounded-lg animate-pulse w-full" />
                          <div className="h-2.5 sm:h-3 bg-gray-800/40 rounded-lg animate-pulse w-5/6" />
                        </div>
                        
                        {/* Footer */}
                        <div className="flex justify-between items-center pt-1.5 sm:pt-2">
                          <div className="h-3 sm:h-4 bg-gray-800/40 rounded-lg animate-pulse w-14 sm:w-16" />
                          <div className="h-3 sm:h-4 bg-gray-800/40 rounded-lg animate-pulse w-10 sm:w-12" />
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

      {/* Loading indicator */}
    
      </div>

  );
};

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        router.push('/login');
        return;
      }
      
      const data = await response.json();
      
      // Fetch full profile
      const profileResponse = await fetch(`/api/profile/${data.user.username}`, {
        credentials: 'include',
      });
      
      if (!profileResponse.ok) throw new Error('Failed to fetch profile');
      
      const profileData = await profileResponse.json();
      setCurrentUser(profileData.profile);
      
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!currentUser) return null;

  return (
    <ProfileLayout
      header={<ProfileHeader user={currentUser} isOwnProfile={true} />}
      sidebar={<FilterSidebar />}
    >
      <ProfileTabs username={currentUser.username} isOwnProfile={true} />
    </ProfileLayout>
  );
}