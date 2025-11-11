//Volumes/vision/codes/course/my-app/src/components/custom-homepages/index.ts
import { registerCustomHomepage } from "@/lib/custom-homepage-registry";
import HomepageV2 from "./HomepageV2";
// Import more custom homepages here...

// ✅ Register all custom homepages
registerCustomHomepage(
  "homepage-v2",
  "Purple Gradient Homepage",
  "HomepageV2.tsx",
  HomepageV2,
  "Modern purple gradient design with video player"
);

// ✅ Add more registrations as you create files:
// registerCustomHomepage("homepage-v3", "Dark Neon", "HomepageV3.tsx", HomepageV3);

export * from "@/lib/custom-homepage-registry";