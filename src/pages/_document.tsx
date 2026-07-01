import Document, {
  Html,
  Head,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from 'next/document';

// <html lang> por idioma — Next NÃO ajusta isto automaticamente com i18n, então
// lemos a locale sendo renderizada (SSG por locale) e emitimos o lang correto.
const LANG: Record<string, string> = { pt: 'pt-BR', en: 'en', es: 'es', it: 'it', fr: 'fr' };

interface Props extends DocumentInitialProps {
  locale: string;
}

export default class MyDocument extends Document<Props> {
  static async getInitialProps(ctx: DocumentContext): Promise<Props> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, locale: ctx.locale ?? ctx.defaultLocale ?? 'pt' };
  }

  render() {
    return (
      <Html lang={LANG[this.props.locale] ?? 'pt-BR'}>
        <Head>
          <link rel="icon" href="/assets/heart-mark.svg" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
