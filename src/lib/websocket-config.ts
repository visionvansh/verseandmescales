// lib/websocket-config.ts
export const WEBSOCKET_CONFIG = {
  // Dynamic URL based on environment
  url: process.env.NEXT_PUBLIC_WS_URL || 
       (typeof window !== 'undefined' && window.location.hostname === 'localhost'
         ? 'ws://localhost:3001'
         : 'wss://your-websocket-server.onrender.com'), // Replace with your Render URL
  
  // Reconnection settings
  reconnect: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 10000,
  },
  
  // Heartbeat settings
  heartbeat: {
    interval: 30000, // 30 seconds
    timeout: 35000,  // 35 seconds
  },
  
  // Queue settings
  queue: {
    maxSize: 50,
  },
};

export function getWebSocketUrl(): string {
  const url = WEBSOCKET_CONFIG.url;
  console.log('🔗 Using WebSocket URL:', url);
  return url;
}