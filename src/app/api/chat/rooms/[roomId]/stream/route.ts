// app/api/chat/rooms/[roomId]/stream/route.ts
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma from '@/lib/prisma';
import { decryptMessage } from '@/lib/encryption';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TypingIndicatorWithUser {
  id: string;
  roomId: string;
  userId: string;
  isTyping: boolean;
  expiresAt: Date;
  user: {
    id: string;
    username: string;
    name: string | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  
  try {
    console.log('🔌 SSE: New connection request for room:', roomId);
    
    const user = await getAuthUser(request);
    if (!user) {
      console.log('❌ SSE: Unauthorized');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('✅ SSE: User authenticated:', user.id);

    // Verify access
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: user.id
        }
      }
    });

    if (!participant) {
      console.log('❌ SSE: Access denied - not a participant');
      return new Response('Access denied', { status: 403 });
    }

    console.log('✅ SSE: Participant verified:', participant.id);

    // Update online status
    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { isOnline: true, lastSeen: new Date() }
    });

    // ✅ FIX: Track controller state
    let controllerClosed = false;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let isActive = true;
        
        const send = (event: string, data: any) => {
          if (!isActive || controllerClosed) return; // ✅ Check controllerClosed
          
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}
data: ${JSON.stringify(data)}
`)
            );
          } catch (error) {
            console.error('❌ Failed to send SSE event:', error);
            isActive = false;
          }
        };

        // ✅ Safe close function
        const safeClose = () => {
          if (!controllerClosed) {
            try {
              controllerClosed = true;
              controller.close();
              console.log('✅ SSE: Controller closed safely');
            } catch (error) {
              console.error('❌ Error closing controller:', error);
            }
          }
        };

        // Send initial connection
        send('connected', { 
          userId: user.id, 
          roomId,
          timestamp: new Date().toISOString()
        });
        console.log('✅ SSE: Connection established for user:', user.id);

        // Keep track of sent message IDs
        const sentMessageIds = new Set<string>();
        let lastPollTime = Date.now();

        // Polling interval
        const interval = setInterval(async () => {
          if (!isActive || controllerClosed) { // ✅ Check controllerClosed
            clearInterval(interval);
            return;
          }

          try {
            const now = Date.now();
            
            // Check for new messages (only from last poll time)
            const recentMessages = await prisma.chatMessage.findMany({
              where: {
                roomId,
                isDeleted: false,
                createdAt: {
                  gte: new Date(lastPollTime - 1000) // Add 1s buffer
                }
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
                reactions: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true
                      }
                    }
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
              },
              orderBy: {
                createdAt: 'asc'
              }
            });

            lastPollTime = now;

            // Send only new messages
            recentMessages.forEach(msg => {
              if (!sentMessageIds.has(msg.id)) {
                sentMessageIds.add(msg.id);
                
                try {
                  const decryptedContent = decryptMessage(msg.encryptedContent);
                  
                  send('message:new', {
                    id: msg.id,
                    userId: msg.userId,
                    roomId: msg.roomId,
                    content: decryptedContent,
                    messageType: msg.messageType,
                    createdAt: msg.createdAt.toISOString(), // ✅ Convert to string
                    isEdited: msg.isEdited,
                    editedAt: msg.editedAt?.toISOString(),
                    user: msg.user,
                    reactions: msg.reactions,
                    replyTo: msg.replyTo,
                  });
                } catch (decryptError) {
                  console.error('Failed to decrypt message:', decryptError);
                }
              }
            });

            // Clean up old message IDs
            if (sentMessageIds.size > 100) {
              const idsArray = Array.from(sentMessageIds);
              const toRemove = idsArray.slice(0, idsArray.length - 100);
              toRemove.forEach(id => sentMessageIds.delete(id));
            }

            // Check typing indicators
            const typingUsers = await prisma.chatTypingIndicator.findMany({
              where: {
                roomId,
                isTyping: true,
                userId: { not: user.id },
                expiresAt: {
                  gte: new Date()
                }
              },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true
                  }
                }
              }
            }) as TypingIndicatorWithUser[];

            typingUsers.forEach(tu => {
              send('user:typing', {
                userId: tu.userId,
                username: tu.user.username,
                name: tu.user.name,
                isTyping: true
              });
            });

          } catch (error) {
            console.error('❌ SSE poll error:', error);
            send('error', { 
              message: 'Error fetching updates',
              timestamp: new Date().toISOString()
            });
          }
        }, 2000);

        // Heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          if (isActive && !controllerClosed) { // ✅ Check controllerClosed
            send('heartbeat', { timestamp: new Date().toISOString() });
          } else {
            clearInterval(heartbeat);
          }
        }, 30000);

        // Cleanup on close
        request.signal.addEventListener('abort', async () => {
          console.log('🧹 SSE: Connection closed for user:', user.id);
          isActive = false;
          clearInterval(interval);
          clearInterval(heartbeat);
          
          try {
            await prisma.chatParticipant.update({
              where: { id: participant.id },
              data: { isOnline: false, lastSeen: new Date() }
            });
          } catch (error) {
            console.error('Failed to update offline status:', error);
          }
          
          safeClose(); // ✅ Use safe close
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', 
      },
    });

  } catch (error) {
    console.error('❌ SSE stream error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}