import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, email, message } = await req.json()
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Nova <info@novvideos.online>',
      to: 'novavideoai@proton.me',
      subject: `Contato de ${name}`,
      html: `<p><b>Nome:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Mensagem:</b> ${message}</p>`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[contact] falha ao enviar e-mail:', error)
    return NextResponse.json({ error: 'Erro ao enviar' }, { status: 500 })
  }
}
