import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Legal");

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-[#e8e4dc]">
      <article className="mx-auto max-w-2xl">
        <h1 className="font-serif text-xl font-bold text-[#F1E5AC] sm:text-2xl">
          {t("privacyTitle")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">{t("privacyLead")}</p>
        <div className="mt-8 whitespace-pre-line text-sm leading-[1.85] text-white/78">
          {t("privacyBody")}
        </div>
        <Link
          href={`/${locale}`}
          className="mt-10 inline-block text-sm text-[#c9a962]/90 hover:underline"
        >
          {t("backHome")}
        </Link>
      </article>
    </main>
  );
}
