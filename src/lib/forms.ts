// Shared, dependency-free form metadata used by both the public intake API
// (/api/contact) and the admin triage view. Keep this free of server-only
// imports so it's safe to import into client components.
//
// IMPORTANT: the keys MUST match the DB CHECK constraint `submissions_form_type_chk`
// (contato | duvidas | imprensa | ong | parceria | selo | voluntario). The two
// /contato partnership tabs (empresa, organização) both map to `parceria`; the
// payload preserves which one it was via its field labels.
export const FORM_LABELS: Record<string, string> = {
  contato: 'Contato geral',
  duvidas: 'Dúvidas',
  imprensa: 'Imprensa',
  ong: 'Cadastro de ONG',
  parceria: 'Parceria',
  selo: 'Selo',
  voluntario: 'Voluntariado',
};

export const FORM_TYPES = Object.keys(FORM_LABELS);

export function formLabel(type: string): string {
  return FORM_LABELS[type] ?? type;
}

// ZeptoMail HOSTED template keys (NOT secrets — account-scoped identifiers).
// Authored in email-templates/, uploaded to ZeptoMail by the owner.
// ACK = acknowledgement to the sender (per case); NOTIFY = internal alert (single).
export const ACK_TEMPLATE_KEYS: Record<string, string> = {
  contato: '2d6f.752f616040ff647b.k1.c5b864c0-5c49-11f1-b714-fae9afc80e45.19e79d9250c',
  imprensa: '2d6f.752f616040ff647b.k1.2023fa02-5c4a-11f1-b714-fae9afc80e45.19e79db759e',
  ong: '2d6f.752f616040ff647b.k1.79279ad1-5c4a-11f1-b714-fae9afc80e45.19e79ddbcfc',
  parceria: '2d6f.752f616040ff647b.k1.c2342a91-5c4a-11f1-b714-fae9afc80e45.19e79df9bb8',
  voluntario: '2d6f.752f616040ff647b.k1.04be02a0-5c4b-11f1-b714-fae9afc80e45.19e79e14fca',
};

export const NOTIFY_TEMPLATE_KEY =
  '2d6f.752f616040ff647b.k1.5f5fea20-5c4b-11f1-b714-fae9afc80e45.19e79e3a1c2';

/** ACK template for a form_type; `duvidas`/`selo` fall back to the generic `contato`. */
export function ackTemplateKey(formType: string): string {
  return ACK_TEMPLATE_KEYS[formType] ?? ACK_TEMPLATE_KEYS.contato;
}
