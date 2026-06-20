import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, details } = body;

    if (action === 'GENERATE_ERROR_TEX_DUMP') {
      console.error(`[TEX_DUMP] Job ${details?.jobId}:\n${details?.tex}`);
    } else {
      console.log('[USER ACTION] %s | %s', action, details ? JSON.stringify(details) : '');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[LOGGING ERROR] Failed to parse log request');
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}