// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('[Logout] POST /api/auth/logout called');
    
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    const deviceFingerprint = cookieStore.get('device-fingerprint')?.value;
    
    console.log('[Logout] Cookies present:', {
      authToken: !!authToken,
      deviceFingerprint: !!deviceFingerprint
    });

    let userId: string | null = null;
    let sessionId: string | null = null;
    let deviceId: string | null = null;

    if (authToken) {
      try {
        // Decode token (don't verify since it might be expired)
        const decoded = jwt.decode(authToken) as {
          userId: string;
          sessionId: string;
          email: string;
        } | null;

        if (decoded) {
          userId = decoded.userId;
          sessionId = decoded.sessionId;

          // Get session info before deactivating
          const session = await prisma.userSession.findUnique({
            where: { id: decoded.sessionId },
            include: { device: true }
          });

          if (session) {
            deviceId = session.deviceId;
            
            // ✅ Mark session as inactive (keep for history)
            await prisma.userSession.update({
              where: { id: decoded.sessionId },
              data: { 
                isActive: false,
                updatedAt: new Date()
              }
            });

            console.log('[Logout] Session deactivated:', decoded.sessionId);
          }

          // ✅ Update user status
          await prisma.student.update({
            where: { id: decoded.userId },
            data: { 
              isOnline: false,
              lastActiveAt: new Date()
            }
          }).catch((err: unknown) => console.error('[Logout] Failed to update user status:', err));

          // ✅ Log the logout
          await prisma.authLog.create({
            data: {
              userId: decoded.userId,
              action: 'logout',
              success: true,
              ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
              userAgent: request.headers.get('user-agent') || 'unknown',
              details: {
                sessionId: decoded.sessionId,
                deviceId: deviceId,
                deviceFingerprint: deviceFingerprint,
                deviceTrusted: session?.device?.trusted || false
              }
            }
          }).catch((err: unknown) => console.error('[Logout] Failed to log:', err));

          console.log('[Logout] ✅ User logged out:', {
            userId: decoded.userId,
            sessionId: decoded.sessionId,
            deviceId: deviceId,
            deviceFingerprint: deviceFingerprint,
            deviceTrusted: session?.device?.trusted
          });
        }
      } catch (error) {
        console.error('[Logout] Token decode error:', error);
      }
    }

    // ✅ Prepare response
    const response = NextResponse.json({ 
      message: 'Logged out successfully',
      devicePreserved: !!deviceFingerprint
    });
    
    // ✅ Clear ONLY auth cookies, PRESERVE device-fingerprint
    response.cookies.delete('auth-token');
    response.cookies.delete('session-id'); // In case it exists
    
    // ✅ CRITICAL: DO NOT delete device-fingerprint
    // This cookie MUST persist to recognize the device on next login
    
    console.log('[Logout] ✅ Cookies cleared (device fingerprint preserved)');
    
    return response;

  } catch (error) {
    console.error('[Logout] ❌ Error:', error);
    
    // Even on error, clear auth cookies
    const response = NextResponse.json(
      { message: 'Logout completed with errors' },
      { status: 500 }
    );
    
    response.cookies.delete('auth-token');
    response.cookies.delete('session-id');
    
    return response;
  }
}