import type { AppProps } from 'next/app';
import '@/styles/main.css';
import { useSiteEnhancements } from '@/components/public/useSiteEnhancements';

export default function App({ Component, pageProps }: AppProps) {
  useSiteEnhancements();
  return <Component {...pageProps} />;
}
