import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'habit-time-insights',
    timestamp: new Date().toISOString(),
  });
}
