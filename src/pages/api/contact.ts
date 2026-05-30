// Public form intake. Persists every submission to `submissions` (status='new')
// and fires a best-effort notification email via ZeptoMail.
//
// Insert uses the service-role client (server-side, bypasses RLS) for reliability;
// the table also has an anon INSERT policy gated to status='new', but centralizing
// here keeps validation + the email token server-side. Forms post here from
// usePublicForms (progressive enhancement over the static form markup).
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { SITE_ID } from '@/lib/site';
import { sendTemplate } from '@/lib/zeptomail';
import { FORM_LABELS, ackTemplateKey, NOTIFY_TEMPLATE_KEY } from '@/lib/forms';

function isEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}
function clip(v: unknown, n: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, n) : null;
}
function firstToken(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.split(/\s+/)[0].slice(0, 60) : null;
}
// pt-BR DD/MM/YYYY HH:mm in UTC — deterministic regardless of container ICU/timezone.
function fmtBR(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} (UTC)`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) ?? {};
  const { form_type, name, email, phone, payload, hp } = body as Record<string, unknown>;

  // Honeypot: a real user never fills this hidden field. Pretend success, save nothing.
  if (typeof hp === 'string' && hp.trim() !== '') return res.status(200).json({ ok: true });

  if (typeof form_type !== 'string' || !(form_type in FORM_LABELS)) {
    return res.status(400).json({ ok: false, error: 'invalid_form_type' });
  }
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });

  const safePayload = payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
  if (JSON.stringify(safePayload).length > 20000) {
    return res.status(400).json({ ok: false, error: 'payload_too_large' });
  }

  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error } = await (admin.from('submissions') as any).insert({
    site_id: SITE_ID,
    form_type,
    name: clip(name, 200),
    email: clip(email, 200),
    phone: clip(phone, 60),
    payload: safePayload,
    status: 'new',
  });
  if (error) {
    console.error('[contact] insert failed:', error.message);
    return res.status(500).json({ ok: false, error: 'save_failed' });
  }

  // Best-effort emails via ZeptoMail hosted templates — never block the ok response.
  const label = FORM_LABELS[form_type];
  const nameStr = clip(name, 200);
  const phoneStr = clip(phone, 60);

  // `name` may be an ORGANIZATION (parceria/ong forms capture the org first).
  // For the greeting we prefer the responsible person's name from the payload.
  const personSource =
    form_type === 'ong'
      ? safePayload['Nome do responsável legal'] ?? safePayload['Nome do responsável']
      : form_type === 'parceria'
        ? safePayload['Nome do responsável'] ?? safePayload['Nome do responsável legal']
        : nameStr;
  const firstName = firstToken(personSource) ?? firstToken(nameStr) ?? 'tudo bem';

  // (a) Acknowledgement to the sender — per-case template.
  const ack = await sendTemplate({
    templateKey: ackTemplateKey(form_type),
    to: email,
    mergeInfo: { first_name: firstName, org_name: nameStr ?? '' },
  });
  if (ack.status === 'error') console.error('[contact] ack email error:', ack.detail);

  // (b) Internal notification — single template; details rendered via white-space:pre-line.
  const details = Object.entries(safePayload)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v ?? '')}`)
    .join('\n');
  const notify = await sendTemplate({
    templateKey: NOTIFY_TEMPLATE_KEY,
    to: process.env.CONTACT_TO_EMAIL ?? '',
    mergeInfo: {
      form_label: label,
      name: nameStr ?? '—',
      email,
      phone: phoneStr ?? '—',
      submitted_at: fmtBR(new Date()),
      details: details || '(sem campos adicionais)',
    },
    replyTo: { address: email, name: nameStr ?? undefined },
  });
  if (notify.status === 'error') console.error('[contact] notify email error:', notify.detail);

  return res.status(200).json({ ok: true, ack: ack.status, notify: notify.status });
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s || '{}'); } catch { return {}; }
}
