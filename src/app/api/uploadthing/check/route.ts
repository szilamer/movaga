import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for admin or super admin role
    const isAdminUser = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN';
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check if UploadThing environment variables are set
    const hasUploadThingConfig = !!(process.env.UPLOADTHING_SECRET && process.env.UPLOADTHING_APP_ID);
    
    return NextResponse.json({ 
      configured: hasUploadThingConfig,
      message: hasUploadThingConfig 
        ? 'UploadThing is configured' 
        : 'UploadThing is not configured - missing UPLOADTHING_SECRET and/or UPLOADTHING_APP_ID environment variables' 
    });
  } catch (error) {
    console.error('Error checking UploadThing config:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 