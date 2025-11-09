// utils/autoSave.ts
interface AutoSaveData {
  courseId: string;
  homepageData?: any;
  courseData?: any;
  lastSaved: string;
  version: number;
}

const AUTOSAVE_KEY_PREFIX = 'course_autosave_';
const AUTOSAVE_VERSION = 1;

export class AutoSaveManager {
  private courseId: string;
  private debounceTimer: NodeJS.Timeout | null = null;
  private saveDelay: number;

  constructor(courseId: string, saveDelay: number = 1000) {
    this.courseId = courseId;
    this.saveDelay = saveDelay;
  }

  private getStorageKey(): string {
    return `${AUTOSAVE_KEY_PREFIX}${this.courseId}`;
  }

  /**
   * Auto-save homepage data with debouncing
   */
  autoSaveHomepage(data: any): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveHomepageToLocal(data);
    }, this.saveDelay);
  }

  /**
   * Auto-save course builder data with debouncing
   */
  autoSaveCourse(data: any): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.saveCourseToLocal(data);
    }, this.saveDelay);
  }

  /**
   * Save homepage data to localStorage
   */
  private saveHomepageToLocal(homepageData: any): void {
    try {
      const existing = this.getAutoSaveData();
      const updated: AutoSaveData = {
        ...existing,
        courseId: this.courseId,
        homepageData,
        lastSaved: new Date().toISOString(),
        version: AUTOSAVE_VERSION,
      };

      localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
      console.log('✅ Homepage auto-saved locally', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }

  /**
   * Save course builder data to localStorage
   */
  private saveCourseToLocal(courseData: any): void {
    try {
      const existing = this.getAutoSaveData();
      const updated: AutoSaveData = {
        ...existing,
        courseId: this.courseId,
        courseData,
        lastSaved: new Date().toISOString(),
        version: AUTOSAVE_VERSION,
      };

      localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
      console.log('✅ Course auto-saved locally', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }

  /**
   * Get auto-saved data from localStorage
   */
  getAutoSaveData(): AutoSaveData | null {
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // Version check
      if (parsed.version !== AUTOSAVE_VERSION) {
        console.warn('Auto-save version mismatch, clearing old data');
        this.clearAutoSave();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error reading auto-save:', error);
      return null;
    }
  }

  /**
   * Check if auto-save data exists
   */
  hasAutoSave(): boolean {
    return this.getAutoSaveData() !== null;
  }

  /**
   * Get last saved timestamp
   */
  getLastSavedTime(): Date | null {
    const data = this.getAutoSaveData();
    return data ? new Date(data.lastSaved) : null;
  }

  /**
   * Clear auto-save data after successful submission
   */
  clearAutoSave(): void {
    localStorage.removeItem(this.getStorageKey());
    console.log('🗑️ Auto-save cleared');
  }

  /**
   * Get formatted last saved time
   */
  getFormattedLastSaved(): string {
    const lastSaved = this.getLastSavedTime();
    if (!lastSaved) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return lastSaved.toLocaleDateString();
  }

  /**
   * Cleanup on unmount
   */
  cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

/**
 * Get all courses with auto-save data
 */
export function getAllAutoSavedCourses(): Array<{ courseId: string; lastSaved: string }> {
  const courses: Array<{ courseId: string; lastSaved: string }> = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUTOSAVE_KEY_PREFIX)) {
        const courseId = key.replace(AUTOSAVE_KEY_PREFIX, '');
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          courses.push({
            courseId,
            lastSaved: parsed.lastSaved,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error getting auto-saved courses:', error);
  }

  return courses;
}

/**
 * Clear all auto-save data (for testing/cleanup)
 */
export function clearAllAutoSaves(): void {
  const keys: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(AUTOSAVE_KEY_PREFIX)) {
      keys.push(key);
    }
  }

  keys.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ Cleared ${keys.length} auto-saves`);
}