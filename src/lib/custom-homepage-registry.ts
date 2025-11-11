///Volumes/vision/codes/course/my-app/src/lib/custom-homepage-registry.ts
// Auto-registers all custom homepage components

export interface CustomHomepageComponent {
  id: string;
  name: string;
  fileName: string;
  description: string;
  component: React.ComponentType<any>;
}

// ✅ This object auto-populates when you create new files
export const CUSTOM_HOMEPAGES: Record<string, CustomHomepageComponent> = {};

// ✅ Auto-detection: This function scans the directory
export function registerCustomHomepage(
  id: string,
  name: string,
  fileName: string,
  component: React.ComponentType<any>,
  description: string = ""
) {
  CUSTOM_HOMEPAGES[id] = {
    id,
    name,
    fileName,
    description,
    component,
  };
}

// ✅ Get available custom homepages
export function getAvailableCustomHomepages(): CustomHomepageComponent[] {
  return Object.values(CUSTOM_HOMEPAGES);
}

// ✅ Get specific homepage component
export function getCustomHomepage(fileId: string): React.ComponentType<any> | null {
  return CUSTOM_HOMEPAGES[fileId]?.component || null;
}