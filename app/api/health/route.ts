import { NextRequest, NextResponse } from 'next/server'
import { handleOptions, withCors } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  return withCors(
    NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'FeedbackHub'
    }),
    origin
  )
}
