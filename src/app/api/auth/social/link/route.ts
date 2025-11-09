import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromRequest, getUserFromToken } from '@/lib/jwt';
import prisma, { findUserById } from '@/lib/prisma';

// Define type for UserSocial based on Prisma schema
type UserSocial = {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  providerEmail: string | null;
  providerUsername: string | null;
  profileData: any;
};

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const tokenPayload = getUserFromToken(token);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { provider, providerUserId, providerEmail, providerUsername, profileData } = await request.json();

    // Check if this social account is already linked to another user
    const existingSocialAccount = await prisma.userSocial.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId
        }
      }
    });

    if (existingSocialAccount && existingSocialAccount.userId !== tokenPayload.userId) {
      return NextResponse.json(
        { error: 'This social account is already linked to another user' },
        { status: 409 }
      );
    }

    // Check if user already has this provider linked
    const userSocialAccount = await prisma.userSocial.findFirst({
      where: {
        userId: tokenPayload.userId,
        provider
      }
    });

    if (userSocialAccount) {
      // Update existing social account
      const updatedAccount = await prisma.userSocial.update({
        where: { id: userSocialAccount.id },
        data: {
          providerUserId,
          providerEmail,
          providerUsername,
          profileData: profileData ? JSON.parse(JSON.stringify(profileData)) : undefined,
        }
      });

      return NextResponse.json({
        message: 'Social account updated successfully',
        socialAccount: updatedAccount
      });
    } else {
      // Create new social account link
      const newSocialAccount = await prisma.userSocial.create({
        data: {
          userId: tokenPayload.userId,
          provider,
          providerUserId,
          providerEmail,
          providerUsername,
          profileData: profileData ? JSON.parse(JSON.stringify(profileData)) : undefined,
        }
      });

      return NextResponse.json({
        message: 'Social account linked successfully',
        socialAccount: newSocialAccount
      });
    }

  } catch (error) {
    console.error('Link social account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Unlink social account
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const tokenPayload = getUserFromToken(token);
    
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider parameter is required' },
        { status: 400 }
      );
    }

    // Find and delete the social account
    const socialAccount = await prisma.userSocial.findFirst({
      where: {
        userId: tokenPayload.userId,
        provider
      }
    });

    if (!socialAccount) {
      return NextResponse.json(
        { error: 'Social account not found' },
        { status: 404 }
      );
    }

    // Check if user has password or other social accounts (prevent account lockout)
    const user = await findUserById(tokenPayload.userId);
    const otherSocialAccounts = user?.socialAccountsEver?.filter((acc: UserSocial) => acc.provider !== provider) || [];
    
    if (!user?.password && otherSocialAccounts.length === 0) {
      return NextResponse.json(
        { error: 'Cannot unlink the only authentication method. Please set a password first.' },
        { status: 400 }
      );
    }

    await prisma.userSocial.delete({
      where: { id: socialAccount.id }
    });

    return NextResponse.json({
      message: 'Social account unlinked successfully'
    });

  } catch (error) {
    console.error('Unlink social account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}