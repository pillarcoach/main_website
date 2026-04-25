import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // TODO: wire to Resend when API key is ready
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'Pillar <hello@pillar.ai>',
    //   to: email,
    //   subject: 'You're on the Pillar beta list',
    //   html: `<p>We'll reach out within 24 hours to book your session.</p>`,
    // })

    console.log(`Beta signup: ${email}`)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
