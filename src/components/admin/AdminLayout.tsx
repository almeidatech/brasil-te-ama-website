import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface Props {
  user: { email: string; name: string | null; role: 'admin' | 'editor' | string };
  children: ReactNode;
}

// Admin colors are intentionally orange (cloned from olmeda-pet admin), kept
// distinct from the public Brasil te Ama palette. None of these CSS vars are
// defined in main.css, so the inline fallbacks are what actually render.
const NAV = [
  { href: '/admin', label: 'Painel' },
  { href: '/admin/posts', label: 'Conteúdo' },
  { href: '/admin/categories', label: 'Categorias' },
  { href: '/admin/media', label: 'Mídia' },
];

export default function AdminLayout({ user, children }: Props) {
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', background: 'var(--off-white, #FAF7F2)' }}>
      <aside style={{ background: '#fff', borderRight: '1px solid var(--border-subtle, #EEE)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 32, padding: '0 8px' }}>
          Brasil te Ama <span style={{ color: 'var(--orange, #FF6A1A)' }}>Admin</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map((item) => {
            const active = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '10px 12px', borderRadius: 8,
                  textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 500,
                  color: active ? 'var(--orange, #FF6A1A)' : 'var(--fg-1, #1A1A1A)',
                  background: active ? 'rgba(255,106,26,0.08)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', padding: '12px 8px', borderTop: '1px solid var(--border-subtle, #EEE)', fontSize: 12 }}>
          <div style={{ fontWeight: 600 }}>{user.name || user.email}</div>
          <div style={{ color: 'var(--fg-3, #888)', marginBottom: 8 }}>{user.role}</div>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: '1px solid var(--border-subtle, #DDD)', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', width: '100%' }}
          >
            Sair
          </button>
        </div>
      </aside>
      <main style={{ padding: 32, maxWidth: 1200 }}>{children}</main>
    </div>
  );
}
