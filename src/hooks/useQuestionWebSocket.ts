// hooks/useQuestionWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl, WEBSOCKET_CONFIG } from '@/lib/websocket-config';

interface UseQuestionWebSocketOptions {
  courseId: string;
  enabled?: boolean;
  onQuestionCreated?: (question: any) => void;
  onQuestionUpdated?: (question: any) => void;
  onQuestionDeleted?: (data: { questionId: string }) => void;
  onQuestionUpvoteUpdated?: (data: any) => void;
  onQuestionViewUpdated?: (data: any) => void;
  onAnswerCreated?: (answer: any) => void;
  onAnswerUpvoteUpdated?: (data: any) => void;
}

export function useQuestionWebSocket(options: UseQuestionWebSocketOptions) {
  const {
    courseId,
    enabled = true,
    onQuestionCreated,
    onQuestionUpdated,
    onQuestionDeleted,
    onQuestionUpvoteUpdated,
    onQuestionViewUpdated,
    onAnswerCreated,
    onAnswerUpvoteUpdated,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUpRef = useRef(false);

  // Stable event handlers using refs
  const handlersRef = useRef({
    onQuestionCreated,
    onQuestionUpdated,
    onQuestionDeleted,
    onQuestionUpvoteUpdated,
    onQuestionViewUpdated,
    onAnswerCreated,
    onAnswerUpvoteUpdated,
  });

  useEffect(() => {
    handlersRef.current = {
      onQuestionCreated,
      onQuestionUpdated,
      onQuestionDeleted,
      onQuestionUpvoteUpdated,
      onQuestionViewUpdated,
      onAnswerCreated,
      onAnswerUpvoteUpdated,
    };
  }, [
    onQuestionCreated,
    onQuestionUpdated,
    onQuestionDeleted,
    onQuestionUpvoteUpdated,
    onQuestionViewUpdated,
    onAnswerCreated,
    onAnswerUpvoteUpdated,
  ]);

  const cleanup = useCallback(() => {
    isCleaningUpRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'Component unmounting');
        }
      } catch (e) {
        console.log('Error closing Question WS:', e);
      }
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsSubscribed(false);

    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 100);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !courseId) {
      console.log('⏸️ Question WS: Not connecting - disabled or no courseId');
      return;
    }

    if (isCleaningUpRef.current) {
      console.log('⏸️ Question WS: Cleanup in progress');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⏸️ Question WS: Already connected');
      return;
    }

    cleanup();

    const wsUrl = getWebSocketUrl();
    console.log('🔌 Question WS: Connecting to', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('⏱️ Question WS: Connection timeout');
          ws.close();
          setError('Connection timeout');
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Question WS: Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ event: 'ping' }));
            } catch (err) {
              console.error('Question WS: Failed to send ping:', err);
            }
          }
        }, WEBSOCKET_CONFIG.heartbeat.interval);
      };

      ws.onerror = (err) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Question WS: Error', err);
        setError('Connection error');
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 Question WS: Closed', event.code, event.reason);
        setIsConnected(false);
        setIsSubscribed(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        if (isCleaningUpRef.current || event.code === 1000) {
          console.log('✋ Question WS: Clean disconnect');
          return;
        }

        if (reconnectAttemptsRef.current < WEBSOCKET_CONFIG.reconnect.maxAttempts && enabled) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            WEBSOCKET_CONFIG.reconnect.baseDelay * Math.pow(2, reconnectAttemptsRef.current),
            WEBSOCKET_CONFIG.reconnect.maxDelay
          );
          
          const retryMessage = `Reconnecting in ${Math.ceil(delay / 1000)}s... (${reconnectAttemptsRef.current}/${WEBSOCKET_CONFIG.reconnect.maxAttempts})`;
          console.log('🔄 Question WS:', retryMessage);
          setError(retryMessage);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleaningUpRef.current) {
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= WEBSOCKET_CONFIG.reconnect.maxAttempts) {
          setError('Connection failed. Please refresh.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data);

          switch (eventType) {
            case 'authenticated':
              console.log('✅ Question WS: Authenticated, subscribing to course:', courseId);
              ws.send(JSON.stringify({
                event: 'question:subscribe',
                data: { courseId }
              }));
              break;

            case 'question:subscribed':
              console.log('✅ Question WS: Subscribed to course updates');
              setIsSubscribed(true);
              setError(null);
              break;

            case 'question:created':
            case 'question:new':
              console.log('📨 Question WS: New question');
              handlersRef.current.onQuestionCreated?.(data);
              break;

            case 'question:updated':
              console.log('✏️ Question WS: Question updated');
              handlersRef.current.onQuestionUpdated?.(data);
              break;

            case 'question:deleted':
              console.log('🗑️ Question WS: Question deleted');
              handlersRef.current.onQuestionDeleted?.(data);
              break;

            case 'question:upvote':
            case 'question:upvote:updated':
              console.log('👍 Question WS: Upvote updated');
              handlersRef.current.onQuestionUpvoteUpdated?.(data);
              break;

            case 'question:view':
            case 'question:view:updated':
              console.log('👁️ Question WS: View updated');
              handlersRef.current.onQuestionViewUpdated?.(data);
              break;

            case 'answer:created':
            case 'question:answer':
              console.log('💬 Question WS: New answer');
              handlersRef.current.onAnswerCreated?.(data);
              break;

            case 'answer:upvote':
            case 'answer:upvote:updated':
              console.log('👍 Question WS: Answer upvote updated');
              handlersRef.current.onAnswerUpvoteUpdated?.(data);
              break;

            case 'error':
              console.error('❌ Question WS: Server error', data);
              setError(data.message);
              break;

            case 'pong':
              // Heartbeat response
              break;

            default:
              console.log('⚠️ Question WS: Unknown event:', eventType);
          }
        } catch (err) {
          console.error('Failed to parse Question WS message:', err);
        }
      };

    } catch (err) {
      console.error('❌ Question WS: Failed to create connection', err);
      setError('Connection failed');
    }
  }, [enabled, courseId, cleanup]);

  useEffect(() => {
    if (enabled && courseId) {
      connect();
    }

    return cleanup;
  }, [enabled, courseId, connect, cleanup]);

  // WebSocket methods
  const upvoteQuestion = useCallback((questionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isSubscribed) {
      try {
        wsRef.current.send(JSON.stringify({
          event: 'question:upvote',
          data: { questionId }
        }));
      } catch (err) {
        console.error('Failed to send upvote:', err);
      }
    }
  }, [isSubscribed]);

  const upvoteAnswer = useCallback((answerId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isSubscribed) {
      try {
        wsRef.current.send(JSON.stringify({
          event: 'answer:upvote',
          data: { answerId }
        }));
      } catch (err) {
        console.error('Failed to send answer upvote:', err);
      }
    }
  }, [isSubscribed]);

  const trackView = useCallback((questionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isSubscribed) {
      try {
        wsRef.current.send(JSON.stringify({
          event: 'question:view',
          data: { questionId }
        }));
      } catch (err) {
        console.error('Failed to track view:', err);
      }
    }
  }, [isSubscribed]);

  return {
    isConnected,
    isSubscribed,
    error,
    upvoteQuestion,
    upvoteAnswer,
    trackView,
  };
}