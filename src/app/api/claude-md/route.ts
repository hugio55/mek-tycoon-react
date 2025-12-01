import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
    const content = fs.readFileSync(claudeMdPath, 'utf-8');

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error reading CLAUDE.md:', error);
    return new NextResponse('Failed to read CLAUDE.md', { status: 500 });
  }
}
