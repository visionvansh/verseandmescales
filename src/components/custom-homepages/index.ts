import { registerCustomHomepage } from "@/lib/custom-homepage-registry";
import HomepageV2 from "./HomepageV2";
import SinDetoxHomepage from "./SinDetoxHomepage";

// ✅ Register HomepageV2
registerCustomHomepage(
  "homepage-v2",
  "Purple Gradient Homepage",
  "HomepageV2.tsx",
  HomepageV2,
  "Modern purple gradient design with video player"
);

// ✅ Register Sin Detox Homepage
registerCustomHomepage(
  "sin-detox",
  "Sin Detox Protocol",
  "SinDetoxHomepage.tsx",
  SinDetoxHomepage,
  "Science-backed spiritual protocol with dark red theme"
);

export * from "@/lib/custom-homepage-registry";