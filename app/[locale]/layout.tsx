import type { Metadata, Viewport } from 'next';
import { Archivo_Narrow, Schibsted_Grotesk } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import '../globals.css';

// The one UI face: a neo-grotesk in the Metrô sign tradition, 400–900.
const sans = Schibsted_Grotesk({ variable: '--font-schibsted', subsets: ['latin'] });
// Condensed bold for the gate sign's lettering (drawn on a canvas in the 3D scene).
const sign = Archivo_Narrow({ variable: '--font-sign', subsets: ['latin'], weight: ['700'] });

export const dynamicParams = false;
// viewport-fit=cover: the map runs under the notch / home bar; the UI pads itself with env(safe-area-inset-*).
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#143966' };
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: 'meta' });
  // appleWebApp: from the Home Screen, iOS opens it full screen with the map under a translucent status bar.
  return { title: t('title'), description: t('description'), appleWebApp: { capable: true, title: 'Mapa PUC', statusBarStyle: 'black-translucent' } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale === 'pt' ? 'pt-BR' : 'en'} className={`${sans.variable} ${sign.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
