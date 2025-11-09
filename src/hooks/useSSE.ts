// hooks/useSSE.ts
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseSSEOptions {
  roomId: string;
  enabled?: boolean; // ✅ Add enabled flag
  onMessage?: (message: any) => void;
  onReaction?: (data: any) => void;
  onTyping?: (data: any) => void;
  onUserOnline?: (data: any) => void;
  onUserOffline?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useSSE({
  roomId,
  enabled = true, // ✅ Default to true
  onMessage,
  onReaction,
  onTyping,
  onUserOnline,
  onUserOffline,
  onError
}: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Connect to SSE
  const connect = useCallback(() => {
    // ✅ FIX: Check if enabled first
    if (!enabled) {
      console.log('⏸️ SSE: Connection disabled (waiting for initialization)');
      return;
    }

    if (!roomId) {
      console.log('❌ SSE: Missing roomId');
      setError('Chat room not initialized yet');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      console.log('🔄 SSE: Closing existing connection');
      eventSourceRef.current.close();
    }

    // ✅ FIX: Remove token from URL - use cookie authentication
    const url = `/api/chat/rooms/${roomId}/stream`;
    console.log('🔌 SSE: Connecting to', url);

    try {
      const eventSource = new EventSource(url, {
        withCredentials: true // ✅ Send cookies automatically
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log('✅ SSE: Connected successfully to room:', roomId);
      };

      eventSource.onerror = (err) => {
        console.error('❌ SSE: Connection error', err);
        setIsConnected(false);
        
        // Close the failed connection
        eventSource.close();
        
        // Retry logic
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          
          setError(`Connection lost. Retrying in ${delay / 1000}s... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          console.log(`🔄 SSE: Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('Connection failed. Please refresh the page.');
          console.error('❌ SSE: Max reconnection attempts reached');
        }
        
        onError?.(err);
      };

      // ✅ Connection confirmed event
      eventSource.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        console.log('✅ SSE: Connection confirmed', data);
      });

      // ✅ Heartbeat handler
      eventSource.addEventListener('heartbeat', (e) => {
        // Silent heartbeat - just keeps connection alive
        console.log('💓 SSE: Heartbeat received');
      });

      // Message events
      eventSource.addEventListener('message:new', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📨 SSE: New message', data.id);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      });

      eventSource.addEventListener('message:edited', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('✏️ SSE: Message edited', data.id);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse edited message:', err);
        }
      });

      eventSource.addEventListener('message:deleted', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('🗑️ SSE: Message deleted', data.id);
          onMessage?.(data);
        } catch (err) {
          console.error('Failed to parse deleted message:', err);
        }
      });

      eventSource.addEventListener('reaction:toggle', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('👍 SSE: Reaction toggled', data);
          onReaction?.(data);
        } catch (err) {
          console.error('Failed to parse reaction:', err);
        }
      });

      eventSource.addEventListener('user:typing', (e) => {
        try {
          const data = JSON.parse(e.data);
          onTyping?.(data);
        } catch (err) {
          console.error('Failed to parse typing:', err);
        }
      });

      eventSource.addEventListener('user:online', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('🟢 SSE: User online', data.userId);
          onUserOnline?.(data);
        } catch (err) {
          console.error('Failed to parse online status:', err);
        }
      });

      eventSource.addEventListener('user:offline', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('⚫ SSE: User offline', data.userId);
          onUserOffline?.(data);
        } catch (err) {
          console.error('Failed to parse offline status:', err);
        }
      });

      // ✅ Error event handler
      eventSource.addEventListener('error', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          console.error('❌ SSE: Server error', data);
          setError(data.message);
        } catch (err) {
          // Silent - this is likely the connection error already handled
        }
      });

    } catch (err) {
      console.error('❌ SSE: Failed to create EventSource', err);
      setError('Failed to establish connection');
      onError?.(err);
    }

  }, [roomId, enabled, onMessage, onReaction, onTyping, onUserOnline, onUserOffline, onError]);

  useEffect(() => {
    console.log('🔄 SSE: Effect triggered - roomId:', roomId, 'enabled:', enabled);
    
    if (enabled && roomId) {
      connect();
    } else {
      console.log('⏸️ SSE: Not connecting yet (enabled:', enabled, 'roomId:', !!roomId, ')');
      setIsConnected(false);
      setError(null);
    }

    return () => {
      console.log('🧹 SSE: Cleanup');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect, enabled, roomId]);

  // Send message via API
  const sendMessage = useCallback(async (data: {
    content: string;
    replyToId?: string;
    messageType?: string;
    mediaUrl?: string;
  }) => {
    if (!roomId) {
      throw new Error('Chat room not initialized');
    }

    const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  }, [roomId]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    const response = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit message');
    }

    return response.json();
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const response = await fetch(`/api/chat/messages/${messageId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }

    return response.json();
  }, []);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ emoji })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle reaction');
    }

    return response.json();
  }, []);

  const startTyping = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await fetch(`/api/chat/rooms/${roomId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isTyping: true })
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [roomId]);

  const stopTyping = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await fetch(`/api/chat/rooms/${roomId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isTyping: false })
      });
    } catch (error) {
      console.error('Failed to stop typing indicator:', error);
    }
  }, [roomId]);

  return {
    isConnected,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    startTyping,
    stopTyping,
  };
}