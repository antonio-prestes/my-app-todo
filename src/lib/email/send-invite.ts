import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface InviteEmailProps {
  email: string;
  inviterName: string;
  workspaceName: string;
  inviteToken: string;
}

export async function sendInviteEmail({ email, inviterName, workspaceName, inviteToken }: InviteEmailProps) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?invite_token=${inviteToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #22c55e;">My Todo App</h2>
      <p style="font-size: 16px;">Olá!</p>
      <p style="font-size: 16px;"><strong>${inviterName}</strong> convidou você para colaborar no workspace <strong>${workspaceName}</strong>.</p>
      <div style="margin: 30px 0;">
        <a href="${url}" style="background-color: #22c55e; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Aceitar Convite
        </a>
      </div>
      <p style="font-size: 16px;">Se você não possui uma conta, não se preocupe, ajudaremos você a criar uma para acessar seu novo workspace.</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="font-size: 12px; color: #888;">Se você não esperava por esse convite, pode ignorar este e-mail.</p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: "My Todo App <onboarding@resend.dev>", // Change if verified domain exists
      to: [email],
      subject: `Convite para participar do workspace ${workspaceName}`,
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Resend Error:", error);
    return { error: "Falha ao enviar convite por e-mail." };
  }
}
