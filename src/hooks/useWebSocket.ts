// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { getWebSocketUrl, WEBSOCKET_CONFIG } from "@/lib/websocket-config";

export interface UseWebSocketOptions {
  roomId: string;
  enabled?: boolean;
  onMessage?: (message: any) => void;
  onMessageEdited?: (data: any) => void;
  onMessageDeleted?: (data: any) => void;
  onReaction?: (data: any) => void;
  onTyping?: (data: any) => void;
  onUserOnline?: (data: any) => void;
  onUserOffline?: (data: any) => void;
  onError?: (error: any) => void;
  onQuestionNew?: (data: any) => void;
  onQuestionUpvote?: (data: any) => void;
  onQuestionView?: (data: any) => void;
  onQuestionAnswer?: (data: any) => void;
  onAnswerThanked?: (data: any) => void;
  onAnswerUpvote?: (data: any) => void;
  onGoalsUpdated?: (data: any) => void;
  onPreferencesUpdated?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    roomId,
    enabled = true,
    onMessage,
    onMessageEdited,
    onMessageDeleted,
    onReaction,
    onTyping,
    onUserOnline,
    onUserOffline,
    onError,
    onQuestionNew,
    onQuestionUpvote,
    onQuestionView,
    onQuestionAnswer,
    onAnswerThanked,
    onAnswerUpvote,
    onGoalsUpdated,
    onPreferencesUpdated,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoomJoined, setIsRoomJoined] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<Array<any>>([]);
  const isCleaningUpRef = useRef(false);

  // Stable event handlers using refs
  const handlersRef = useRef({
    onMessage,
    onMessageEdited,
    onMessageDeleted,
    onReaction,
    onTyping,
    onUserOnline,
    onUserOffline,
    onError,
    onQuestionNew,
    onQuestionUpvote,
    onQuestionView,
    onQuestionAnswer,
    onAnswerThanked,
    onAnswerUpvote,
    onGoalsUpdated,
    onPreferencesUpdated,
  });

  // Update handlers without triggering reconnects
  useEffect(() => {
    handlersRef.current = {
      onMessage,
      onMessageEdited,
      onMessageDeleted,
      onReaction,
      onTyping,
      onUserOnline,
      onUserOffline,
      onError,
      onQuestionNew,
      onQuestionUpvote,
      onQuestionView,
      onQuestionAnswer,
      onAnswerThanked,
      onAnswerUpvote,
      onGoalsUpdated,
      onPreferencesUpdated,
    };
  }, [
    onMessage,
    onMessageEdited,
    onMessageDeleted,
    onReaction,
    onTyping,
    onUserOnline,
    onUserOffline,
    onError,
    onQuestionNew,
    onQuestionUpvote,
    onQuestionView,
    onQuestionAnswer,
    onAnswerThanked,
    onAnswerUpvote,
    onGoalsUpdated,
    onPreferencesUpdated,
  ]);

  // ✅ Cleanup function
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
        // Remove event listeners to prevent memory leaks
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'Component unmounting');
        }
      } catch (e) {
        console.log("Error closing WebSocket:", e);
      }
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsRoomJoined(false);
    setConnectionState('disconnected');
    
    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 100);
  }, []);

  // ✅ Connect function with production support
  const connect = useCallback(() => {
  if (!enabled || !roomId) {
    console.log("⏸️ WS: Not connecting - disabled or no roomId", { enabled, roomId });
    return;
  }

  if (isCleaningUpRef.current) {
    console.log("⏸️ WS: Cleanup in progress, skipping connect");
    return;
  }

  if (wsRef.current?.readyState === WebSocket.OPEN) {
    console.log("⏸️ WS: Already connected");
    return;
  }

  cleanup();

  const wsUrl = getWebSocketUrl();
  console.log("🔌 WS: Connecting to", wsUrl);
  console.log("🍪 WS: Cookies available:", document.cookie ? 'YES' : 'NO');
  
  setConnectionState('connecting');

  try {
    // ✅ IMPORTANT: WebSocket doesn't send cookies by default in cross-origin
    // We need to handle auth differently
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.log("⏱️ WS: Connection timeout after 10s");
        console.log("🔍 WS: ReadyState:", ws.readyState);
        ws.close();
        setError("Connection timeout - server may be sleeping");
        setConnectionState('error');
      }
    }, 10000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log("✅ WS: Connected successfully");
      console.log("🔗 WS: URL:", wsUrl);
      console.log("🌐 WS: ReadyState:", ws.readyState);
      setIsConnected(true);
      setError(null);
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ event: "ping" }));
            console.log("💓 WS: Heartbeat sent");
          } catch (err) {
            console.error("❌ WS: Failed to send ping:", err);
          }
        }
      }, WEBSOCKET_CONFIG.heartbeat.interval);
    };

    ws.onerror = (err) => {
      clearTimeout(connectionTimeout);
      console.error("❌ WS: Error event", err);
      console.error("❌ WS: Error type:", err.type);
      console.error("❌ WS: Target:", err.target);
      setConnectionState('error');
      setError("Connection error - check console");
      handlersRef.current.onError?.(err);
    };

    ws.onclose = (event) => {
      clearTimeout(connectionTimeout);
      console.log("🔌 WS: Closed", event.code, event.reason);
      setIsConnected(false);
      setIsRoomJoined(false);
      setConnectionState('disconnected');

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Don't reconnect if cleanup was intentional
      if (isCleaningUpRef.current || event.code === 1000) {
        console.log("✋ WS: Clean disconnect, not reconnecting");
        return;
      }

      // Reconnect logic with exponential backoff
      if (reconnectAttemptsRef.current < WEBSOCKET_CONFIG.reconnect.maxAttempts && enabled) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(
          WEBSOCKET_CONFIG.reconnect.baseDelay * Math.pow(2, reconnectAttemptsRef.current),
          WEBSOCKET_CONFIG.reconnect.maxDelay
        );

        const retryMessage = `Reconnecting in ${Math.ceil(delay / 1000)}s... (${reconnectAttemptsRef.current}/${WEBSOCKET_CONFIG.reconnect.maxAttempts})`;
        console.log("🔄 WS:", retryMessage);
        setError(retryMessage);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isCleaningUpRef.current) {
            connect();
          }
        }, delay);
      } else if (reconnectAttemptsRef.current >= WEBSOCKET_CONFIG.reconnect.maxAttempts) {
        setError("Connection failed. Please refresh the page.");
        setConnectionState('error');
      }
    };

    ws.onmessage = (event) => {
      try {
        const { event: eventType, data } = JSON.parse(event.data);

        switch (eventType) {
          case "authenticated":
            console.log("✅ WS: Authenticated, joining room:", roomId);
            ws.send(
              JSON.stringify({
                event: "join_room",
                data: { roomId },
              })
            );
            break;

          case "room_joined":
            console.log("✅ WS: Room joined successfully");
            setIsRoomJoined(true);
            setError(null);

            // Process queued messages
            if (messageQueueRef.current.length > 0) {
              console.log(
                `📤 WS: Processing ${messageQueueRef.current.length} queued items`
              );

              messageQueueRef.current.forEach((item) => {
                try {
                  if (item.event) {
                    ws.send(JSON.stringify({ event: item.event, data: item.data }));
                  } else {
                    ws.send(JSON.stringify({ event: "send_message", data: item }));
                  }
                } catch (err) {
                  console.error("Failed to send queued message:", err);
                }
              });

              messageQueueRef.current = [];
            }
            break;

          case "message:new":
            console.log("📨 WS: New message received");
            handlersRef.current.onMessage?.(data);
            break;

          case "message:edited":
            console.log("✏️ WS: Message edited");
            handlersRef.current.onMessageEdited?.(data);
            break;

          case "message:deleted":
            console.log("🗑️ WS: Message deleted");
            handlersRef.current.onMessageDeleted?.(data);
            break;

          case "reaction:toggle":
            console.log("👍 WS: Reaction toggled");
            handlersRef.current.onReaction?.(data);
            break;

          case "user:typing":
            handlersRef.current.onTyping?.(data);
            break;

          case "user:online":
            console.log("🟢 WS: User online", data.userId);
            handlersRef.current.onUserOnline?.(data);
            break;

          case "user:offline":
            console.log("⚫ WS: User offline", data.userId);
            handlersRef.current.onUserOffline?.(data);
            break;

          case "question:new":
            console.log("📝 WS: New question");
            handlersRef.current.onQuestionNew?.(data);
            break;

          case "question:upvote":
            console.log("👍 WS: Question upvoted");
            handlersRef.current.onQuestionUpvote?.(data);
            break;

          case "question:view":
            console.log("👁️ WS: Question viewed");
            handlersRef.current.onQuestionView?.(data);
            break;

          case "question:answer":
            console.log("💬 WS: Question answered");
            handlersRef.current.onQuestionAnswer?.(data);
            
            // Dispatch global event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('question:answer', {
                detail: data
              }));
            }
            break;

          case "answer:thanked":
            console.log("🙏 WS: Answer thanked");
            handlersRef.current.onAnswerThanked?.(data);
            
            // Dispatch global event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('answer:thanked', {
                detail: data
              }));
            }
            break;

          case "answer:upvote":
            console.log("👍 WS: Answer upvoted");
            handlersRef.current.onAnswerUpvote?.(data);
            break;

          case "goals:updated":
            console.log("📊 WS: Goals updated");
            handlersRef.current.onGoalsUpdated?.(data);
            break;

          case "preferences:updated":
            console.log("⚙️ WS: Preferences updated");
            handlersRef.current.onPreferencesUpdated?.(data);
            break;

          case "error":
            console.error("❌ WS: Server error", data);
            setError(data.message);
            handlersRef.current.onError?.(data);
            break;

          case "pong":
            // Heartbeat response - connection is alive
            break;

          case "server:shutdown":
            console.log("🛑 WS: Server shutting down");
            setError("Server restarting...");
            break;

          default:
            console.log("⚠️ WS: Unknown event:", eventType, data);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };
  } catch (err) {
    console.error("❌ WS: Failed to create connection", err);
    setError("Failed to connect");
    setConnectionState('error');
    handlersRef.current.onError?.(err);
  }
}, [enabled, roomId, cleanup]);

  // Single connection effect
  useEffect(() => {
    if (enabled && roomId) {
      connect();
    }

    return cleanup;
  }, [enabled, roomId, connect, cleanup]);

  // ✅ WebSocket methods with better error handling
  const sendMessage = useCallback(
    async (data: {
      content: string;
      replyToId?: string;
      messageType?: string;
    }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("Not connected to server");
      }

      if (!isRoomJoined) {
        if (messageQueueRef.current.length < WEBSOCKET_CONFIG.queue.maxSize) {
          console.log("⏳ WS: Queuing message (room not joined yet)");
          messageQueueRef.current.push(data);
          setError("Connecting...");
          return;
        }
        throw new Error("Message queue full. Please try again.");
      }

      try {
        wsRef.current.send(
          JSON.stringify({
            event: "send_message",
            data,
          })
        );
        setError(null);
      } catch (err) {
        console.error("Failed to send message:", err);
        throw new Error("Failed to send message");
      }
    },
    [isRoomJoined]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        throw new Error("Not connected");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "edit_message",
          data: { messageId, content },
        })
      );
    },
    [isRoomJoined]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        throw new Error("Not connected");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "delete_message",
          data: { messageId },
        })
      );
    },
    [isRoomJoined]
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        throw new Error("Not connected");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "toggle_reaction",
          data: { messageId, emoji },
        })
      );
    },
    [isRoomJoined]
  );

  const startTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isRoomJoined) {
      wsRef.current.send(
        JSON.stringify({
          event: "typing",
          data: { isTyping: true },
        })
      );
    }
  }, [isRoomJoined]);

  const stopTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isRoomJoined) {
      wsRef.current.send(
        JSON.stringify({
          event: "typing",
          data: { isTyping: false },
        })
      );
    }
  }, [isRoomJoined]);

  const createQuestion = useCallback(
    async (data: {
      lessonId: string;
      moduleId: string;
      title: string;
      description?: string;
      tags?: string[];
      videoTimestamp?: string;
      visibility: string;
    }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        throw new Error("Not connected");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "question:new",
          data: { roomId, ...data },
        })
      );
    },
    [roomId, isRoomJoined]
  );

  const toggleQuestionUpvote = useCallback(
    async (questionId: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        throw new Error("Not connected");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "question:upvote",
          data: { roomId, questionId },
        })
      );
    },
    [roomId, isRoomJoined]
  );

  const trackQuestionView = useCallback(
    async (questionId: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        return; // Silently fail for view tracking
      }

      wsRef.current.send(
        JSON.stringify({
          event: "question:view",
          data: { roomId, questionId },
        })
      );
    },
    [roomId, isRoomJoined]
  );

  const answerQuestion = useCallback(
    async (questionId: string, content: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        throw new Error("Not connected");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "question:answer",
          data: { roomId, questionId, content },
        })
      );
    },
    [roomId, isRoomJoined]
  );

  const updateGoals = useCallback(
    async (goals: {
      purpose?: string;
      monthlyGoal?: string;
      timeCommitment?: string;
    }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("Not connected");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "goals:update",
          data: goals,
        })
      );
    },
    []
  );

  const updatePreferences = useCallback(async (preferences: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("Not connected");
    }

    wsRef.current.send(
      JSON.stringify({
        event: "preferences:update",
        data: preferences,
      })
    );
  }, []);

  // Listen for custom events
  useEffect(() => {
    const handleCustomEvent = (event: CustomEvent) => {
      const { event: eventType, data } = event.detail;

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !isRoomJoined) {
        // Queue if not ready
        if (!messageQueueRef.current.find(
          (msg) => msg.event === eventType && JSON.stringify(msg.data) === JSON.stringify(data)
        )) {
          if (messageQueueRef.current.length < WEBSOCKET_CONFIG.queue.maxSize) {
            messageQueueRef.current.push({ event: eventType, data });
            console.log("⏳ WS: Queued custom event:", eventType);
          }
        }
        return;
      }

      // Send immediately
      try {
        wsRef.current.send(
          JSON.stringify({
            event: eventType,
            data,
          })
        );
        console.log("✅ WS: Sent custom event:", eventType);
      } catch (err) {
        console.error("Failed to send custom event:", err);
      }
    };

    window.addEventListener("ws-event", handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("ws-event", handleCustomEvent as EventListener);
    };
  }, [isConnected, isRoomJoined]);

  return {
    isConnected,
    isRoomJoined,
    connectionState,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    startTyping,
    stopTyping,
    createQuestion,
    toggleQuestionUpvote,
    trackQuestionView,
    answerQuestion,
    updateGoals,
    updatePreferences,
  };
}