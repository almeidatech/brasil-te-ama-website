import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const queryError = typeof router.query.error === 'string' ? router.query.error : null;
  const initialError =
    queryError === 'not_authorized'
      ? 'Seu e-mail está autenticado mas não tem acesso de admin/editor. Fale com o responsável pelo site.'
      : queryError;
  const [error, setError] = useState<string | null>(initialError);

  useEffect(() => {
    if (initialError) toast.error(initialError);
  }, [initialError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const next = typeof router.query.next === 'string' ? router.query.next : '/admin';
    const redirectTo = `${window.location.origin}/admin/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });

    if (err) {
      setStatus('error');
      setError(err.message);
      toast.error(err.message);
      return;
    }
    setStatus('sent');
    toast.success(`Link de acesso enviado para ${email}`);
  };

  return (
    <>
      <Head>
        <title>Admin · Brasil te Ama</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--off-white, #FAF7F2)', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 8px 24px rgba(0,0,0,.08)' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 8 }}>Brasil te Ama Admin</h1>
          <p style={{ color: 'var(--fg-3, #666)', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
            Informe seu e-mail para receber um link mágico de acesso.
          </p>

          {status === 'sent' ? (
            <div style={{ background: '#E8F7EE', color: '#0B5C2A', padding: 16, borderRadius: 10, fontSize: 14, lineHeight: 1.5 }}>
              ✓ Verifique sua caixa de entrada em <strong>{email}</strong>. Clique no link do e-mail para entrar.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>E-mail</label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-subtle, #E5E5E5)', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              {error && (
                <div style={{ marginTop: 12, color: '#A1240E', background: '#FDECEA', padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  width: '100%', marginTop: 16, padding: '12px 16px',
                  background: 'var(--orange, #FF6A1A)', color: 'white', border: 'none',
                  borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  opacity: status === 'sending' ? 0.6 : 1,
                }}
              >
                {status === 'sending' ? 'Enviando…' : 'Enviar link de acesso'}
              </button>
            </form>
          )}

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--fg-3, #888)' }}>
            Apenas e-mails autorizados podem acessar a área administrativa.
          </p>
        </div>
      </main>
    </>
  );
}
