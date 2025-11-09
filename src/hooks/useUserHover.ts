// hooks/useUserHover.ts
"use client";
import { useState, useCallback, useRef } from 'react';
import { User } from '@/components/course-builder/chats/types';

export function useUserHover() {
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleUserHover = useCallback((user: User, e: React.MouseEvent) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2
    });
    setHoveredUser(user);
    
    const timeout = setTimeout(() => {
      setShowHoverCard(true);
    }, 300);
    
    setHoverTimeout(timeout);
  }, [hoverTimeout]);

  const handleUserLeave = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    const timeout = setTimeout(() => {
      setShowHoverCard(false);
    }, 200);
    
    setHoverTimeout(timeout);
  }, [hoverTimeout]);

  const keepHoverCardOpen = useCallback(() => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setShowHoverCard(true);
  }, [hoverTimeout]);

  return {
    showHoverCard,
    hoveredUser,
    hoverPosition,
    handleUserHover,
    handleUserLeave,
    keepHoverCardOpen
  };
}