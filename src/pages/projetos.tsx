import PublicLayout from '@/components/public/PublicLayout';
import pt from '@/content/public/projetos';
import tr from '@/content/public/_i18n/projetos';
import { localizedStaticProps, type LocalizedPageProps } from '@/lib/i18n-page';

export const getStaticProps = localizedStaticProps(pt, tr);

export default function ProjetosPage({ title, description, html }: LocalizedPageProps) {
  return <PublicLayout title={title} description={description} html={html} />;
}
