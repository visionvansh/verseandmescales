// app/api/user/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/utils/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const sessionId = params.id;
    
    // Ensure the session belongs to the user
    const session = await prisma.userSession.findUnique({
      where: {
        id: sessionId,
        userId: user.id
      }
    });
    
    if (!session) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }
    
    // Get the token (same logic as getAuthUser)
    let token = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth-token')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ message: 'Token not found' }, { status: 401 });
    }
    
    // Decode the token (since getAuthUser already verified it)
    const decoded = jwt.decode(token) as any;
    const currentSessionId = decoded.sessionId;
    
    // Prevent revoking the current session
    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { message: 'Cannot revoke current session. Use logout instead.' },
        { status: 400 }
      );
    }
    
    // Revoke the session
    await prisma.userSession.update({
      where: { id: sessionId },
      data: { isActive: false }
    });
    
    // Log the event
    await prisma.authLog.create({
      data: {
        userId: user.id,
        action: 'revoke_session',
        success: true,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { revokedSessionId: sessionId }
      }
    });
    
    return NextResponse.json({ message: 'Session revoked successfully' });
    
  } catch (error) {
    console.error('Revoke session error:', error);
    return NextResponse.json({ message: 'Failed to revoke session' }, { status: 500 });
  }
}