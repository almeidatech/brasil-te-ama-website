import PublicLayout from '@/components/public/PublicLayout';
import pt from '@/content/public/contato';
import tr from '@/content/public/_i18n/contato';
import { localizedStaticProps, type LocalizedPageProps } from '@/lib/i18n-page';

export const getStaticProps = localizedStaticProps(pt, tr);

export default function ContatoPage({ title, description, html }: LocalizedPageProps) {
  return <PublicLayout title={title} description={description} html={html} />;
}
