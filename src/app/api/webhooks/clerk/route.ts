import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

function welcomeEmailHtml(name: string) {
  return `
  <div style="margin:0;padding:0;background:#050816;font-family:Arial,sans-serif;color:#ffffff;">
    <div style="max-width:640px;margin:0 auto;padding:40px 24px;">
      <div style="margin-bottom:24px;">
        <img src="https://novvideos.online/nova/nova-logo-full.png" alt="NOVA" style="height:40px;width:auto;display:block;" />
      </div>
      <div style="background:linear-gradient(180deg,#0b1020 0%,#121a2b 100%);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
        <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Welcome to NOVA</p>
        <h1 style="margin:0 0 16px;font-size:34px;line-height:1.1;">Hi ${name}, your creative studio is ready.</h1>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.78);">
          Thanks for joining NOVA. You can now explore AI video creation, product ad workflows, creator-style assets, and creative tools built for brands, e-commerce teams and agencies.
        </p>
        <a href="https://novvideos.online/dashboard" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#ffffff;color:#0b1020;text-decoration:none;font-size:14px;font-weight:700;">
          Open NOVA
        </a>
      </div>
    </div>
  </div>
  `
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Missing webhook secret' }, { status: 500 })
  }

  const h = await headers()
  const svix_id = h.get('svix-id')
  const svix_timestamp = h.get('svix-timestamp')
  const svix_signature = h.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.text()
  const wh = new Webhook(secret)

  let evt: any
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (evt.type === 'user.created') {
    const data = evt.data
    const email = data.email_addresses?.[0]?.email_address || ''
    const firstName = data.first_name || ''
    const lastName = data.last_name || ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || 'there'

    if (email) {
      await resend.emails.send({
        from: 'NOVA <info@novvideos.online>',
        to: email,
        subject: 'Welcome to NOVA',
        html: welcomeEmailHtml(name),
      })
    }
  }

  return NextResponse.json({ ok: true })
}
