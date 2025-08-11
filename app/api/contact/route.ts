import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json()

  // Validación mínima de que hay algo escrito
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  await transporter.sendMail({
    from: `"Web Contact" <${process.env.SMTP_USER}>`,
    to: process.env.MAIL_TO,
    subject: `Nuevo mensaje de ${name}`,
    text: `${message}\n\nResponder a: ${email}`,
    replyTo: email,
  })

  return NextResponse.json({ ok: true })
}
