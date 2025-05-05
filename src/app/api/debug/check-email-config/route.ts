import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET() {
  try {
    // Require admin permission
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the required email configuration exists
    const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
    const configStatus = requiredVars.reduce((acc, varName) => {
      acc[varName] = {
        exists: !!process.env[varName],
        value: varName === 'SMTP_PASS' 
          ? (process.env[varName] ? '********' : undefined)
          : process.env[varName]
      };
      return acc;
    }, {} as Record<string, { exists: boolean, value?: string }>);

    // Check if all required variables exist
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    const allConfigured = missingVars.length === 0;

    const nextEnv = process.env.NODE_ENV || 'unknown';
    const isProduction = nextEnv === 'production';

    return NextResponse.json({
      status: allConfigured ? 'complete' : 'incomplete',
      message: allConfigured 
        ? 'All required email configuration variables are present'
        : `Missing required email configuration: ${missingVars.join(', ')}`,
      configuration: configStatus,
      environment: {
        NODE_ENV: nextEnv,
        isProduction
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking email configuration:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error checking email configuration',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 