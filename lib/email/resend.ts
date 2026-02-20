import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || 'Kelo <noreply@kelohq.com>',
      to,
      subject,
      html,
    })
    if (error) {
      console.error('Email error:', error)
      return { success: false, error }
    }
    return { success: true, data }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error }
  }
}
