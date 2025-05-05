import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getEmailConfigStatus, reinitializeEmailTransporter } from '@/lib/email';
import net from 'net';

// Helper function to test SMTP connection
async function testSmtpConnection(host: string, port: number): Promise<{ success: boolean, message: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000; // 5 seconds timeout
    
    // Handle timeout
    const timer = setTimeout(() => {
      socket.destroy();
      resolve({ success: false, message: `Connection timed out after ${timeout}ms` });
    }, timeout);
    
    socket.connect(port, host, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ success: true, message: `Successfully connected to ${host}:${port}` });
    });
    
    socket.on('error', (err) => {
      clearTimeout(timer);
      resolve({ success: false, message: `Connection error: ${err.message}` });
    });
  });
}

export async function GET(req: Request) {
  try {
    // Require admin permission
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get URL parameter to check if we should trigger a reinitialization
    const { searchParams } = new URL(req.url);
    const reinitialize = searchParams.get('reinitialize') === 'true';
    
    // Optional reinitialization
    if (reinitialize) {
      console.log('[DEBUG] Reinitializing email transporter');
      await reinitializeEmailTransporter();
    }

    // Get configuration status
    const configStatus = getEmailConfigStatus();
    
    // Check actual connectivity to the configured SMTP servers
    const connectivityChecks: Record<string, any> = {};
    
    // Check primary SMTP
    if (configStatus.configuration.SMTP_HOST.exists && 
        configStatus.configuration.SMTP_PORT.exists) {
      const host = configStatus.configuration.SMTP_HOST.value as string;
      const port = parseInt(configStatus.configuration.SMTP_PORT.value as string);
      
      if (host && !isNaN(port)) {
        const connectionTest = await testSmtpConnection(host, port);
        connectivityChecks.primary = {
          host,
          port,
          connectionResult: connectionTest
        };
      }
    }
    
    // Check fallback SMTP if configured
    if (configStatus.fallbackConfiguration) {
      if (configStatus.fallbackConfiguration.FALLBACK_SMTP_HOST.exists && 
          configStatus.fallbackConfiguration.FALLBACK_SMTP_PORT.exists) {
        const host = configStatus.fallbackConfiguration.FALLBACK_SMTP_HOST.value as string;
        const port = parseInt(configStatus.fallbackConfiguration.FALLBACK_SMTP_PORT.value as string);
        
        if (host && !isNaN(port)) {
          const connectionTest = await testSmtpConnection(host, port);
          connectivityChecks.fallback = {
            host,
            port,
            connectionResult: connectionTest
          };
        }
      }
    }

    return NextResponse.json({
      ...configStatus,
      connectivityChecks,
      timestamp: new Date().toISOString(),
      message: 'Email configuration status retrieved successfully',
      reinstantiated: reinitialize
    });
  } catch (error) {
    console.error('Error checking email configuration status:', error);
    return NextResponse.json({
      error: 'Failed to retrieve email configuration status',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 