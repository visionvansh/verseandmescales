import { useEffect, useRef, useState, useCallback } from 'react';
import Cookies from 'js-cookie';

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

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

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
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.log('Error closing WS:', e);
      }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !courseId) {
      console.log('⏸️ Question WS: Not connecting - disabled or no courseId');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⏸️ Question WS: Already connected');
      return;
    }

    cleanup();

    const wsUrl = `ws://localhost:3001`;
    console.log('🔌 Question WS: Connecting to', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Question WS: Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to question updates
        const token = Cookies.get('auth-token');
        ws.send(JSON.stringify({
          event: 'question:subscribe',
          data: { token, courseId }
        }));
      };

      ws.onerror = (err) => {
        console.error('❌ Question WS: Error', err);
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log('🔌 Question WS: Closed');
        setIsConnected(false);

        if (reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          
          setError(`Reconnecting in ${Math.ceil(delay / 1000)}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Connection failed. Please refresh.');
        }
      };

      ws.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data);

          switch (eventType) {
            case 'question:subscribed':
              console.log('✅ Question WS: Subscribed');
              break;

            case 'question:created':
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

            case 'question:upvote:updated':
              console.log('👍 Question WS: Upvote updated');
              handlersRef.current.onQuestionUpvoteUpdated?.(data);
              break;

            case 'question:view:updated':
              console.log('👁️ Question WS: View updated');
              handlersRef.current.onQuestionViewUpdated?.(data);
              break;

            case 'answer:created':
              console.log('💬 Question WS: New answer');
              handlersRef.current.onAnswerCreated?.(data);
              break;

            case 'answer:upvote:updated':
              console.log('👍 Question WS: Answer upvote updated');
              handlersRef.current.onAnswerUpvoteUpdated?.(data);
              break;

            case 'error':
              console.error('❌ Question WS: Server error', data);
              setError(data.message);
              break;

            default:
              console.log('⚠️ Question WS: Unknown event:', eventType);
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
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
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'question:upvote',
        data: { questionId }
      }));
    }
  }, []);

  const upvoteAnswer = useCallback((answerId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'answer:upvote',
        data: { answerId }
      }));
    }
  }, []);

  const trackView = useCallback((questionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        event: 'question:view',
        data: { questionId }
      }));
    }
  }, []);

  return {
    isConnected,
    error,
    upvoteQuestion,
    upvoteAnswer,
    trackView,
  };
}