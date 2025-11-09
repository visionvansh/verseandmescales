import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  delay?: number; // milliseconds to wait before auto-saving
  enabled?: boolean;
}

export const useAutoSave = ({
  data,
  onSave,
  delay = 3000, // 3 seconds default
  enabled = true,
}: UseAutoSaveOptions) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');
  const isMountedRef = useRef(true);
  const saveCountRef = useRef(0);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      
      await onSave(data);
      
      if (isMountedRef.current) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        previousDataRef.current = JSON.stringify(data);
        saveCountRef.current++;
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      if (isMountedRef.current) {
        setSaveError(error instanceof Error ? error.message : 'Failed to save');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [data, onSave, enabled, isSaving]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    
    // Skip if data hasn't changed
    if (currentData === previousDataRef.current) {
      return;
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      await saveNow();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, saveNow]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Save before page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && enabled) {
        e.preventDefault();
        e.returnValue = '';
        // Try to save (may not complete in time)
        saveNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, enabled, saveNow]);

  return {
    isSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges,
    saveNow,
    saveCount: saveCountRef.current,
  };
};