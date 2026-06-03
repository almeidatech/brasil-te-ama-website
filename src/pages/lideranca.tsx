import PublicLayout from '@/components/public/PublicLayout';
import pt from '@/content/public/lideranca';
import tr from '@/content/public/_i18n/lideranca';
import { localizedStaticProps, type LocalizedPageProps } from '@/lib/i18n-page';

export const getStaticProps = localizedStaticProps(pt, tr);

export default function LiderancaPage({ title, description, html }: LocalizedPageProps) {
  return <PublicLayout title={title} description={description} html={html} />;
}
