import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Pillar <hello@pillar.coach>',
      to: email,
      subject: "You're on the list.",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 48px 24px; color: #1A1A1A;">
          <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #9B2B2B; margin: 0 0 32px;">Pillar</p>
          <h1 style="font-size: 28px; font-weight: 700; line-height: 1.1; margin: 0 0 16px;">We have you on our list.</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #555; margin: 0 0 32px;">
            We'll reach out within 24 hours to book your beta session.
          </p>
          <p style="font-size: 13px; color: #999; margin: 0;">— The Pillar team</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
