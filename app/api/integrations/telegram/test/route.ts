import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/org-context'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const context = await getCurrentOrg(supabase)
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chat_id } = await request.json()
    if (!chat_id) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: 'Telegram bot not configured. Ask your admin to set TELEGRAM_BOT_TOKEN.' }, { status: 500 })
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: `<b>Kelo Test Message</b>\nTelegram integration is working for <b>${context.org.name}</b>! 🎉`,
        parse_mode: 'HTML',
      }),
    })

    const data = await res.json()

    if (!data.ok) {
      if (data.description?.includes('chat not found')) {
        return NextResponse.json({ error: 'Chat not found. Make sure the bot is added to your group and the Chat ID is correct.' }, { status: 400 })
      }
      return NextResponse.json({ error: data.description || 'Failed to send test message' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 })
  }
}
