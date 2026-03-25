import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = { locale: string };

/**
 * 전자상거래·PG 심사용: 약관·개인정보 링크 + 사업자 고지.
 * `NEXT_PUBLIC_MERCHANT_DISCLOSURE`가 있으면 이를 표시하고, 없으면 ko.json `Legal.businessPlaceholder`를 사용합니다.
 */
export default async function SiteLegalFooter({ locale }: Props) {
  const t = await getTranslations("Legal");
  const disclosure = process.env.NEXT_PUBLIC_MERCHANT_DISCLOSURE?.trim();

  return (
    <footer
      id="site-legal-footer"
      className="flex-shrink-0 border-t border-white/[0.08] bg-[#050505] px-4 py-8 text-[11px] leading-relaxed text-white/45 sm:text-xs"
      style={{ fontFamily: "var(--font-ko), system-ui, sans-serif" }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:gap-5">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={`/${locale}/terms`}
            className="text-[#c9a962]/85 underline-offset-2 hover:text-[#e8d49a] hover:underline"
          >
            {t("termsLink")}
          </Link>
          <Link
            href={`/${locale}/privacy`}
            className="text-[#c9a962]/85 underline-offset-2 hover:text-[#e8d49a] hover:underline"
          >
            {t("privacyLink")}
          </Link>
        </nav>
        {disclosure ? (
          <p className="whitespace-pre-line text-white/55">{disclosure}</p>
        ) : (
          <p className="text-white/50">{t("businessPlaceholder")}</p>
        )}
        <p className="text-[10px] text-white/35 sm:text-[11px]">{t("pgNotice")}</p>
      </div>
    </footer>
  );
}
