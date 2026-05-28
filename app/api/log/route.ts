import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, details } = body;
    console.log(`[USER ACTION] ${action} |`, details ? JSON.stringify(details) : '');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LOGGING ERROR] Failed to parse log request');
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}