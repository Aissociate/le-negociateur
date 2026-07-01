// Envoi d'emails transactionnels via Brevo (API v3).
// Secret requis : BREVO_API_KEY (clé API « xkeysib-… », PAS la clé SMTP « xsmtpsib- »).
// EMAIL_FROM au format « Nom <email@domaine> » — l'expéditeur doit être vérifié dans Brevo.

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = Deno.env.get('EMAIL_FROM') ?? 'Le Négociateur <lenegociateur@aissociate.re>';
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  const sender = m ? { name: m[1] || undefined, email: m[2] } : { email: from.trim() };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': Deno.env.get('BREVO_API_KEY') ?? '',
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
}
