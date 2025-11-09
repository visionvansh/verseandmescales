"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FaCamera,
  FaUser,
  FaGlobe,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShieldAlt,
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaUserSecret,
  FaClock,
  FaAt,
  FaGoogle,
  FaMicrosoft,
  FaApple,
  FaDiscord,
  FaFacebook,
  FaSpinner,
  FaUpload,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaUserGraduate,
  FaUserTie,
  FaUserCircle,
} from "react-icons/fa";
import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import UniqueAvatar from "@/components/profile/UniqueAvatar";
import AvatarGalleryModal from "@/components/settings/AvatarGalleryModal";
import AvatarGenerator from "@/components/settings/AvatarGenerator";
import RoleChangeModal from "@/components/profile/RoleChangeModal";

dayjs.extend(utc);
dayjs.extend(timezone);

interface EnhancedBasicProfileSettingsProps {
  user: any;
  onUpdate: (section: string, data: any) => Promise<void>;
  isLoading: boolean;
  onNavigateToTab?: (tab: string) => void;
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "KR", name: "South Korea" },
  { code: "RU", name: "Russia" },
];

const EnhancedBasicProfileSettings = ({
  user,
  onUpdate,
  isLoading,
  onNavigateToTab,
}: EnhancedBasicProfileSettingsProps) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Personal Details (auto-save) - REMOVED PHONE
  const [personalData, setPersonalData] = useState({
    name: "",
    surname: "",
  });

  // Location & Contact (manual save)
  const [locationData, setLocationData] = useState({
    country: "",
    location: "",
    website: "",
    timezone: "",
  });

  // About You (manual save)
  const [bioData, setBioData] = useState({
    bio: "",
  });

  // Loading states for sections
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Role & Visibility State
  const [currentRole, setCurrentRole] = useState<"learn" | "teach" | "both">(
    "learn"
  );
  const [profileVisibility, setProfileVisibility] = useState<
    "public" | "private"
  >("public");
  const [canChangeVisibility, setCanChangeVisibility] = useState(true);
  const [visibilityLocked, setVisibilityLocked] = useState(false);

  // Role Change Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(
    null
  );
  const [userAvatars, setUserAvatars] = useState<any[]>([]);

  const [timezonesList] = useState(() => [
    { value: "America/New_York", label: "(UTC-05:00) Eastern Time - New York" },
    { value: "America/Chicago", label: "(UTC-06:00) Central Time - Chicago" },
    { value: "America/Denver", label: "(UTC-07:00) Mountain Time - Denver" },
    {
      value: "America/Los_Angeles",
      label: "(UTC-08:00) Pacific Time - Los Angeles",
    },
    { value: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii Time - Honolulu" },
    { value: "Europe/London", label: "(UTC+00:00) GMT/BST - London" },
    { value: "Europe/Paris", label: "(UTC+01:00) Central European - Paris" },
    { value: "Europe/Berlin", label: "(UTC+01:00) Central European - Berlin" },
    { value: "Europe/Athens", label: "(UTC+02:00) Eastern European - Athens" },
    { value: "Europe/Moscow", label: "(UTC+03:00) Moscow Time - Moscow" },
    { value: "Asia/Dubai", label: "(UTC+04:00) Gulf Time - Dubai/Abu Dhabi" },
    { value: "Asia/Kolkata", label: "(UTC+05:30) India Time - Mumbai/Delhi" },
    { value: "Asia/Bangkok", label: "(UTC+07:00) Indochina - Bangkok" },
    {
      value: "Asia/Shanghai",
      label: "(UTC+08:00) China Time - Beijing/Shanghai",
    },
    { value: "Asia/Tokyo", label: "(UTC+09:00) Japan Time - Tokyo" },
    {
      value: "Australia/Sydney",
      label: "(UTC+10:00) Eastern Australia - Sydney",
    },
    { value: "Pacific/Auckland", label: "(UTC+12:00) New Zealand - Auckland" },
    {
      value: "America/Sao_Paulo",
      label: "(UTC-03:00) Brasilia Time - São Paulo",
    },
  ]);

  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [isDetectingTimezone, setIsDetectingTimezone] = useState(false);
  const [timezoneDetectionStatus, setTimezoneDetectionStatus] = useState<
    string | null
  >(null);
  const [socialAccount, setSocialAccount] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Email verification states
  const [emailVerificationCode, setEmailVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailVerificationError, setEmailVerificationError] = useState<
    string | null
  >(null);
  const [emailVerificationSuccess, setEmailVerificationSuccess] = useState<
    string | null
  >(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"
    );
    (window as any).profileWs = ws;

    ws.onopen = () => {
      console.log("✅ Profile WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "profile:updated" && data.data.userId === user?.id) {
        window.location.reload();
      }
    };

    return () => {
      ws.close();
      delete (window as any).profileWs;
    };
  }, [user?.id]);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        const response = await fetch("/api/user/avatars");
        const data = await response.json();
        if (data.avatars) {
          setUserAvatars(data.avatars);
          const primary = data.avatars.find((a: any) => a.isPrimary);
          if (primary) {
            setSelectedAvatarIndex(
              primary.isCustomUpload ? -1 : primary.avatarIndex
            );
          }
        }
      } catch (error) {
        console.error("Failed to load avatars:", error);
      }
    };

    if (user) {
      loadAvatars();
    }
  }, [user]);

  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(
        () => setEmailCountdown(emailCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  useEffect(() => {
    if (emailVerificationError || emailVerificationSuccess) {
      const timer = setTimeout(() => {
        setEmailVerificationError(null);
        setEmailVerificationSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [emailVerificationError, emailVerificationSuccess]);

  useEffect(() => {
    if (timezoneDetectionStatus) {
      const timer = setTimeout(() => {
        setTimezoneDetectionStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [timezoneDetectionStatus]);

  useEffect(() => {
    if (!locationData.timezone) {
      setCurrentTime("");
      return;
    }

    const updateTime = () => {
      try {
        setCurrentTime(dayjs().tz(locationData.timezone).format("h:mm A"));
      } catch (err) {
        console.error("Error formatting time:", err);
        setCurrentTime("");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [locationData.timezone]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        console.log("📊 Loading user data:", user);

        let userRole: "learn" | "teach" | "both" = "learn";

        if (user.UserGoals && user.UserGoals.length > 0) {
          const purpose = user.UserGoals[0].purpose;
          console.log("🎯 User purpose from UserGoals:", purpose);

          if (purpose === "teach" || purpose === "tutor") {
            userRole = "teach";
          } else if (purpose === "both") {
            userRole = "both";
          } else if (purpose === "learn" || purpose === "learner") {
            userRole = "learn";
          }
        }

        console.log("✅ Mapped role:", userRole);
        setCurrentRole(userRole);

        if (userRole === "teach" || userRole === "both") {
          setProfileVisibility("public");
          setVisibilityLocked(true);
          setCanChangeVisibility(false);
          console.log("🔒 Profile locked to public (tutor/both role)");
        } else if (userRole === "learn") {
          const isPublic = user.profileSettings?.isPublic !== false;
          setProfileVisibility(isPublic ? "public" : "private");
          setCanChangeVisibility(true);
          setVisibilityLocked(false);
          console.log("🔓 Profile visibility can be changed (learner role)");
        }

        // Set personal details (auto-save) - REMOVED PHONE
        setPersonalData({
          name: user.name || "",
          surname: user.surname || "",
        });

        // Set location & contact (manual save)
        setLocationData({
          country: user.profileSettings?.country || "",
          location: user.profileSettings?.location || "",
          website: user.profileSettings?.website || "",
          timezone: user.timezone || user.preferences?.timezone || "",
        });

        // Set bio (manual save)
        setBioData({
          bio: user.profileSettings?.bio || "",
        });

        if (user.img) {
          setImagePreview(user.img);
        }

        if (user.socialAccountsEver && user.socialAccountsEver.length > 0) {
          setSocialAccount(user.socialAccountsEver[0]);
        }

        calculateProfileCompleteness();

        if (user.sessions) {
          setRecentLogins(user.sessions.slice(0, 3));
        }
      } catch (error) {
        console.error("❌ Error loading user data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // Sync role state with user prop updates
  useEffect(() => {
    if (!user) return;

    let userRole: "learn" | "teach" | "both" = "learn";

    if (user.UserGoals && user.UserGoals.length > 0) {
      const purpose = user.UserGoals[0].purpose;

      if (purpose === "teach" || purpose === "tutor") {
        userRole = "teach";
      } else if (purpose === "both") {
        userRole = "both";
      } else if (purpose === "learn" || purpose === "learner") {
        userRole = "learn";
      }
    }

    if (userRole !== currentRole) {
      console.log("🔄 Syncing role from user data:", userRole);
      setCurrentRole(userRole);

      // Update visibility settings based on role
      if (userRole === "teach" || userRole === "both") {
        setProfileVisibility("public");
        setVisibilityLocked(true);
        setCanChangeVisibility(false);
      } else if (userRole === "learn") {
        const isPublic = user.profileSettings?.isPublic !== false;
        setProfileVisibility(isPublic ? "public" : "private");
        setCanChangeVisibility(true);
        setVisibilityLocked(false);
      }
    }
  }, [user, user?.UserGoals]);

  // Sync profile visibility with user prop updates
  useEffect(() => {
    if (
      user?.profileVisibility &&
      user.profileVisibility !== profileVisibility
    ) {
      setProfileVisibility(user.profileVisibility);
    }
  }, [user?.profileVisibility]);

  const calculateProfileCompleteness = useCallback(() => {
    if (!user) return;

    // REMOVED: phone and phoneVerified from calculation
    const fields = [
      { value: user.name, weight: 10 },
      { value: user.surname, weight: 10 },
      { value: user.timezone || user.preferences?.timezone, weight: 5 },
      { value: user.img, weight: 15 },
      { value: user.emailVerified, weight: 20 },
      { value: user.profileSettings?.bio, weight: 15 },
      { value: user.profileSettings?.country, weight: 5 },
      { value: user.profileSettings?.location, weight: 10 },
      { value: user.profileSettings?.website, weight: 10 },
    ];

    const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = fields.reduce(
      (sum, field) => (field.value ? sum + field.weight : sum),
      0
    );

    const completeness = Math.round((completedWeight / totalWeight) * 100);
    console.log(`📈 Profile completeness: ${completeness}%`);
    setProfileCompleteness(completeness);
  }, [user]);

  // Auto-save for personal details
  const handlePersonalDetailChange = async (
    field: keyof typeof personalData,
    value: string
  ) => {
    setPersonalData((prev) => ({ ...prev, [field]: value }));

    // Debounced auto-save
    setTimeout(async () => {
      try {
        await onUpdate("basic", { [field]: value });
        console.log(`✅ Auto-saved ${field}: ${value}`);

        if (typeof window !== "undefined" && (window as any).profileWs) {
          (window as any).profileWs.send(
            JSON.stringify({
              event: "profile:updated",
              data: { userId: user.id },
            })
          );
        }
      } catch (error) {
        console.error(`❌ Failed to auto-save ${field}:`, error);
      }
    }, 1000);
  };

  const detectTimezone = useCallback(async () => {
    setIsDetectingTimezone(true);
    setTimezoneDetectionStatus(null);

    try {
      let detectedTimezone: string | null = null;

      try {
        detectedTimezone = dayjs.tz.guess();
      } catch (err) {
        console.warn("Dayjs timezone detection failed:", err);
      }

      if (!detectedTimezone) {
        try {
          detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (err) {
          console.warn("Intl API timezone detection failed:", err);
        }
      }

      if (detectedTimezone) {
        const isValidTimezone = timezonesList.some(
          (tz) => tz.value === detectedTimezone
        );

        if (!isValidTimezone) {
          detectedTimezone = "Etc/UTC";
        }

        const tzLabel =
          timezonesList.find((tz) => tz.value === detectedTimezone)?.label ||
          detectedTimezone;

        setLocationData((prev) => ({
          ...prev,
          timezone: detectedTimezone || "",
        }));
        setTimezoneDetectionStatus(`Successfully detected: ${tzLabel}`);

        return true;
      } else {
        throw new Error("Could not detect a valid timezone");
      }
    } catch (error) {
      console.error("Failed to detect timezone:", error);
      setTimezoneDetectionStatus("Detection failed. Please select manually.");
      return false;
    } finally {
      setIsDetectingTimezone(false);
    }
  }, [timezonesList]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const response = await fetch("/api/user/upload-image", {
        method: "POST",
        credentials: "include",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setImagePreview(data.imageUrl);

        await onUpdate("basic", { img: data.imageUrl });

        if (typeof window !== "undefined" && (window as any).profileWs) {
          (window as any).profileWs.send(
            JSON.stringify({
              event: "profile:updated",
              data: { userId: user.id },
            })
          );
        }
      } else {
        throw new Error(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSelectAvatar = async (avatarIndex: number, style: string) => {
    try {
      const response = await fetch("/api/user/avatars/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarIndex, style }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedAvatarIndex(avatarIndex);

        const avatarResponse = await fetch("/api/user/avatars");
        const avatarData = await avatarResponse.json();
        if (avatarData.avatars) {
          setUserAvatars(avatarData.avatars);
        }

        setShowAvatarGallery(false);
        alert("Avatar updated successfully!");
      }
    } catch (error) {
      console.error("Failed to select avatar:", error);
      alert("Failed to update avatar. Please try again.");
    }
  };

  const handleUploadCustomAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/user/avatars/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setSelectedAvatarIndex(-1);
      window.location.reload();
    } else {
      throw new Error("Upload failed");
    }
  };

  const handleRoleChange = async (newRole: "learn" | "teach" | "both") => {
    setIsChangingRole(true);
    setRoleChangeError(null);

    try {
      const response = await fetch("/api/profile/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "change_role",
          newRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change role");
      }

      setCurrentRole(newRole);

      if (newRole === "teach" || newRole === "both") {
        setProfileVisibility("public");
        setVisibilityLocked(true);
        setCanChangeVisibility(false);
      } else if (newRole === "learn") {
        setCanChangeVisibility(true);
        setVisibilityLocked(false);
      }

      alert(data.message);
      setShowRoleModal(false);

      if (onUpdate) {
        await onUpdate("role", { role: newRole });
      }

      if (typeof window !== "undefined" && (window as any).profileWs) {
        (window as any).profileWs.send(
          JSON.stringify({
            event: "profile:updated",
            data: { userId: user.id },
          })
        );
      }

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      setRoleChangeError(error.message);
    } finally {
      setIsChangingRole(false);
    }
  };

  // Send email verification code
  const sendEmailVerificationCode = async () => {
    if (!user?.email) {
      setEmailVerificationError("Email not found");
      return;
    }

    setIsVerifyingEmail(true);
    setEmailVerificationError(null);
    setEmailVerificationSuccess(null);

    try {
      const response = await fetch("/api/user/send-email-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailVerificationSuccess("Verification code sent to your email!");
        setEmailVerificationSent(true);
        setEmailCountdown(60);

        if (data.developmentCode) {
          console.log("Development Email Code:", data.developmentCode);
          setEmailVerificationSuccess(
            `Code sent! (Dev: ${data.developmentCode})`
          );
        }
      } else {
        throw new Error(data.error || "Failed to send verification code");
      }
    } catch (err: any) {
      setEmailVerificationError(err.message);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Verify email code
  const verifyEmailCode = async () => {
    const code = emailVerificationCode.join("");
    if (!code || code.length !== 6) {
      setEmailVerificationError(
        "Please enter the complete 6-digit verification code"
      );
      return;
    }

    setIsVerifyingEmail(true);
    setEmailVerificationError(null);
    setEmailVerificationSuccess(null);

    try {
      const response = await fetch("/api/user/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          code: code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailVerificationSuccess("Email verified successfully!");
        setEmailVerificationSent(false);
        setEmailVerificationCode(["", "", "", "", "", ""]);

        await onUpdate("basic", {
          emailVerified: true,
        });

        if (typeof window !== "undefined" && (window as any).profileWs) {
          (window as any).profileWs.send(
            JSON.stringify({
              event: "profile:updated",
              data: { userId: user.id },
            })
          );
        }
      } else {
        throw new Error(data.error || "Invalid verification code");
      }
    } catch (err: any) {
      setEmailVerificationError(err.message);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const resendEmailCode = async () => {
    setIsResendingEmail(true);
    setEmailVerificationCode(["", "", "", "", "", ""]);
    await sendEmailVerificationCode();
    setIsResendingEmail(false);
  };

  const handleEmailCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...emailVerificationCode];
    newCode[index] = value;
    setEmailVerificationCode(newCode);

    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[data-email-index="${index + 1}"]`
      ) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handleEmailCodeBackspace = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !emailVerificationCode[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[data-email-index="${index - 1}"]`
      ) as HTMLInputElement;
      prevInput?.focus();
    }
  };

  const handleVisibilityToggle = async (
    newVisibility: "public" | "private"
  ) => {
    if (!canChangeVisibility) return;

    try {
      const response = await fetch("/api/profile/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "toggle_visibility",
          isPublic: newVisibility === "public",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update visibility");
      }

      setProfileVisibility(newVisibility);
      alert(data.message);

      if (typeof window !== "undefined" && (window as any).profileWs) {
        (window as any).profileWs.send(
          JSON.stringify({
            event: "profile:updated",
            data: { userId: user.id },
          })
        );
      }
    } catch (error: any) {
      console.error("Failed to update visibility:", error);
      alert(error.message);
    }
  };

  // Save Location & Contact
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLocation(true);

    try {
      // Update basic info with timezone
      await onUpdate("basic", {
        timezone: locationData.timezone,
      });

      // Update profile settings
      await fetch("/api/profile/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_bio",
          country: locationData.country,
          location: locationData.location,
          website: locationData.website,
        }),
      });

      if (typeof window !== "undefined" && (window as any).profileWs) {
        (window as any).profileWs.send(
          JSON.stringify({
            event: "profile:updated",
            data: { userId: user.id },
          })
        );
      }

      alert("Location & Contact updated successfully!");
    } catch (error) {
      console.error("Failed to update location:", error);
      alert("Failed to update. Please try again.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Save Bio
  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBio(true);

    try {
      await fetch("/api/profile/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_bio",
          bio: bioData.bio,
        }),
      });

      if (typeof window !== "undefined" && (window as any).profileWs) {
        (window as any).profileWs.send(
          JSON.stringify({
            event: "profile:updated",
            data: { userId: user.id },
          })
        );
      }

      alert("Bio updated successfully!");
    } catch (error) {
      console.error("Failed to update bio:", error);
      alert("Failed to update bio. Please try again.");
    } finally {
      setIsSavingBio(false);
    }
  };

  // Handle 2FA enable - redirect to Privacy tab
  const handleEnable2FA = () => {
    if (onNavigateToTab) {
      onNavigateToTab("privacy");
    }
  };

  const getSocialLoginIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case "google":
        return <FaGoogle className="text-red-400" />;
      case "microsoft":
        return <FaMicrosoft className="text-blue-400" />;
      case "apple":
        return <FaApple className="text-gray-400" />;
      case "discord":
        return <FaDiscord className="text-indigo-400" />;
      case "facebook":
        return <FaFacebook className="text-blue-500" />;
      default:
        return <FaAt className="text-green-400" />;
    }
  };

  const formatProviderName = (provider: string) => {
    if (!provider) return "";
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const getRoleIcon = () => {
    switch (currentRole) {
      case "teach":
        return <FaChalkboardTeacher className="text-purple-500" />;
      case "learn":
        return <FaGraduationCap className="text-blue-500" />;
      case "both":
        return <FaUserGraduate className="text-red-500" />;
      default:
        return <FaUserTie className="text-gray-500" />;
    }
  };

  const getRoleLabel = () => {
    switch (currentRole) {
      case "teach":
        return "Expert Tutor";
      case "learn":
        return "Active Learner";
      case "both":
        return "Tutor & Learner";
      default:
        return "Member";
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center mb-2">
          <FaUser className="mr-2 sm:mr-3 text-red-500 text-lg sm:text-xl" />
          Basic Information
        </h2>
      </div>

      {/* Profile Picture Section - UPDATED FOR COMPACT MOBILE */}
    <div className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20 mb-6 sm:mb-8">
  <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center">
    <FaCamera className="mr-2 text-red-500 text-sm sm:text-base" /> Profile Picture
  </h3>
  
  <div className="flex flex-row items-center space-x-3 sm:space-x-6">
    {/* Avatar Container */}
    <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-red-500/30 bg-black flex-shrink-0 flex items-center justify-center">
      {imagePreview ? (
        <Image
          src={imagePreview}
          alt="Profile"
          width={128}
          height={128}
          className="object-cover"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <AvatarGenerator
            userId={user?.id || "default"}
            avatarIndex={selectedAvatarIndex ?? -1}
            size={typeof window !== "undefined" && window.innerWidth >= 640 ? 128 : 80}
            useDefault={selectedAvatarIndex === null || selectedAvatarIndex === -1}
          />
        </div>
      )}

      {isUploadingImage && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <FaSpinner className="w-5 h-5 text-white animate-spin sm:w-8 sm:h-8" />
        </div>
      )}
    </div>

    {/* Buttons Section */}
    <div className="flex-1 min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
        <button
          type="button"
          onClick={() => setShowAvatarGallery(true)}
          className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium text-xs sm:text-sm shadow-lg whitespace-nowrap"
        >
          <FaCamera className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-xs sm:text-sm">Choose Avatar</span>
        </button>

        <label className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-800 text-white rounded-lg cursor-pointer hover:bg-gray-700 transition-colors font-medium text-xs sm:text-sm border border-red-500/30 whitespace-nowrap">
          <FaUpload className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
          <span className="text-xs sm:text-sm">
            {isUploadingImage ? "Uploading..." : "Upload"}
          </span>
          <input
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploadingImage}
          />
        </label>
      </div>
      <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500 leading-tight">
        Select from avatars or upload (Max 5MB)
      </p>
    </div>
  </div>
</div>

      {/* USER ROLE SECTION - Mobile responsive */}
      <div className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20 mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center">
          <FaUserGraduate className="mr-2 text-red-500 text-sm sm:text-base" />{" "}
          Your Role
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-800/30 rounded-lg mb-4 gap-y-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center flex-shrink-0">
              {getRoleIcon()}
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm sm:text-base">
                {getRoleLabel()}
              </h4>
              <p className="text-xs sm:text-sm text-gray-400">
                {currentRole === "teach" && "Create and teach courses"}
                {currentRole === "learn" && "Focus on learning from courses"}
                {currentRole === "both" && "Teach and learn simultaneously"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRoleModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium border border-red-500/30 w-full sm:w-auto"
          >
            Change Role
          </button>
        </div>

        {visibilityLocked && (
          <div className="p-2.5 sm:p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-300 flex items-center">
              <FaShieldAlt className="mr-2 flex-shrink-0" />
              <span>
                Your profile is automatically public because you're a{" "}
                {getRoleLabel()}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Bio Section - WITH SAVE BUTTON - UPDATED FOR MOBILE RESPONSIVENESS */}
      <form
        onSubmit={handleSaveBio}
        className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20 mb-6 sm:mb-8"
      >
        <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center">
          <FaUser className="mr-2 text-red-500 text-sm sm:text-base" /> About
          You
        </h3>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label
              htmlFor="bio"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Bio / Description
            </label>
            <textarea
              name="bio"
              id="bio"
              value={bioData.bio}
              onChange={(e) => setBioData({ bio: e.target.value })}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/60 resize-none"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] sm:text-xs text-gray-500">
                Maximum 500 characters
              </span>
              <span
                className={`text-[10px] sm:text-xs font-medium ${
                  bioData.bio.length > 450 ? "text-red-400" : "text-gray-500"
                }`}
              >
                {bioData.bio.length}/500
              </span>
            </div>
          </div>

          {/* Save Button for Bio */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingBio}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium text-xs sm:text-sm hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
            >
              {isSavingBio ? (
                <>
                  <FaSpinner className="animate-spin text-xs sm:text-sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-xs sm:text-sm" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Personal Information - AUTO SAVE (NO PHONE) */}
      <div className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20 mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center flex-wrap gap-2">
          <span className="flex items-center">
            <FaUser className="mr-2 text-red-500 text-sm sm:text-base" />{" "}
            Personal Details
          </span>
          <span className="text-[10px] sm:text-xs text-green-400 flex items-center gap-1">
            <FaCheckCircle className="text-[10px] sm:text-xs" /> Auto-saved
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <div>
            <label
              htmlFor="name"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              First Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={personalData.name}
              onChange={(e) =>
                handlePersonalDetailChange("name", e.target.value)
              }
              className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/60"
            />
          </div>
          <div>
            <label
              htmlFor="surname"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Last Name
            </label>
            <input
              type="text"
              name="surname"
              id="surname"
              value={personalData.surname}
              onChange={(e) =>
                handlePersonalDetailChange("surname", e.target.value)
              }
              className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/60"
            />
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm sm:text-base">
                @
              </span>
              <input
                type="text"
                name="username"
                id="username"
                value={user?.username || ""}
                disabled
                className="w-full rounded-xl bg-gray-800/20 border border-gray-700/40 text-gray-400 py-2.5 sm:py-3 px-3 sm:px-4 pl-7 sm:pl-8 text-sm sm:text-base focus:outline-none cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Username cannot be changed
            </p>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={user?.email || ""}
              disabled
              className="w-full rounded-xl bg-gray-800/20 border border-gray-700/40 text-gray-400 py-2.5 sm:py-3 px-3 sm:px-4 text-sm sm:text-base focus:outline-none cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              {user?.emailVerified ? "Verified email" : "Email not verified"}
            </p>
          </div>
        </div>
      </div>

      {/* Location & Contact - WITH SAVE BUTTON (NO PHONE) */}
      <form
        onSubmit={handleSaveLocation}
        className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20 mb-6 sm:mb-8"
      >
        <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center">
          <FaGlobe className="mr-2 text-red-500 text-sm sm:text-base" />{" "}
          Location & Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor="country"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Country
            </label>
            <select
              name="country"
              id="country"
              value={locationData.country}
              onChange={(e) =>
                setLocationData((prev) => ({
                  ...prev,
                  country: e.target.value,
                }))
              }
              className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              City / Region
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={locationData.location}
              onChange={(e) =>
                setLocationData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              placeholder="e.g., San Francisco, CA"
              className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="website"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Website / Portfolio
            </label>
            <input
              type="url"
              name="website"
              id="website"
              value={locationData.website}
              onChange={(e) =>
                setLocationData((prev) => ({
                  ...prev,
                  website: e.target.value,
                }))
              }
              placeholder="https://yourwebsite.com"
              className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Timezone
            </label>
            <div className="relative">
              <FaGlobe className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-red-500/70 z-10 text-xs sm:text-base" />
              <select
                name="timezone"
                id="timezone"
                value={locationData.timezone}
                onChange={(e) =>
                  setLocationData((prev) => ({
                    ...prev,
                    timezone: e.target.value,
                  }))
                }
                className="w-full rounded-xl bg-gray-800/50 border border-gray-700/40 text-white py-2.5 sm:py-3 pl-8 sm:pl-12 pr-16 sm:pr-24 text-xs sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/60 appearance-none"
              >
                <option value="">Select timezone</option>
                {timezonesList.map((zone) => (
                  <option
                    key={zone.value}
                    value={zone.value}
                    className="bg-gray-800 text-white"
                  >
                    {zone.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={detectTimezone}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-300 transition-colors text-[10px] sm:text-sm whitespace-nowrap"
                disabled={isDetectingTimezone}
              >
                {isDetectingTimezone ? (
                  <span className="flex items-center">
                    <FaSpinner className="animate-spin mr-1 text-xs" />
                    <span className="hidden sm:inline">Detecting...</span>
                    <span className="sm:hidden">...</span>
                  </span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Auto-detect</span>
                    <span className="sm:hidden">Auto</span>
                  </>
                )}
              </button>
            </div>

            {timezoneDetectionStatus && (
              <div
                className={`mt-2 text-[10px] sm:text-xs rounded-lg p-2 ${
                  timezoneDetectionStatus.includes("failed")
                    ? "bg-red-900/30 text-red-300 border border-red-500/30"
                    : "bg-green-900/30 text-green-300 border border-green-500/30"
                }`}
              >
                {timezoneDetectionStatus}
              </div>
            )}

            {currentTime && (
              <div className="mt-2 flex items-center text-gray-400 text-[10px] sm:text-xs">
                <FaClock className="mr-1 text-xs" />
                <span>Current time: {currentTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Save Button for Location & Contact */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingLocation}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium text-xs sm:text-sm hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
          >
            {isSavingLocation ? (
              <>
                <FaSpinner className="animate-spin text-xs sm:text-sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FaCheckCircle className="text-xs sm:text-sm" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* PROFILE VISIBILITY - AUTO SAVE */}
      <div className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20 mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center flex-wrap gap-2">
          <span className="flex items-center">
            <FaUserSecret className="mr-2 text-red-500 text-sm sm:text-base" />{" "}
            Profile Visibility
          </span>
          <span className="text-[10px] sm:text-xs text-green-400 flex items-center gap-1">
            <FaCheckCircle className="text-[10px] sm:text-xs" /> Auto-saved
          </span>
        </h3>

        {visibilityLocked && (
          <div className="mb-4 p-2.5 sm:p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-300 flex items-center">
              <FaShieldAlt className="mr-2 flex-shrink-0" />
              <span>
                Your profile is automatically public because you're a{" "}
                {getRoleLabel()}
              </span>
            </p>
          </div>
        )}

        <p className="text-xs sm:text-sm text-gray-400 mb-4">
          Control who can see your profile information.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
              profileVisibility === "public"
                ? "border-red-500 bg-red-500/10"
                : "border-gray-700 bg-gray-900/50"
            } ${
              !canChangeVisibility
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-red-500/50"
            }`}
            onClick={() =>
              canChangeVisibility && handleVisibilityToggle("public")
            }
          >
            <div className="flex items-center mb-1.5 sm:mb-2">
              <FaEye className="text-red-500 mr-2 text-sm sm:text-base" />
              <h4 className="font-medium text-white text-sm sm:text-base">
                Public
              </h4>
            </div>
            <p className="text-xs text-gray-400">
              Anyone can view your profile
            </p>
          </div>

          <div
            className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all ${
              profileVisibility === "private"
                ? "border-red-500 bg-red-500/10"
                : "border-gray-700 bg-gray-900/50"
            } ${
              !canChangeVisibility
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-red-500/50"
            }`}
            onClick={() =>
              canChangeVisibility && handleVisibilityToggle("private")
            }
          >
            <div className="flex items-center mb-1.5 sm:mb-2">
              <FaEyeSlash className="text-red-500 mr-2 text-sm sm:text-base" />
              <h4 className="font-medium text-white text-sm sm:text-base">
                Private
              </h4>
            </div>
            <p className="text-xs text-gray-400">
              Only seekers can see your profile
            </p>
          </div>
        </div>
      </div>

      {/* Account Verification Section (EMAIL ONLY - NO PHONE) - UPDATED ENABLE BUTTON FOR MOBILE */}
      <div className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20 mb-6 sm:mb-8">
        <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center">
          <FaShieldAlt className="mr-2 text-red-500 text-sm sm:text-base" />{" "}
          Account Verification
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {/* Email Verification */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-800/30 rounded-lg gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <div
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  socialAccount || user?.emailVerified
                    ? "bg-green-500/20"
                    : "bg-red-500/20"
                }`}
              >
                {socialAccount ? (
                  getSocialLoginIcon(socialAccount.provider)
                ) : user?.emailVerified ? (
                  <FaCheckCircle className="text-green-500 text-xs sm:text-base" />
                ) : (
                  <FaExclamationTriangle className="text-red-500 text-xs sm:text-base" />
                )}
              </div>
              <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                <h4 className="text-white font-medium text-xs sm:text-base truncate">
                  {socialAccount
                    ? `${formatProviderName(socialAccount.provider)} Login`
                    : "Email Address"}
                </h4>
                <p className="text-gray-400 text-[10px] sm:text-sm truncate">
                  {socialAccount
                    ? socialAccount.providerUsername ||
                      socialAccount.providerEmail ||
                      user?.email
                    : user?.email}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {socialAccount || user?.emailVerified ? (
                <span className="bg-green-500/20 text-green-400 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                  Verified
                </span>
              ) : (
                <button
                  type="button"
                  className="bg-red-500/20 text-red-400 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full hover:bg-red-500/30 whitespace-nowrap"
                  onClick={sendEmailVerificationCode}
                  disabled={isVerifyingEmail}
                >
                  {isVerifyingEmail ? "Sending..." : "Verify"}
                </button>
              )}
            </div>
          </div>

          {/* Email Verification Code Input */}
          {emailVerificationSent && (
            <div className="p-3 sm:p-4 bg-gray-800/20 rounded-lg border border-red-500/20 space-y-3">
              <p className="text-gray-300 text-[10px] sm:text-xs mb-3">
                Enter the 6-digit code sent to {user?.email}:
              </p>

              <div className="flex justify-between space-x-1 sm:space-x-2">
                {emailVerificationCode.map((digit, index) => (
                  <input
                    key={index}
                    data-email-index={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleEmailCodeInput(index, e.target.value)
                    }
                    onKeyDown={(e) => handleEmailCodeBackspace(index, e)}
                    className="w-7 h-8 sm:w-9 sm:h-10 text-center rounded-lg bg-gray-800/50 border border-gray-700/40 text-white font-bold text-sm sm:text-lg focus:border-red-500/60 focus:outline-none"
                  />
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
                <button
                  type="button"
                  onClick={resendEmailCode}
                  disabled={isResendingEmail || emailCountdown > 0}
                  className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:text-gray-500"
                >
                  {isResendingEmail
                    ? "Resending..."
                    : emailCountdown > 0
                    ? `Resend in ${emailCountdown}s`
                    : "Resend Code"}
                </button>

                <button
                  type="button"
                  onClick={verifyEmailCode}
                  disabled={
                    emailVerificationCode.join("").length !== 6 ||
                    isVerifyingEmail
                  }
                  className="px-3 py-1.5 sm:py-1 bg-red-600 text-white text-[10px] sm:text-xs font-medium rounded-lg hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isVerifyingEmail ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-1 text-xs" />
                      Verifying...
                    </span>
                  ) : (
                    "Verify Code"
                  )}
                </button>
              </div>

              {(emailVerificationError || emailVerificationSuccess) && (
                <div
                  className={`text-[10px] sm:text-xs rounded-lg p-2 ${
                    emailVerificationError
                      ? "bg-red-900/30 text-red-300 border border-red-500/30"
                      : "bg-green-900/30 text-green-300 border border-green-500/30"
                  }`}
                >
                  {emailVerificationError || emailVerificationSuccess}
                </div>
              )}
            </div>
          )}

          {/* Two-Factor Authentication - UPDATED ENABLE BUTTON FOR MOBILE */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-800/30 rounded-lg gap-2">
            <div className="flex items-center min-w-0 flex-1">
              <div
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  user?.twoFactorEnabled ? "bg-green-500/20" : "bg-gray-600/20"
                }`}
              >
                {user?.twoFactorEnabled ? (
                  <FaCheckCircle className="text-green-500 text-xs sm:text-base" />
                ) : (
                  <FaShieldAlt className="text-gray-500 text-xs sm:text-base" />
                )}
              </div>
              <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                <h4 className="text-white font-medium text-xs sm:text-base">
                  Two-Factor Authentication
                </h4>
                <p className="text-gray-400 text-[10px] sm:text-sm">
                  {user?.twoFactorEnabled ? "Enabled" : "Not enabled"}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {user?.twoFactorEnabled ? (
                <span className="bg-green-500/20 text-green-400 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                  Enabled
                </span>
              ) : (
                <button
                  type="button"
                  className="bg-gray-600/20 text-gray-300 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-md hover:bg-gray-600/30 whitespace-nowrap transition-colors"
                  onClick={handleEnable2FA}
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentLogins.length > 0 && (
        <div className="bg-gray-900/50 p-4 sm:p-5 md:p-6 rounded-xl border border-red-500/20">
          <h3 className="text-sm sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center">
            <FaHistory className="mr-2 text-red-500 text-sm sm:text-base" />{" "}
            Recent Login Activity
          </h3>
          <div className="space-y-3">
            {recentLogins.map((login, index) => (
              <div
                key={login?.id || index}
                className="flex items-start p-2.5 sm:p-3 bg-gray-800/30 rounded-lg gap-2 sm:gap-3"
              >
                <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-700/40 flex items-center justify-center">
                  <FaClock className="text-red-500 text-xs sm:text-base" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0">
                    <h4 className="text-white font-medium text-xs sm:text-base truncate">
                      {login.device?.deviceName ||
                        login.device?.browser ||
                        "Unknown Device"}
                    </h4>
                    <span className="text-gray-400 text-[10px] sm:text-xs flex-shrink-0">
                      {new Date(login.lastUsed).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] sm:text-sm">
                    {login.location
                      ? `${login.city || ""}, ${
                          login.country || login.location
                        }`
                      : "Location unknown"}{" "}
                    •{login.device?.browser || ""} {login.device?.os || ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avatar Gallery Modal */}
      <AvatarGalleryModal
        isOpen={showAvatarGallery}
        onClose={() => setShowAvatarGallery(false)}
        userId={user?.id || "default"}
        currentAvatarIndex={selectedAvatarIndex}
        customImage={imagePreview}
        onSelectAvatar={handleSelectAvatar}
        onUploadCustom={handleUploadCustomAvatar}
      />

      {/* Role Change Modal */}
      <RoleChangeModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setRoleChangeError(null);
        }}
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        isLoading={isChangingRole}
        error={roleChangeError}
      />
    </div>
  );
};

export default EnhancedBasicProfileSettings;
