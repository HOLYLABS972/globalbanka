import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { credential, code } = await request.json();

    // Handle Google Identity Services (One Tap) credential
    if (credential) {
      try {
        // Validate JWT format
        const parts = credential.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        
        // Decode the JWT token to get user information
        const payload = JSON.parse(atob(parts[1]));
        
        // Import AuthService to handle Google sign-in
        const { default: authService } = await import('../../../../../src/services/authService');
        
        // Create user object for AuthService
        const googleUser = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          provider: 'google',
          emailVerified: payload.email_verified,
        };

        // Use AuthService to handle Google sign-in
        const result = await authService.signInWithGoogle(googleUser);
        
        return NextResponse.json(result);
      } catch (jwtError) {
        console.error('JWT parsing error:', jwtError);
        throw new Error('Invalid Google credential format');
      }
    }

    // Handle traditional OAuth flow (fallback)
    if (code) {
      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/google/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();

      // Get user info from Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();

      // Import AuthService to handle Google sign-in
      const { default: authService } = await import('../../../../../src/services/authService');
      
      // Create user object for AuthService
      const googleUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        provider: 'google',
        emailVerified: userData.verified_email,
      };

      // Use AuthService to handle Google sign-in
      const result = await authService.signInWithGoogle(googleUser);
      
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'No credential or authorization code provided' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
