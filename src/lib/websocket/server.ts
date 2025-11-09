// lib/websocket/server.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '@/lib/prisma';
import { encryptMessage, decryptMessage } from '@/lib/encryption';

export interface ServerToClientEvents {
  'message:new': (data: any) => void;
  'message:edited': (data: any) => void;
  'message:deleted': (data: any) => void;
  'reaction:added': (data: any) => void;
  'reaction:removed': (data: any) => void;
  'user:typing': (data: any) => void;
  'user:online': (data: any) => void;
  'user:offline': (data: any) => void;
  'error': (data: any) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { roomId: string }, callback: (response: any) => void) => void;
  'room:leave': (data: { roomId: string }) => void;
  'message:send': (data: any, callback: (response: any) => void) => void;
  'message:edit': (data: any, callback: (response: any) => void) => void;
  'message:delete': (data: any, callback: (response: any) => void) => void;
  'reaction:toggle': (data: any, callback: (response: any) => void) => void;
  'typing:start': (data: { roomId: string }) => void;
  'typing:stop': (data: { roomId: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
  rooms: Set<string>;
}

let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    }
  );

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token and get user (you'll need to adapt getAuthUser)
      const user = await verifySocketToken(token);
      
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.data.userId = user.id;
      socket.data.username = user.username;
      socket.data.rooms = new Set();

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Update user online status
    updateUserOnlineStatus(socket.data.userId, true);

    // Room join handler
    socket.on('room:join', async (data, callback) => {
      try {
        const { roomId } = data;

        // Verify user has access to this room
        const participant = await prisma.chatParticipant.findUnique({
          where: {
            roomId_userId: {
              roomId,
              userId: socket.data.userId
            }
          }
        });

        if (!participant || participant.isBanned) {
          callback({ success: false, error: 'Access denied' });
          return;
        }

        // Join socket room
        await socket.join(roomId);
        socket.data.rooms.add(roomId);

        // Update participant status
        await prisma.chatParticipant.update({
          where: { id: participant.id },
          data: {
            isOnline: true,
            lastSeen: new Date()
          }
        });

        // Notify others in room
        socket.to(roomId).emit('user:online', {
          userId: socket.data.userId,
          username: socket.data.username
        });

        callback({ success: true });
      } catch (error) {
        console.error('Room join error:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // Room leave handler
    socket.on('room:leave', async (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.data.rooms.delete(roomId);

      await updateParticipantStatus(roomId, socket.data.userId, false);

      socket.to(roomId).emit('user:offline', {
        userId: socket.data.userId
      });
    });

    // Send message handler
    socket.on('message:send', async (data, callback) => {
      try {
        const { roomId, content, replyToId, messageType = 'text', mediaUrl } = data;

        // Validate access
        const participant = await validateParticipant(roomId, socket.data.userId);
        if (!participant) {
          callback({ success: false, error: 'Access denied' });
          return;
        }

        // Encrypt message
        const { encryptedContent, contentHash } = encryptMessage(content);

        // Count words and characters
        const wordCount = content.trim().split(/\s+/).length;
        const characterCount = content.length;

        // Create message
        const message = await prisma.chatMessage.create({
          data: {
            roomId,
            userId: socket.data.userId,
            encryptedContent,
            contentHash,
            messageType,
            replyToId,
            mediaUrl,
            wordCount,
            characterCount
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                img: true
              }
            },
            replyTo: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        // Update participant message count
        await prisma.chatParticipant.update({
          where: {
            roomId_userId: {
              roomId,
              userId: socket.data.userId
            }
          },
          data: {
            messagesCount: { increment: 1 }
          }
        });

        // Update analytics
        await updateChatAnalytics(roomId, { messages: 1, words: wordCount });

        // Prepare message for transmission (decrypt for authorized users)
        const messageData = {
          ...message,
          content: decryptMessage(message.encryptedContent),
          encryptedContent: undefined,
          contentHash: undefined
        };

        // Broadcast to room
        io.to(roomId).emit('message:new', messageData);

        callback({ success: true, message: messageData });
      } catch (error) {
        console.error('Send message error:', error);
        callback({ success: false, error: 'Failed to send message' });
      }
    });

    // Edit message handler
    socket.on('message:edit', async (data, callback) => {
      try {
        const { messageId, content } = data;

        // Verify ownership
        const message = await prisma.chatMessage.findUnique({
          where: { id: messageId }
        });

        if (!message || message.userId !== socket.data.userId) {
          callback({ success: false, error: 'Access denied' });
          return;
        }

        // Encrypt new content
        const { encryptedContent, contentHash } = encryptMessage(content);
        const wordCount = content.trim().split(/\s+/).length;
        const characterCount = content.length;

        // Update message
        const updated = await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            encryptedContent,
            contentHash,
            wordCount,
            characterCount,
            isEdited: true,
            editedAt: new Date()
          }
        });

        const messageData = {
          ...updated,
          content: content,
          encryptedContent: undefined,
          contentHash: undefined
        };

        // Broadcast update
        io.to(message.roomId).emit('message:edited', messageData);

        callback({ success: true, message: messageData });
      } catch (error) {
        console.error('Edit message error:', error);
        callback({ success: false, error: 'Failed to edit message' });
      }
    });

    // Delete message handler
    socket.on('message:delete', async (data, callback) => {
      try {
        const { messageId } = data;

        const message = await prisma.chatMessage.findUnique({
          where: { id: messageId }
        });

        if (!message || message.userId !== socket.data.userId) {
          callback({ success: false, error: 'Access denied' });
          return;
        }

        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt: new Date()
          }
        });

        io.to(message.roomId).emit('message:deleted', { messageId });

        callback({ success: true });
      } catch (error) {
        console.error('Delete message error:', error);
        callback({ success: false, error: 'Failed to delete message' });
      }
    });

    // Reaction toggle handler
    socket.on('reaction:toggle', async (data, callback) => {
      try {
        const { messageId, emoji } = data;

        const message = await prisma.chatMessage.findUnique({
          where: { id: messageId }
        });

        if (!message) {
          callback({ success: false, error: 'Message not found' });
          return;
        }

        // Check if reaction exists
        const existing = await prisma.chatReaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId,
              userId: socket.data.userId,
              emoji
            }
          }
        });

        if (existing) {
          // Remove reaction
          await prisma.chatReaction.delete({
            where: { id: existing.id }
          });

          io.to(message.roomId).emit('reaction:removed', {
            messageId,
            userId: socket.data.userId,
            emoji
          });
        } else {
          // Add reaction
          await prisma.chatReaction.create({
            data: {
              messageId,
              userId: socket.data.userId,
              emoji
            }
          });

          // Update analytics
          await prisma.chatParticipant.update({
            where: {
              roomId_userId: {
                roomId: message.roomId,
                userId: socket.data.userId
              }
            },
            data: {
              reactionsGiven: { increment: 1 }
            }
          });

          io.to(message.roomId).emit('reaction:added', {
            messageId,
            userId: socket.data.userId,
            emoji
          });
        }

        callback({ success: true });
      } catch (error) {
        console.error('Toggle reaction error:', error);
        callback({ success: false, error: 'Failed to toggle reaction' });
      }
    });

    // Typing indicators
    socket.on('typing:start', async (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user:typing', {
        userId: socket.data.userId,
        username: socket.data.username,
        isTyping: true
      });

      // Store typing indicator with expiration
      await prisma.chatTypingIndicator.upsert({
        where: {
          roomId_userId: {
            roomId,
            userId: socket.data.userId
          }
        },
        create: {
          roomId,
          userId: socket.data.userId,
          isTyping: true,
          expiresAt: new Date(Date.now() + 5000) // 5 seconds
        },
        update: {
          isTyping: true,
          expiresAt: new Date(Date.now() + 5000)
        }
      });
    });

    socket.on('typing:stop', async (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user:typing', {
        userId: socket.data.userId,
        isTyping: false
      });

      await prisma.chatTypingIndicator.deleteMany({
        where: {
          roomId,
          userId: socket.data.userId
        }
      });
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.data.userId}`);

      // Update all rooms user was in
      for (const roomId of socket.data.rooms) {
        await updateParticipantStatus(roomId, socket.data.userId, false);
        
        socket.to(roomId).emit('user:offline', {
          userId: socket.data.userId
        });
      }

      await updateUserOnlineStatus(socket.data.userId, false);
    });
  });

  // Clean up expired typing indicators periodically
  setInterval(async () => {
    await prisma.chatTypingIndicator.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }, 10000); // Every 10 seconds

  return io;
}

// Helper functions
async function verifySocketToken(token: string) {
  // Implement token verification
  // This should match your auth system
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    const user = await prisma.student.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, name: true, img: true }
    });

    return user;
  } catch (error) {
    return null;
  }
}

async function validateParticipant(roomId: string, userId: string) {
  return await prisma.chatParticipant.findFirst({
    where: {
      roomId,
      userId,
      isBanned: false
    }
  });
}

async function updateParticipantStatus(roomId: string, userId: string, isOnline: boolean) {
  await prisma.chatParticipant.updateMany({
    where: { roomId, userId },
    data: {
      isOnline,
      lastSeen: new Date()
    }
  });
}

async function updateUserOnlineStatus(userId: string, isOnline: boolean) {
  await prisma.student.update({
    where: { id: userId },
    data: {
      isOnline,
      lastActiveAt: new Date()
    }
  });
}

async function updateChatAnalytics(roomId: string, updates: { messages?: number; words?: number; reactions?: number }) {
  await prisma.chatRoomAnalytics.upsert({
    where: { roomId },
    create: {
      roomId,
      totalMessages: updates.messages || 0,
      totalWords: updates.words || 0,
      totalReactions: updates.reactions || 0
    },
    update: {
      totalMessages: updates.messages ? { increment: updates.messages } : undefined,
      totalWords: updates.words ? { increment: updates.words } : undefined,
      totalReactions: updates.reactions ? { increment: updates.reactions } : undefined,
      lastCalculated: new Date()
    }
  });
}

export function getIO() {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
}