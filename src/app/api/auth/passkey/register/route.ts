//api/auth/passkey/register
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import { generatePasskeyRegistrationOptions, verifyPasskeyRegistration } from'@/utils/passkeys';

// Generate registration options
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const options = await generatePasskeyRegistrationOptions(user.id);
    
    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey registration options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}

// Verify registration
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { response: passkeyResponse, deviceName } = body;
    
    if (!passkeyResponse || !deviceName) {
      return NextResponse.json(
        { error: 'Passkey response and device name are required' },
        { status: 400 }
      );
    }
    
    await verifyPasskeyRegistration(user.id, passkeyResponse, deviceName);
    
    // Log the action
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'passkey_registered',
        description: `Passkey registered for device: ${deviceName}`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || '',
      },
    });
    
    return NextResponse.json({
      message: 'Passkey registered successfully',
      success: true
    });
  } catch (error) {
    console.error('Passkey registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register passkey' },
      { status: 500 }
    );
  }
}