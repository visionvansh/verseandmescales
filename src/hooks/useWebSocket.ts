// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";

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

  // ✅ Question events
  onQuestionNew?: (data: any) => void;
  onQuestionUpvote?: (data: any) => void;
  onQuestionView?: (data: any) => void;
  onQuestionAnswer?: (data: any) => void;
  onAnswerThanked?: (data: any) => void;

  // ✅ NEW: Preferences events
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
    // ✅ Question handlers
    onQuestionNew,
    onQuestionUpvote,
    onQuestionView,
    onQuestionAnswer,
    onAnswerThanked,
    // ✅ NEW: Goals & Preferences handlers
    onGoalsUpdated,
    onPreferencesUpdated,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<Array<any>>([]);

  const maxReconnectAttempts = 5;
  const maxQueueSize = 10;

  // ✅ Stable event handlers using refs
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
    onGoalsUpdated,
    onPreferencesUpdated,
  ]);

  // ✅ Cleanup function
  const cleanup = useCallback(() => {
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
        wsRef.current.close();
      } catch (e) {
        console.log("Error closing WebSocket:", e);
      }
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsRoomJoined(false);
  }, []);

  // ✅ Connect function (stable)
  const connect = useCallback(() => {
    if (!enabled || !roomId) {
      console.log("⏸️ WS: Not connecting - disabled or no roomId");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("⏸️ WS: Already connected");
      return;
    }

    cleanup();

    const wsUrl = `ws://localhost:3001`;
    console.log("🔌 WS: Connecting to", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WS: Connected");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: "ping" }));
          }
        }, 30000);
      };

      ws.onerror = (err) => {
        console.error("❌ WS: Error", err);
        handlersRef.current.onError?.(err);
      };

      ws.onclose = () => {
        console.log("🔌 WS: Closed");
        setIsConnected(false);
        setIsRoomJoined(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Reconnect logic
        if (reconnectAttemptsRef.current < maxReconnectAttempts && enabled) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            10000
          );

          setError(`Reconnecting in ${Math.ceil(delay / 1000)}s...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError("Connection failed. Please refresh.");
        }
      };

      ws.onmessage = (event) => {
        try {
          const { event: eventType, data } = JSON.parse(event.data);

          switch (eventType) {
            case "authenticated":
              console.log("✅ WS: Authenticated");
              ws.send(
                JSON.stringify({
                  event: "join_room",
                  data: { roomId },
                })
              );
              break;

            case "room_joined":
              console.log("✅ WS: Room joined");
              setIsRoomJoined(true);
              setError(null);

              // ✅ Process ALL queued messages (including custom events)
              if (messageQueueRef.current.length > 0) {
                console.log(
                  `📤 WS: Processing ${messageQueueRef.current.length} queued items`
                );

                messageQueueRef.current.forEach((item) => {
                  // ✅ Handle both message format and event format
                  if (item.event) {
                    // Custom event format
                    ws.send(
                      JSON.stringify({
                        event: item.event,
                        data: item.data,
                      })
                    );
                  } else {
                    // Standard message format
                    ws.send(
                      JSON.stringify({
                        event: "send_message",
                        data: item,
                      })
                    );
                  }
                });

                messageQueueRef.current = [];
              }
              break;

            case "message:new":
              console.log("📨 WS: New message");
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

            // ✅ Question event handlers
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
              
              // ✅ ALSO dispatch as global event for modal
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('question:answer', {
                  detail: data
                }));
              }
              break;

            case "answer:thanked":
              console.log("🙏 WS: Answer thanked");
              handlersRef.current.onAnswerThanked?.(data);
              
              // ✅ ALSO dispatch as global event for modal
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('answer:thanked', {
                  detail: data
                }));
              }
              break;

            // ✅ NEW: Goals & Preferences event handlers
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
              // Heartbeat response
              break;

            default:
              console.log("⚠️ WS: Unknown event:", eventType);
          }
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };
    } catch (err) {
      console.error("❌ WS: Failed to create connection", err);
      setError("Connection failed");
      handlersRef.current.onError?.(err);
    }
  }, [enabled, roomId, cleanup]);

  // ✅ Single connection effect
  useEffect(() => {
    if (enabled && roomId) {
      connect();
    }

    return cleanup;
  }, [enabled, roomId, connect, cleanup]);

  // ✅ WebSocket methods
  const sendMessage = useCallback(
    async (data: {
      content: string;
      replyToId?: string;
      messageType?: string;
    }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error("Not connected");
      }

      if (!isRoomJoined) {
        if (messageQueueRef.current.length < maxQueueSize) {
          console.log("⏳ WS: Queuing message");
          messageQueueRef.current.push(data);
          setError("Sending...");
          return;
        }
        throw new Error("Connection not ready");
      }

      wsRef.current.send(
        JSON.stringify({
          event: "send_message",
          data,
        })
      );
      setError(null);
    },
    [isRoomJoined]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
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
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
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
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
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

  // ✅ Question-related WebSocket methods
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
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
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
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
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
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
        throw new Error("Not connected");
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
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
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

  // ✅ NEW: Goals & Preferences methods
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

  // ✅ Listen for custom events and send to WebSocket server
  useEffect(() => {
    const handleCustomEvent = (event: CustomEvent) => {
      const { event: eventType, data } = event.detail;

      console.log(
        "📡 Custom event received:",
        eventType,
        "Connected:",
        isConnected,
        "Room joined:",
        isRoomJoined
      );

      // ✅ FIXED: Queue if not ready, otherwise send immediately
      if (
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !isRoomJoined
      ) {
        console.log("⏳ WS: Queueing event", eventType);

        // Add to queue for later
        if (
          !messageQueueRef.current.find(
            (msg) => msg.event === eventType && msg.data === data
          )
        ) {
          messageQueueRef.current.push({ event: eventType, data });
        }
        return;
      }

      // Send to WebSocket server for broadcasting
      wsRef.current.send(
        JSON.stringify({
          event: eventType,
          data,
        })
      );

      console.log("✅ WS: Sent custom event:", eventType);
    };

    // ✅ Attach listener immediately, not dependent on connection state
    window.addEventListener("ws-event", handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener(
        "ws-event",
        handleCustomEvent as EventListener
      );
    };
  }, [isConnected, isRoomJoined]);

  return {
    isConnected,
    isRoomJoined,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    startTyping,
    stopTyping,
    // ✅ Question methods
    
    createQuestion,
    toggleQuestionUpvote,
    trackQuestionView,
    answerQuestion,
    // ✅ NEW: Goals & Preferences methods
    updateGoals,
    updatePreferences,
  };
}