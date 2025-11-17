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

  // ✅ IMPROVED: Cleanup with immediate flag reset
  const cleanup = useCallback(() => {
    console.log("🧹 WS: Starting cleanup");
    
    // ✅ Don't block new connections
    const wasConnected = wsRef.current?.readyState === WebSocket.OPEN;
    
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
          wsRef.current.close(1000, 'Component cleanup');
        }
      } catch (e) {
        console.log("⚠️ WS: Error during cleanup:", e);
      }
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsRoomJoined(false);
    setConnectionState('disconnected');
    
    console.log("✅ WS: Cleanup complete");
  }, []);

  // ✅ IMPROVED: Fetch token from API endpoint instead of cookies
  const getAuthToken = useCallback(async () => {
    try {
      // ✅ Fetch token from server (which can read HttpOnly cookies)
      const response = await fetch('/api/auth/ws-token', {
        credentials: 'include', // Include cookies in request
      });
      
      if (!response.ok) {
        console.error("❌ WS: Failed to get token from API:", response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (!data.token) {
        console.error("❌ WS: No token in API response");
        return null;
      }
      
      console.log("✅ WS: Token fetched from API, length:", data.token.length);
      return data.token;
      
    } catch (error) {
      console.error("❌ WS: Error fetching token:", error);
      return null;
    }
  }, []);

  // ✅ IMPROVED: Connect with better state management
  const connect = useCallback(async () => {
    if (!enabled || !roomId) {
      console.log("⏸️ WS: Not connecting", { enabled, roomId });
      return;
    }

    // ✅ REMOVE the isCleaningUpRef check - it's blocking reconnection!
    
    // ✅ Check if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("✅ WS: Already connected");
      return;
    }

    // ✅ Close any existing connection before creating new one
    if (wsRef.current) {
      console.log("🔄 WS: Closing previous connection");
      try {
        wsRef.current.close();
      } catch (e) {
        console.log("⚠️ WS: Error closing previous connection:", e);
      }
      wsRef.current = null;
    }

    // ✅ Fetch token from API
    const token = await getAuthToken();
    
    if (!token) {
      console.error("❌ WS: No auth token - cannot connect");
      setError("Not authenticated - please log in");
      setConnectionState('error');
      return;
    }

    // ✅ ADD TOKEN TO WEBSOCKET URL
    const baseUrl = getWebSocketUrl();
    const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;
    
    console.log("🔌 WS: Connecting...");
    console.log("🔗 WS: URL:", baseUrl);
    console.log("🎫 WS: Token length:", token.length);
    console.log("🏠 WS: Room ID:", roomId);
    
    setConnectionState('connecting');
    setError(null); // ✅ Clear previous errors

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log("⏱️ WS: Connection timeout");
          ws.close();
          setError("Connection timeout - check your internet");
          setConnectionState('error');
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("✅ WS: Connected successfully!");
        setIsConnected(true);
        setError(null);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ event: "ping" }));
            } catch (err) {
              console.error("❌ WS: Failed to send ping:", err);
            }
          }
        }, WEBSOCKET_CONFIG.heartbeat.interval);
      };

      ws.onerror = (err) => {
        clearTimeout(connectionTimeout);
        console.error("❌ WS: Connection error", err);
        setConnectionState('error');
        setError("Connection error - check server status");
        handlersRef.current.onError?.(err);
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log("🔌 WS: Connection closed");
        console.log("   Code:", event.code);
        console.log("   Reason:", event.reason || 'No reason provided');
        console.log("   Clean:", event.wasClean);
        
        setIsConnected(false);
        setIsRoomJoined(false);
        setConnectionState('disconnected');

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // ✅ Don't reconnect if:
        // 1. Normal close (1000)
        // 2. Auth failed (1008)
        // 3. Component disabled
        if (event.code === 1000) {
          console.log("✋ WS: Normal close - not reconnecting");
          return;
        }

        if (event.code === 1008 || event.reason?.toLowerCase().includes('auth')) {
          console.error("❌ WS: Authentication failed");
          setError("Authentication failed - please refresh and log in again");
          return;
        }

        if (!enabled) {
          console.log("✋ WS: Disabled - not reconnecting");
          return;
        }

        // ✅ Reconnect logic
        if (reconnectAttemptsRef.current < WEBSOCKET_CONFIG.reconnect.maxAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            WEBSOCKET_CONFIG.reconnect.baseDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
            WEBSOCKET_CONFIG.reconnect.maxDelay
          );

          const retryMessage = `Reconnecting in ${Math.ceil(delay / 1000)}s... (${reconnectAttemptsRef.current}/${WEBSOCKET_CONFIG.reconnect.maxAttempts})`;
          console.log("🔄 WS:", retryMessage);
          setError(retryMessage);

          reconnectTimeoutRef.current = setTimeout(async () => {
            console.log("🔄 WS: Attempting reconnection...");
            await connect();
          }, delay);
        } else {
          console.error("❌ WS: Max reconnection attempts reached");
          setError("Connection failed. Please refresh the page.");
          setConnectionState('error');
        }
      };

      ws.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data);
          
          // ✅ Add debug logging for important events
          if (!['pong', 'user:typing'].includes(eventType)) {
            console.log("📨 WS: Event:", eventType);
          }

          switch (eventType) {
            case "authenticated":
              console.log("✅ WS: Authenticated! Joining room:", roomId);
              ws.send(
                JSON.stringify({
                  event: "join_room",
                  data: { roomId },
                })
              );
              break;

            case "room_joined":
              console.log("🎉 WS: Room joined successfully!");
              setIsRoomJoined(true);
              setError(null);

              // Process queued messages
              if (messageQueueRef.current.length > 0) {
                console.log(`📤 WS: Processing ${messageQueueRef.current.length} queued messages`);
                messageQueueRef.current.forEach((item) => {
                  try {
                    if (item.event) {
                      ws.send(JSON.stringify({ event: item.event, data: item.data }));
                    } else {
                      ws.send(JSON.stringify({ event: "send_message", data: item }));
                    }
                  } catch (err) {
                    console.error("❌ WS: Failed to send queued message:", err);
                  }
                });
                messageQueueRef.current = [];
              }
              break;

            case "message:new":
              handlersRef.current.onMessage?.(data);
              break;

            case "message:edited":
              handlersRef.current.onMessageEdited?.(data);
              break;

            case "message:deleted":
              handlersRef.current.onMessageDeleted?.(data);
              break;

            case "reaction:toggle":
              handlersRef.current.onReaction?.(data);
              break;

            case "user:typing":
              handlersRef.current.onTyping?.(data);
              break;

            case "user:online":
              handlersRef.current.onUserOnline?.(data);
              break;

            case "user:offline":
              handlersRef.current.onUserOffline?.(data);
              break;

            case "question:new":
              handlersRef.current.onQuestionNew?.(data);
              break;

            case "question:upvote":
              handlersRef.current.onQuestionUpvote?.(data);
              break;

            case "question:view":
              handlersRef.current.onQuestionView?.(data);
              break;

            case "question:answer":
              handlersRef.current.onQuestionAnswer?.(data);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('question:answer', {
                  detail: data
                }));
              }
              break;

            case "answer:thanked":
              handlersRef.current.onAnswerThanked?.(data);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('answer:thanked', {
                  detail: data
                }));
              }
              break;

            case "answer:upvote":
              handlersRef.current.onAnswerUpvote?.(data);
              break;

            case "goals:updated":
              handlersRef.current.onGoalsUpdated?.(data);
              break;

            case "preferences:updated":
              handlersRef.current.onPreferencesUpdated?.(data);
              break;

            case "error":
              console.error("❌ WS: Server error:", data.message);
              setError(data.message);
              handlersRef.current.onError?.(data);
              break;

            case "pong":
              // Heartbeat response - silent
              break;

            default:
              console.log("⚠️ WS: Unknown event:", eventType, data);
          }
        } catch (err) {
          console.error("❌ WS: Failed to parse message:", err, event.data);
        }
      };
    } catch (err) {
      console.error("❌ WS: Failed to create WebSocket:", err);
      setError("Failed to create connection");
      setConnectionState('error');
      handlersRef.current.onError?.(err);
    }
  }, [enabled, roomId, getAuthToken]); // ✅ Remove cleanup from dependencies

  // ✅ IMPROVED: Effect with better dependency management
  useEffect(() => {
    if (enabled && roomId) {
      console.log("🎬 WS: Effect triggered - connecting");
      connect();
    } else {
      console.log("🎬 WS: Effect triggered - cleaning up");
      cleanup();
    }

    return () => {
      console.log("🎬 WS: Effect cleanup - component unmounting");
      cleanup();
    };
  }, [enabled, roomId]); // ✅ Only depend on enabled and roomId

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