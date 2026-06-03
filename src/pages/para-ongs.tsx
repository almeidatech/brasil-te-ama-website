import PublicLayout from '@/components/public/PublicLayout';
import pt from '@/content/public/para-ongs';
import tr from '@/content/public/_i18n/para-ongs';
import { localizedStaticProps, type LocalizedPageProps } from '@/lib/i18n-page';

export const getStaticProps = localizedStaticProps(pt, tr);

export default function ParaOngsPage({ title, description, html }: LocalizedPageProps) {
  return <PublicLayout title={title} description={description} html={html} />;
}
