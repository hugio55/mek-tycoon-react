import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Get all listening ports with PIDs
    const { stdout } = await execAsync('netstat -ano | findstr LISTENING');

    const lines = stdout.split('\n').filter(line => line.trim());
    const ports: Array<{
      protocol: string;
      localAddress: string;
      port: string;
      state: string;
      pid: string;
    }> = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const localAddress = parts[1];
        const addressParts = localAddress.split(':');
        const port = addressParts[addressParts.length - 1];

        ports.push({
          protocol: parts[0],
          localAddress: addressParts.slice(0, -1).join(':') || '0.0.0.0',
          port: port,
          state: parts[3],
          pid: parts[4]
        });
      }
    }

    // Filter to common dev ports
    const relevantPorts = ports.filter(p => {
      const portNum = parseInt(p.port);
      return portNum >= 3000 && portNum <= 3300; // Dev server range
    });

    return NextResponse.json({
      success: true,
      ports: relevantPorts,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Port Info API] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { pid } = await request.json();

    if (!pid) {
      return NextResponse.json({
        success: false,
        error: 'PID is required'
      }, { status: 400 });
    }

    // Kill the specific PID
    await execAsync(`taskkill /PID ${pid} /F`);

    return NextResponse.json({
      success: true,
      message: `Process ${pid} terminated`
    });
  } catch (error) {
    console.error('[Port Info API] Error killing process:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
