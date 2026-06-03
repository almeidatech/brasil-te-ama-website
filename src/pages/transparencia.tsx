import PublicLayout from '@/components/public/PublicLayout';
import pt from '@/content/public/transparencia';
import tr from '@/content/public/_i18n/transparencia';
import { localizedStaticProps, type LocalizedPageProps } from '@/lib/i18n-page';

export const getStaticProps = localizedStaticProps(pt, tr);

export default function TransparenciaPage({ title, description, html }: LocalizedPageProps) {
  return <PublicLayout title={title} description={description} html={html} />;
}
