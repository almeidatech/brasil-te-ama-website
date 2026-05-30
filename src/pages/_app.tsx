import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import '@/styles/main.css';
import { useSiteEnhancements } from '@/components/public/useSiteEnhancements';
import { usePublicForms } from '@/components/public/usePublicForms';

// Toaster only loads (client-side) on /admin — the public site doesn't use it.
const AdminToaster = dynamic(() => import('@/components/admin/AdminToaster'), { ssr: false });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith('/admin');
  // Public scroll-reveal/parallax/slot enhancements never run inside the admin.
  useSiteEnhancements(!isAdmin);
  // Wire the public contact/signup forms to /api/contact (no-op outside /admin).
  usePublicForms(!isAdmin);
  return (
    <>
      <Component {...pageProps} />
      {isAdmin && <AdminToaster />}
    </>
  );
}
