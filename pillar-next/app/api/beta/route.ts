import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY ?? 'missing')

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
          <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #1A1A1A; margin: 0 0 32px;">Pillar</p>
          <p style="font-size: 15px; line-height: 1.7; color: #1A1A1A; margin: 0 0 16px;">Hi there,</p>
          <p style="font-size: 15px; line-height: 1.7; color: #1A1A1A; margin: 0 0 16px;">Thanks for signing up for the Pillar beta.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #1A1A1A; margin: 0 0 16px;">We're excited to get you started. To make sure your first session goes smoothly, we'd like to be available during the beta in case anything needs troubleshooting or setup support.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #1A1A1A; margin: 0 0 16px;">Please use the calendar link below to book a time that works for you:</p>
          <a href="https://calendly.com/pillar-coach/30min" style="display: inline-block; font-size: 15px; color: #9B2B2B; margin: 0 0 24px;">https://calendly.com/pillar-coach/30min</a>
          <p style="font-size: 15px; line-height: 1.7; color: #1A1A1A; margin: 0 0 32px;">Once you choose a slot, we'll send over everything you need.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #1A1A1A; margin: 0 0 32px;">Looking forward to your first session.</p>
          <p style="font-size: 13px; color: #999; margin: 0;">— Team Pillar</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
