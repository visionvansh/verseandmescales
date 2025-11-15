// src/app/api/cache/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, courseId, data } = body;

    console.log(`📡 [BROADCAST] ${type} for course ${courseId}`);

    // In production, use WebSocket server or Redis pub/sub
    // For now, we'll rely on short TTLs + invalidation
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}