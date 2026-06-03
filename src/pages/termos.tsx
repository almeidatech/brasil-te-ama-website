import PublicLayout from '@/components/public/PublicLayout';
import pt from '@/content/public/termos';
import tr from '@/content/public/_i18n/termos';
import { localizedStaticProps, type LocalizedPageProps } from '@/lib/i18n-page';

export const getStaticProps = localizedStaticProps(pt, tr);

export default function TermosPage({ title, description, html }: LocalizedPageProps) {
  return <PublicLayout title={title} description={description} html={html} />;
}
