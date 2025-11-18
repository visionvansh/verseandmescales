//Volumes/vision/codes/verse/my-app/src/app/api/early-access
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to get IP address
function getIPAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Helper function to get location data from IP
async function getLocationFromIP(ip: string) {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    return {
      country: data.country_name || null,
      city: data.city || null,
      region: data.region || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  
  return { browser, os, device };
}

// GET - Check if device fingerprint exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get('fingerprint');

    if (!fingerprint) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      );
    }

    const subscriber = await prisma.earlyAccessSubscriber.findUnique({
      where: { deviceFingerprint: fingerprint },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (subscriber) {
      // Update last visit
      await prisma.earlyAccessSubscriber.update({
        where: { deviceFingerprint: fingerprint },
        data: {
          lastVisitAt: new Date(),
          visitCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        { 
          exists: true,
          subscriber: {
            id: subscriber.id,
            email: subscriber.email,
            registeredAt: subscriber.createdAt,
          }
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { exists: false },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error checking fingerprint:', error);
    return NextResponse.json(
      { error: 'Internal server error', exists: false },
      { status: 500 }
    );
  }
}

// POST - Register new subscriber
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email,
      deviceFingerprint,
      screenWidth, 
      screenHeight, 
      referrer, 
      landingPage,
      utmSource,
      utmMedium,
      utmCampaign,
      language 
    } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Get IP address
    const ipAddress = getIPAddress(request);
    
    // Get location data
    const locationData = await getLocationFromIP(ipAddress);
    
    // Get user agent info
    const userAgent = request.headers.get('user-agent') || '';
    const { browser, os, device } = parseUserAgent(userAgent);

    // Check if email already exists
    const existingByEmail = await prisma.earlyAccessSubscriber.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Update fingerprint if not set
      if (deviceFingerprint && !existingByEmail.deviceFingerprint) {
        await prisma.earlyAccessSubscriber.update({
          where: { email },
          data: { 
            deviceFingerprint,
            lastVisitAt: new Date(),
            visitCount: {
              increment: 1,
            },
          },
        });
      }

      return NextResponse.json(
        { error: 'Email already registered', alreadyExists: true },
        { status: 409 }
      );
    }

    // Check if device fingerprint already exists
    if (deviceFingerprint) {
      const existingByFingerprint = await prisma.earlyAccessSubscriber.findUnique({
        where: { deviceFingerprint },
      });

      if (existingByFingerprint) {
        return NextResponse.json(
          { 
            error: 'This device is already registered', 
            alreadyExists: true,
            registeredEmail: existingByFingerprint.email 
          },
          { status: 409 }
        );
      }
    }

    // Create new subscriber
    const subscriber = await prisma.earlyAccessSubscriber.create({
      data: {
        email,
        deviceFingerprint,
        ipAddress,
        country: locationData?.country,
        city: locationData?.city,
        region: locationData?.region,
        timezone: locationData?.timezone,
        userAgent,
        browser,
        os,
        device,
        screenWidth,
        screenHeight,
        referrer,
        landingPage,
        utmSource,
        utmMedium,
        utmCampaign,
        language,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully subscribed to early access',
        subscriberId: subscriber.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating subscriber:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}