import PublicLayout from '@/components/public/PublicLayout';
import pt from '@/content/public/consumidor';
import tr from '@/content/public/_i18n/consumidor';
import { localizedStaticProps, type LocalizedPageProps } from '@/lib/i18n-page';

export const getStaticProps = localizedStaticProps(pt, tr);

export default function ConsumidorPage({ title, description, html }: LocalizedPageProps) {
  return <PublicLayout title={title} description={description} html={html} />;
}
