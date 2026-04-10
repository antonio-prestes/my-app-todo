import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string) {
  const from = process.env.EMAIL_FROM as string;
  if (!from) {
    throw new Error("EMAIL_FROM is not set");
  }

  await resend.emails.send({
    from,
    to: email,    
    subject: "Seu código de verificação",
    html: `<p>Seu código é: <strong>${code}</strong></p><p>Ele expira em 15 minutos.</p>`,
  });
}