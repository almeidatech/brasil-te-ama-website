// Server-only transactional email via the ZeptoMail HTTP API.
//
// Gracefully NO-OPS when not configured (missing token / from / to) so a form
// submission is never lost just because email isn't wired yet — the submission
// is always persisted; the email is best-effort.
//
// Env:
//   ZEPTO_API_TOKEN   — ZeptoMail "Send Mail" token (with or without the
//                       "Zoho-enczapikey " prefix)
//   CONTACT_FROM_EMAIL — verified sender address in ZeptoMail
//   CONTACT_FROM_NAME  — sender display name (optional)
//   CONTACT_TO_EMAIL   — default inbox that receives form notifications

const ZEPTO_URL = 'https://api.zeptomail.com/v1.1/email';
const ZEPTO_TEMPLATE_URL = 'https://api.zeptomail.com/v1.1/email/template';

export interface SendMailArgs {
  subject: string;
  html: string;
  /** Override the default CONTACT_TO_EMAIL recipient. */
  to?: string;
  /** Set Reply-To so the team can answer the person directly. */
  replyTo?: { address: string; name?: string };
}

export type SendMailResult = { status: 'sent' | 'skipped' | 'error'; detail?: string };

function authHeader(token: string): string {
  const t = token.trim();
  return /^zoho-enczapikey\s/i.test(t) ? t : `Zoho-enczapikey ${t}`;
}

export async function sendMail({ subject, html, to, replyTo }: SendMailArgs): Promise<SendMailResult> {
  const token = process.env.ZEPTO_API_TOKEN;
  const from = process.env.CONTACT_FROM_EMAIL;
  const fromName = process.env.CONTACT_FROM_NAME || 'Instituto Brasil te Ama';
  const toAddr = to || process.env.CONTACT_TO_EMAIL;

  if (!token || !from || !toAddr) {
    return { status: 'skipped', detail: 'email_not_configured' };
  }

  try {
    const res = await fetch(ZEPTO_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader(token),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        from: { address: from, name: fromName },
        to: [{ email_address: { address: toAddr } }],
        subject,
        htmlbody: html,
        ...(replyTo ? { reply_to: [{ address: replyTo.address, name: replyTo.name }] } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { status: 'error', detail: `http_${res.status} ${body.slice(0, 200)}` };
    }
    return { status: 'sent' };
  } catch (e) {
    return { status: 'error', detail: (e as Error).message };
  }
}

export interface SendTemplateArgs {
  /** ZeptoMail hosted template_key (see lib/forms.ts / email-templates/README.md). */
  templateKey: string;
  to: string;
  /** Merge variables consumed by the {{placeholders}} in the hosted template. */
  mergeInfo?: Record<string, unknown>;
  replyTo?: { address: string; name?: string };
}

/**
 * Sends a ZeptoMail HOSTED template (the pet-studio pattern): the HTML/design
 * lives in the ZeptoMail dashboard, we only pass template_key + merge_info.
 * Same graceful no-op as sendMail when unconfigured.
 */
export async function sendTemplate({ templateKey, to, mergeInfo, replyTo }: SendTemplateArgs): Promise<SendMailResult> {
  const token = process.env.ZEPTO_API_TOKEN;
  const from = process.env.CONTACT_FROM_EMAIL;
  const fromName = process.env.CONTACT_FROM_NAME || 'Instituto Brasil te Ama';

  if (!token || !from || !to || !templateKey) {
    return { status: 'skipped', detail: 'email_not_configured' };
  }

  try {
    const res = await fetch(ZEPTO_TEMPLATE_URL, {
      method: 'POST',
      headers: {
        Authorization: authHeader(token),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        template_key: templateKey,
        from: { address: from, name: fromName },
        to: [{ email_address: { address: to } }],
        ...(mergeInfo ? { merge_info: mergeInfo } : {}),
        ...(replyTo ? { reply_to: [{ address: replyTo.address, name: replyTo.name }] } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { status: 'error', detail: `http_${res.status} ${body.slice(0, 200)}` };
    }
    return { status: 'sent' };
  } catch (e) {
    return { status: 'error', detail: (e as Error).message };
  }
}
