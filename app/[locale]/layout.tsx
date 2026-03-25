import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import SiteLegalFooter from "@/components/SiteLegalFooter";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Makes `next-intl` aware of the locale for Server Components (static-friendly).
  setRequestLocale(locale);

  const messages = await getMessages();
  const fontClass =
    locale === "ko" ? "font-ko" : locale === "ja" ? "font-jp" : "font-eng";

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={`${fontClass} flex min-h-screen flex-col`}>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <SiteLegalFooter locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}

