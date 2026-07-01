// Progressive enhancement for the public contact/signup forms.
//
// The page bodies are injected verbatim as HTML (Fase 2/3), and the form controls
// have NO name attributes — they were authored as static UI. Rather than rewrite
// the immutable design, this hook finds each <form>, reads field values keyed by
// their <label> text, derives name/email/phone, and POSTs to /api/contact.
//
// Two form shapes are supported:
//   • Flat forms  — single-page; enhanced with masks + real submit.
//   • Multi-step  — forms marked `data-ms-form` containing `.ms-step` panels.
//     The step engine (nav, progress, per-step validation, masks, char-counter,
//     success screen) is ported from the design handoff `site/forms.js`, but the
//     handoff's FAKE setTimeout submit is replaced with the real POST below.
//
// Form identity: a `data-form-type` attribute on the <form> wins; otherwise it is
// resolved by path + DOM order via FORM_TYPES_BY_PATH. Values MUST match the DB
// CHECK constraint (see lib/forms.ts):
//   /contato     → aderir-selo→parceria, parceria→parceria, ong, imprensa, dúvida→contato
//   /para-ongs   → ong
//   /voluntarios → voluntario
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const FORM_TYPES_BY_PATH: Record<string, string[]> = {
  '/contato': ['parceria', 'parceria', 'ong', 'imprensa', 'contato'],
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
  // Multi-step panels are display:none but never disabled, so querySelectorAll
  // still reads every field across all steps.
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
      const val = clean(el.value) && clean(el.value).toLowerCase() !== 'on' ? clean(el.value) : 'Sim';
      const prev = payload[label];
      if (Array.isArray(prev)) prev.push(val);
      else if (typeof prev === 'string') payload[label] = [prev, val];
      else payload[label] = val;
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
  // Multi-step forms ship a designed `.ms-success` panel — reveal it in place.
  const designed = form.querySelector<HTMLElement>('.ms-success');
  if (designed) {
    form.querySelectorAll<HTMLElement>('.ms-step').forEach((s) => { s.style.display = 'none'; });
    const prog = form.querySelector<HTMLElement>('.ms-progress');
    if (prog) prog.style.display = 'none';
    designed.classList.add('show');
    designed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  const ok = document.createElement('div');
  ok.className = 'form-success';
  ok.setAttribute('role', 'status');
  ok.style.cssText = 'background:#E8F7EE;color:#0B5C2A;padding:24px;border-radius:12px;font-size:16px;line-height:1.5;text-align:center';
  ok.innerHTML = '<strong>Recebido! ✓</strong><br>Obrigado pelo contato. Nossa equipe vai responder em breve.';
  form.replaceWith(ok);
}

/* ── Validators (ported from handoff site/forms.js) ─────────────── */
function validCNPJ(raw: string): boolean {
  const c = raw.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (len: number) => {
    let s = 0, p = len - 7;
    for (let i = len; i >= 1; i--) { s += +c[len - i] * p--; if (p < 2) p = 9; }
    const r = s % 11 < 2 ? 0 : 11 - (s % 11);
    return r === +c[len];
  };
  return calc(12) && calc(13);
}

function validEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function validPhone(v: string): boolean {
  return v.replace(/\D/g, '').length >= 10;
}

/* ── Field state helpers ─────────────────────────────────────────── */
function fieldMsg(el: Element): HTMLElement | null {
  return el.parentElement ? el.parentElement.querySelector<HTMLElement>('.field-msg') : null;
}
function setOk(el: Control, txt?: string) {
  el.classList.remove('is-invalid'); el.classList.add('is-valid');
  const m = fieldMsg(el); if (m) { m.className = 'field-msg ok'; m.textContent = txt || ''; }
}
function setErr(el: Control, txt: string) {
  el.classList.remove('is-valid'); el.classList.add('is-invalid');
  const m = fieldMsg(el); if (m) { m.className = 'field-msg err'; m.textContent = txt; }
}
function clearV(el: Control) {
  el.classList.remove('is-valid', 'is-invalid');
  const m = fieldMsg(el); if (m) { m.className = 'field-msg'; m.textContent = ''; }
}

/* ── Masks & counters ────────────────────────────────────────────── */
type Unwire = () => void;

function maskCNPJ(el: HTMLInputElement): Unwire {
  el.setAttribute('inputmode', 'numeric');
  el.setAttribute('maxlength', '18');
  const onInput = function (this: HTMLInputElement) {
    let v = this.value.replace(/\D/g, '').slice(0, 14);
    v = v.replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
    this.value = v;
    const digits = v.replace(/\D/g, '');
    if (digits.length === 14) {
      validCNPJ(v) ? setOk(this, 'CNPJ válido ✓') : setErr(this, 'CNPJ inválido. Verifique o número.');
    } else if (digits.length > 0) {
      clearV(this);
    }
  };
  el.addEventListener('input', onInput);
  return () => el.removeEventListener('input', onInput);
}

function maskPhone(el: HTMLInputElement): Unwire {
  el.setAttribute('inputmode', 'numeric');
  const onInput = function (this: HTMLInputElement) {
    let v = this.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
    else if (v.length > 6) v = '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
    else if (v.length > 2) v = '(' + v.slice(0, 2) + ') ' + v.slice(2);
    this.value = v;
  };
  const onBlur = function (this: HTMLInputElement) {
    if (!this.value) return clearV(this);
    validPhone(this.value) ? setOk(this, '') : setErr(this, 'Telefone incompleto. Inclua o DDD.');
  };
  el.addEventListener('input', onInput);
  el.addEventListener('blur', onBlur);
  return () => { el.removeEventListener('input', onInput); el.removeEventListener('blur', onBlur); };
}

function wireEmail(el: HTMLInputElement): Unwire {
  const onBlur = function (this: HTMLInputElement) {
    if (!this.value) return clearV(this);
    validEmail(this.value) ? setOk(this, '') : setErr(this, 'E-mail inválido. Verifique o endereço.');
  };
  el.addEventListener('blur', onBlur);
  return () => el.removeEventListener('blur', onBlur);
}

function charCounter(ta: HTMLTextAreaElement, max: number): Unwire {
  const c = document.createElement('div');
  c.className = 'char-count';
  ta.parentElement?.appendChild(c);
  const update = () => {
    const n = ta.value.length;
    c.textContent = n + '/' + max;
    c.className = 'char-count' + (n > max * 0.85 ? ' near' : '') + (n >= max ? ' over' : '');
  };
  ta.addEventListener('input', update);
  update();
  return () => { ta.removeEventListener('input', update); c.remove(); };
}

/* ── Per-field & per-step validation ─────────────────────────────── */
function validateEl(el: Control): boolean {
  const v = el.value.trim();
  if ((el as HTMLInputElement).required && !v && (el as HTMLInputElement).type !== 'checkbox') {
    setErr(el, 'Campo obrigatório.');
    return false;
  }
  if ((el as HTMLInputElement).type === 'email' && v && !validEmail(v)) {
    setErr(el, 'E-mail inválido.');
    return false;
  }
  return true;
}

function validateStep(stepEl: HTMLElement): boolean {
  let ok = true;

  stepEl.querySelectorAll<Control>(
    'input[required]:not([type=radio]):not([type=checkbox]), textarea[required], select[required]'
  ).forEach((el) => { if (!validateEl(el)) ok = false; });

  stepEl.querySelectorAll<HTMLInputElement>('[data-mask=cnpj][required]').forEach((el) => {
    if (el.value && !validCNPJ(el.value)) { setErr(el, 'CNPJ inválido. Verifique o número.'); ok = false; }
  });

  const groups: Record<string, HTMLInputElement[]> = {};
  stepEl.querySelectorAll<HTMLInputElement>('input[type=radio][required]').forEach((r) => {
    (groups[r.name] ??= []).push(r);
  });
  Object.keys(groups).forEach((name) => {
    const radios = groups[name];
    const chosen = radios.some((r) => r.checked);
    if (!chosen) ok = false;
    radios.forEach((r) => {
      const opt = r.closest<HTMLElement>('.lead-opt');
      if (opt) opt.style.outline = chosen ? '' : '2px solid #ef4444';
    });
  });

  stepEl.querySelectorAll<HTMLInputElement>('input[type=checkbox][required]').forEach((cb) => {
    const lbl = cb.closest<HTMLElement>('.form-checkbox-lg, .form-checkbox, label');
    if (!cb.checked) { ok = false; if (lbl) lbl.style.outline = '2px solid #ef4444'; }
    else if (lbl) lbl.style.outline = '';
  });

  return ok;
}

interface Wired {
  cleanup: Unwire;
  /** Steps + current-index accessor, or null for flat forms. */
  steps: HTMLElement[] | null;
  currentStep: () => number;
}

/**
 * Wire masks, validators, counters and (if present) the multi-step navigation.
 * Does NOT bind submit — the caller owns submit so it can do the real POST.
 */
function wireForm(form: HTMLFormElement): Wired {
  const unwires: Unwire[] = [];
  form.querySelectorAll<HTMLInputElement>('[data-mask=cnpj]').forEach((el) => unwires.push(maskCNPJ(el)));
  form.querySelectorAll<HTMLInputElement>('[data-mask=phone]').forEach((el) => unwires.push(maskPhone(el)));
  form.querySelectorAll<HTMLInputElement>('input[type=email]').forEach((el) => unwires.push(wireEmail(el)));
  form.querySelectorAll<HTMLTextAreaElement>('[data-maxlen]').forEach((ta) => {
    const max = +(ta.dataset.maxlen || 0);
    if (max > 0) unwires.push(charCounter(ta, max));
  });

  const steps = Array.from(form.querySelectorAll<HTMLElement>('.ms-step'));
  let cur = 0;

  if (steps.length > 0) {
    const fill = form.querySelector<HTMLElement>('.ms-progress__fill');
    const lbl = form.querySelector<HTMLElement>('.ms-progress__lbl');
    const total = steps.length;

    const setProgress = () => {
      if (fill) fill.style.width = ((cur + 1) / total * 100) + '%';
      if (lbl) lbl.innerHTML = 'Passo <strong>' + (cur + 1) + '</strong> de <strong>' + total + '</strong>';
    };
    const goTo = (n: number, skipVal?: boolean) => {
      if (!skipVal && n > cur && !validateStep(steps[cur])) return;
      steps[cur].classList.remove('active');
      cur = Math.max(0, Math.min(total - 1, n));
      steps[cur].classList.add('active');
      setProgress();
      const card = form.closest<HTMLElement>('.form-card') || form;
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    };

    steps[0].classList.add('active');
    setProgress();

    form.querySelectorAll<HTMLElement>('[data-ms-next]').forEach((btn) => {
      const h = () => goTo(+(btn.dataset.msNext || 0));
      btn.addEventListener('click', h);
      unwires.push(() => btn.removeEventListener('click', h));
    });
    form.querySelectorAll<HTMLElement>('[data-ms-back]').forEach((btn) => {
      const h = () => goTo(+(btn.dataset.msBack || 0), true);
      btn.addEventListener('click', h);
      unwires.push(() => btn.removeEventListener('click', h));
    });
  }

  return {
    cleanup: () => unwires.forEach((u) => u()),
    steps: steps.length > 0 ? steps : null,
    currentStep: () => cur,
  };
}

export function usePublicForms(enabled = true) {
  const { pathname } = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const types = FORM_TYPES_BY_PATH[pathname];
    if (!types) return;

    const forms = Array.from(document.querySelectorAll<HTMLFormElement>('form'));
    const bound: Array<{ form: HTMLFormElement; handler: (e: Event) => void; wired: Wired }> = [];

    forms.forEach((form, i) => {
      if (form.dataset.enhanced === '1') return;
      form.dataset.enhanced = '1';
      const formType = form.dataset.formType || types[i] || types[types.length - 1];
      ensureHoneypot(form);
      const wired = wireForm(form);

      const handler = async (e: Event) => {
        e.preventDefault();

        // Multi-step: the final submit only fires from the last step, but guard anyway.
        if (wired.steps) {
          const idx = wired.currentStep();
          if (!validateStep(wired.steps[idx])) return;
        }

        const submitBtn = form.querySelector<HTMLButtonElement | HTMLInputElement>('button[type="submit"], button:not([type]), input[type="submit"]');
        const original = submitBtn ? (submitBtn instanceof HTMLInputElement ? submitBtn.value : submitBtn.textContent) : null;
        const setBtn = (txt: string, disabled: boolean, spin = false) => {
          if (!submitBtn) return;
          submitBtn.disabled = disabled;
          submitBtn.classList.toggle('btn--spin', spin);
          if (submitBtn instanceof HTMLInputElement) submitBtn.value = txt;
          else submitBtn.textContent = txt;
        };

        const { payload, name, email, phone } = collect(form);
        const hp = form.querySelector<HTMLInputElement>('input[data-hp="1"]')?.value ?? '';

        if (!email) { showError(form, 'Informe um e-mail válido para enviarmos a resposta.'); return; }

        setBtn('Enviando…', true, true);
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
      bound.push({ form, handler, wired });
    });

    return () => {
      bound.forEach(({ form, handler, wired }) => {
        form.removeEventListener('submit', handler);
        wired.cleanup();
        delete form.dataset.enhanced;
      });
    };
  }, [pathname, enabled]);
}
