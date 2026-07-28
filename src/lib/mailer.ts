/**
 * Mailer simulado para o MVP: não há provedor SMTP configurado (não é
 * necessário para o curso). Os "envios" ficam registrados no log do
 * servidor com o mesmo formato que um provedor real receberia, para que a
 * troca por um provedor de verdade (SES, Resend, etc.) seja só implementar
 * `sendMail` de novo.
 */
type MailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: MailInput) {
  console.log("──────── e-mail simulado ────────");
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  console.log("──────────────────────────────────");
  return { ok: true as const };
}

export function confirmationEmailHtml(confirmUrl: string) {
  return `
    <h1>Bem-vindo(a) à Grão Alto</h1>
    <p>Confirme seu cadastro clicando no link abaixo. Ele expira em 24 horas.</p>
    <p><a href="${confirmUrl}">${confirmUrl}</a></p>
  `;
}

export function passwordResetEmailHtml(resetUrl: string) {
  return `
    <h1>Redefinição de senha — Grão Alto</h1>
    <p>Clique no link abaixo para criar uma nova senha. Ele expira em 1 hora e só pode ser usado uma vez.</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
  `;
}

export function orderConfirmationEmailHtml(params: {
  orderNumber: string;
  totalLabel: string;
  deliveryLabel: string;
}) {
  return `
    <h1>Pedido ${params.orderNumber} confirmado!</h1>
    <p>Recebemos seu pagamento. Total: ${params.totalLabel}.</p>
    <p>${params.deliveryLabel}</p>
    <p>Dúvidas? Fale com a gente pelo WhatsApp.</p>
  `;
}
