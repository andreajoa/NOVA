import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { createUser } from '@/lib/db'

const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Welcome to NOVA AI Studio</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
  body{margin:0;padding:0;width:100%!important;height:100%!important}
  @media screen and (max-width:600px){
    .container{width:100%!important}
    .px{padding-left:24px!important;padding-right:24px!important}
    .h1{font-size:28px!important}
    .stat-cell{display:block!important;width:100%!important;border-left:none!important;border-top:1px solid #1f2900!important;padding:12px 0!important}
    .stat-cell.first{border-top:none!important}
    .cta-btn{display:block!important;width:100%!important;box-sizing:border-box!important}
    .hide-mobile{display:none!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your NOVA account is ready — unlimited product images, cinematic AI video, and UGC ads start now.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

  <!-- HEADER -->
  <tr><td class="px" style="padding:8px 32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background-color:#c8f135;width:34px;height:34px;border-radius:7px;text-align:center;vertical-align:middle;">
            <span style="font-size:19px;font-weight:900;color:#0a0a0a;line-height:34px;font-family:Helvetica,Arial,sans-serif;">N</span>
          </td>
          <td style="padding-left:11px;">
            <span style="color:#ffffff;font-weight:800;font-size:17px;font-family:Helvetica,Arial,sans-serif;">NOVA <span style="color:#c8f135;">AI STUDIO</span></span>
          </td>
        </tr></table>
      </td>
      <td align="right" valign="middle" class="hide-mobile">
        <span style="color:#666666;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Welcome aboard</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- HERO -->
  <tr><td style="background-color:#0a0a0a;border-top:1px solid #1c1c1c;border-bottom:1px solid #1c1c1c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="px" align="center" style="padding:48px 32px 36px;">
        <div style="display:inline-block;background-color:#c8f135;padding:5px 16px;border-radius:5px;margin-bottom:22px;">
          <span style="font-size:11px;font-weight:800;color:#0a0a0a;letter-spacing:2px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Account created</span>
        </div>
        <h1 class="h1" style="margin:0 0 16px;color:#ffffff;font-size:38px;font-weight:900;line-height:1.15;letter-spacing:-0.5px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
          THE FUTURE OF<br/><span style="color:#c8f135;">VIDEO GENERATION</span><br/>STARTS NOW
        </h1>
        <p style="margin:0;color:#999999;font-size:15px;line-height:1.7;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:460px;">
          You're in. NOVA turns prompts, products, and ideas into scroll-stopping videos for ads, content, and e-commerce &mdash; in minutes, not days.
        </p>
      </td>
    </tr></table>
  </td></tr>

  <!-- STATS -->
  <tr><td style="background-color:#0f1400;border-bottom:1px solid #1c1c1c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="px" style="padding:20px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td class="stat-cell first" align="center" style="padding:0 8px;">
            <div style="color:#c8f135;font-size:22px;font-weight:900;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">&#8734;</div>
            <div style="color:#777777;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;font-family:Helvetica,Arial,sans-serif;">Images/mo</div>
          </td>
          <td class="stat-cell" align="center" style="padding:0 8px;border-left:1px solid #1f2900;">
            <div style="color:#c8f135;font-size:22px;font-weight:900;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">5+</div>
            <div style="color:#777777;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;font-family:Helvetica,Arial,sans-serif;">AI models</div>
          </td>
          <td class="stat-cell" align="center" style="padding:0 8px;border-left:1px solid #1f2900;">
            <div style="color:#c8f135;font-size:22px;font-weight:900;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">2.0</div>
            <div style="color:#777777;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;font-family:Helvetica,Arial,sans-serif;">Seedance</div>
          </td>
          <td class="stat-cell" align="center" style="padding:0 8px;border-left:1px solid #1f2900;">
            <div style="color:#c8f135;font-size:22px;font-weight:900;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">5min</div>
            <div style="color:#777777;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;font-family:Helvetica,Arial,sans-serif;">Long video</div>
          </td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>

  <!-- FEATURES -->
  <tr><td style="background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="px" style="padding:36px 32px 8px;">
        <p style="margin:0 0 6px;color:#555555;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Your toolkit</p>
        <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">EVERYTHING YOU NEED TO CREATE CONTENT THAT SELLS</h2>
      </td></tr>
      <tr><td class="px" style="padding:16px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border:1px solid #1e1e1e;border-radius:12px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 3px;color:#c8f135;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Unlimited on Basic</p>
            <p style="margin:0 0 5px;color:#ffffff;font-size:15px;font-weight:800;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Studio-quality product images</p>
            <p style="margin:0;color:#999999;font-size:13px;line-height:1.6;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Generate unlimited e-commerce images with GPT Image 2 &amp; Banana 2 — new backgrounds, angles, and lighting in seconds.</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td class="px" style="padding:10px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border:1px solid #1e1e1e;border-radius:12px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 3px;color:#c8f135;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Product Videos</p>
            <p style="margin:0 0 5px;color:#ffffff;font-size:15px;font-weight:800;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">UGC ads that convert</p>
            <p style="margin:0;color:#999999;font-size:13px;line-height:1.6;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Upload one product photo, pick a style, and generate high-converting videos for TikTok, Reels, and social ads.</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td class="px" style="padding:10px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border:1px solid #1e1e1e;border-radius:12px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 3px;color:#c8f135;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Talking Avatar</p>
            <p style="margin:0 0 5px;color:#ffffff;font-size:15px;font-weight:800;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Turn a script into a presenter</p>
            <p style="margin:0;color:#999999;font-size:13px;line-height:1.6;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Write your script and NOVA generates a realistic AI presenter with natural voice and lip-sync — perfect for Shorts and Reels.</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td class="px" style="padding:10px 32px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;border:1px solid #1e1e1e;border-radius:12px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 3px;color:#c8f135;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;font-family:Helvetica,Arial,sans-serif;">Up to 5 minutes</p>
            <p style="margin:0 0 5px;color:#ffffff;font-size:15px;font-weight:800;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Full long-form video generator</p>
            <p style="margin:0;color:#999999;font-size:13px;line-height:1.6;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">From a single concept to a finished multi-scene video — fully AI-generated, ready to publish on any channel.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background-color:#0a0a0a;border-top:1px solid #1c1c1c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="px" align="center" style="padding:40px 32px 44px;">
        <h2 style="margin:0 0 10px;color:#ffffff;font-size:22px;font-weight:900;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">GENERATE YOUR FIRST CREATIVE TODAY</h2>
        <p style="margin:0 0 26px;color:#999999;font-size:14px;line-height:1.7;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Upload a product photo or write a prompt — NOVA handles the rest.</p>
        <a href="https://novvideos.online/dashboard?utm_source=email&utm_campaign=welcome&utm_content=cta" class="cta-btn" style="display:inline-block;background-color:#c8f135;color:#0a0a0a;text-decoration:none;font-weight:800;font-size:16px;padding:17px 48px;border-radius:9px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
          Open NOVA Studio &rarr;
        </a>
      </td>
    </tr></table>
  </td></tr>

  <!-- SUPPORT -->
  <tr><td style="background-color:#0f1400;border-top:1px solid #1c1c1c;border-bottom:1px solid #1c1c1c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="px" align="center" style="padding:22px 32px;">
        <p style="margin:0;color:#aaaaaa;font-size:13px;line-height:1.7;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">Questions? Just reply to this email — a real person on the NOVA team will help you out.</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background-color:#070707;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="px" style="padding:24px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background-color:#c8f135;width:22px;height:22px;border-radius:5px;text-align:center;vertical-align:middle;">
            <span style="font-size:12px;font-weight:900;color:#0a0a0a;line-height:22px;">N</span>
          </td>
          <td style="padding-left:8px;">
            <span style="color:#777777;font-weight:800;font-size:12px;font-family:Helvetica,Arial,sans-serif;">NOVA AI STUDIO</span>
          </td>
        </tr></table>
        <p style="margin:14px 0 6px;color:#444444;font-size:11.5px;line-height:1.7;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
          &copy; 2026 NOVA AI Studio &middot; <a href="https://novvideos.online" style="color:#c8f135;text-decoration:none;">novvideos.online</a>
        </p>
        <p style="margin:0;color:#444444;font-size:11.5px;line-height:1.7;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;">
          You're receiving this email because you created a NOVA account. <a href="https://novvideos.online/unsubscribe" style="color:#666666;text-decoration:underline;">Unsubscribe</a>
        </p>
      </td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`

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

  let evt: { type?: string; data?: Record<string, unknown> }
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as { type?: string; data?: Record<string, unknown> }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (evt.type === 'user.created') {
    const data = evt.data ?? {}
    const clerkId = data.id as string
    const emails = data.email_addresses as { email_address: string }[] | undefined
    const email = emails?.[0]?.email_address ?? ''
    const firstName = (data.first_name as string) ?? ''
    const lastName = (data.last_name as string) ?? ''
    const name = [firstName, lastName].filter(Boolean).join(' ') || 'there'

    if (email && clerkId) {
      // 1. Criar usuario no banco
      try {
        await createUser(clerkId, email)
      } catch (error) {
        console.error('Failed to create user in D1:', error)
      }

      const resend = new Resend(process.env.RESEND_API_KEY)

      // 2. Enviar email de welcome imediatamente
      try {
        await resend.emails.send({
          from: 'NOVA AI Studio <noreply@novvideos.online>',
          to: email,
          subject: 'Welcome to NOVA — your creative studio is ready',
          html: WELCOME_HTML,
        })
        console.log(`Welcome email sent to ${email} (${name})`)
      } catch (error) {
        console.error('Failed to send welcome email:', error)
      }

      // 3. Adicionar na audience do Resend — dispara automacao do email de dia 3
      try {
        const audienceId = process.env.RESEND_AUDIENCE_ID ?? ''
        if (audienceId) {
          await resend.contacts.create({
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            audienceId,
          })
          console.log(`Contact added to Resend audience: ${email}`)
        }
      } catch (error) {
        console.error('Failed to add contact to Resend audience:', error)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
