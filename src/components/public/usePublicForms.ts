// Progressive enhancement for the public contact/signup forms.
//
// The page bodies are injected verbatim as HTML (Fase 2), and the form controls
// have NO name attributes — they were authored as static UI. Rather than rewrite
// the immutable design, this hook finds each <form>, reads field values keyed by
// their <label> text, derives name/email/phone, and POSTs to /api/contact.
//
// Form identity is by path + DOM order (the markup is generated and stable).
// Values MUST match the DB CHECK constraint (see lib/forms.ts):
//   /contato     → 4 forms: empresa→parceria, organização→parceria, imprensa, geral→contato
//   /para-ongs   → 1 form:  ong
//   /voluntarios → 1 form:  voluntario
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const FORM_TYPES_BY_PATH: Record<string, string[]> = {
  '/contato': ['parceria', 'parceria', 'imprensa', 'contato'],
  '/empresas': ['parceria'],
  '/para-ongs': ['ong'],
  '/selo': ['parceria'],
  '/voluntarios': ['voluntario'],
};

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function labelText(el: Element): string {
  const wrap = el.closest('label');
  if (wrap) {
    const c = wrap.cloneNode(true) as HTMLElement;
    c.querySelectorAll('input,select,textarea,button').forEach((n) => n.remove());
    const t = clean(c.textContent);
    if (t) return t;
  }
  const id = (el as HTMLElement).id;
  if (id) {
    const lf = document.querySelector(`label[for="${(window.CSS && CSS.escape) ? CSS.escape(id) : id}"]`);
    const t = clean(lf?.textContent);
    if (t) return t;
  }
  const field = el.closest('.field, .form-group, .form-row, .form-field, div, p');
  const within = field?.querySelector('label');
  if (within && !within.contains(el)) {
    const t = clean(within.textContent);
    if (t) return t;
  }
  for (let p = el.previousElementSibling; p; p = p.previousElementSibling) {
    if (p.tagName === 'LABEL') { const t = clean(p.textContent); if (t) return t; }
  }
  for (let n = el.nextElementSibling; n; n = n.nextElementSibling) {
    if (n.tagName === 'LABEL') { const t = clean(n.textContent); if (t) return t; }
  }
  return clean((el as HTMLInputElement).placeholder) || clean(el.getAttribute('aria-label')) || 'Campo';
}

interface Collected {
  payload: Record<string, string | string[]>;
  name: string | null;
  email: string | null;
  phone: string | null;
}

function collect(form: HTMLFormElement): Collected {
  const controls = Array.from(form.querySelectorAll<Control>('input, select, textarea'));
  const payload: Record<string, string | string[]> = {};
  let name: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;

  for (const el of controls) {
    if (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'button' || el.type === 'hidden')) continue;
    if (el.dataset.hp === '1') continue;
    if (el.disabled) continue;

    const label = labelText(el);

    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      if (!el.checked) continue;
      const prev = payload[label];
      if (Array.isArray(prev)) prev.push('Sim');
      else if (typeof prev === 'string') payload[label] = [prev, 'Sim'];
      else payload[label] = 'Sim';
      continue;
    }

    const value = clean(el.value);
    if (!value) continue;

    // Skip placeholder-only selects (empty value handled above).
    payload[label] = payload[label] ? `${payload[label]}, ${value}` : value;

    const lo = label.toLowerCase();
    const type = (el as HTMLInputElement).type;
    if (!email && (type === 'email' || /e-?mail/.test(lo))) email = value;
    else if (!phone && /(telefone|whatsapp|\bfone\b|celular)/.test(lo)) phone = value;
    else if (!name && /^nome\b/.test(lo)) name = value;
  }

  return { payload, name, email, phone };
}

function ensureHoneypot(form: HTMLFormElement): HTMLInputElement {
  let hp = form.querySelector<HTMLInputElement>('input[data-hp="1"]');
  if (!hp) {
    hp = document.createElement('input');
    hp.type = 'text';
    hp.tabIndex = -1;
    hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    hp.dataset.hp = '1';
    hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
    form.appendChild(hp);
  }
  return hp;
}

function showError(form: HTMLFormElement, msg: string) {
  let box = form.querySelector<HTMLElement>('[data-form-error]');
  if (!box) {
    box = document.createElement('div');
    box.setAttribute('data-form-error', '');
    box.style.cssText = 'margin-top:14px;background:#FDECEA;color:#A1240E;padding:12px 14px;border-radius:10px;font-size:14px';
    form.appendChild(box);
  }
  box.textContent = msg;
}

function showSuccess(form: HTMLFormElement) {
  const ok = document.createElement('div');
  ok.className = 'form-success';
  ok.setAttribute('role', 'status');
  ok.style.cssText = 'background:#E8F7EE;color:#0B5C2A;padding:24px;border-radius:12px;font-size:16px;line-height:1.5;text-align:center';
  ok.innerHTML = '<strong>Recebido! ✓</strong><br>Obrigado pelo contato. Nossa equipe vai responder em breve.';
  form.replaceWith(ok);
}

export function usePublicForms(enabled = true) {
  const { pathname } = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const types = FORM_TYPES_BY_PATH[pathname];
    if (!types) return;

    const forms = Array.from(document.querySelectorAll<HTMLFormElement>('form'));
    const bound: Array<{ form: HTMLFormElement; handler: (e: Event) => void }> = [];

    forms.forEach((form, i) => {
      if (form.dataset.enhanced === '1') return;
      form.dataset.enhanced = '1';
      const formType = types[i] ?? types[types.length - 1];
      ensureHoneypot(form);

      const handler = async (e: Event) => {
        e.preventDefault();
        const submitBtn = form.querySelector<HTMLButtonElement | HTMLInputElement>('button[type="submit"], button:not([type]), input[type="submit"]');
        const original = submitBtn ? (submitBtn instanceof HTMLInputElement ? submitBtn.value : submitBtn.textContent) : null;
        const setBtn = (txt: string, disabled: boolean) => {
          if (!submitBtn) return;
          submitBtn.disabled = disabled;
          if (submitBtn instanceof HTMLInputElement) submitBtn.value = txt;
          else submitBtn.textContent = txt;
        };

        const { payload, name, email, phone } = collect(form);
        const hp = form.querySelector<HTMLInputElement>('input[data-hp="1"]')?.value ?? '';

        if (!email) { showError(form, 'Informe um e-mail válido para enviarmos a resposta.'); return; }

        setBtn('Enviando…', true);
        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ form_type: formType, name, email, phone, payload, hp }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data.ok) {
            showError(form, 'Não foi possível enviar agora. Tente novamente em instantes.');
            setBtn(original ?? 'Enviar', false);
            return;
          }
          showSuccess(form);
        } catch {
          showError(form, 'Falha de conexão. Verifique sua internet e tente de novo.');
          setBtn(original ?? 'Enviar', false);
        }
      };

      form.addEventListener('submit', handler);
      bound.push({ form, handler });
    });

    return () => {
      bound.forEach(({ form, handler }) => {
        form.removeEventListener('submit', handler);
        delete form.dataset.enhanced;
      });
    };
  }, [pathname, enabled]);
}
