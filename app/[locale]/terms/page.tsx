import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const safeLocale = locale === "ko" ? "ko" : "ko";

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#030306] p-5">
        <div className="mb-4">
          <Link
            href={`/${safeLocale}`}
            className="text-sm text-danchung-gold/80 underline underline-offset-2"
          >
            ← 홈으로
          </Link>
        </div>
        <h1 className="mb-3 text-xl font-bold">이용약관</h1>
        <p className="mb-5 text-[13px] leading-relaxed text-white/60">
          본 약관은 사용자가 본 서비스를 이용함에 있어 당사와 사용자 간의
          권리·의무 및 책임사항을 규정합니다.
        </p>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">1. 서비스 이용</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            사용자는 본 약관 및 관련 안내에 따라 서비스를 이용할 수 있으며,
            서비스 이용을 위해 필요한 정보 제공에 동의합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">2. 계약의 성립</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            결제 완료 시 이용 계약이 성립하며, 결제대행을 통해 주문/결제 정보가
            처리될 수 있습니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">3. 결제 및 환불</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            본 서비스는 디지털 콘텐츠(맞춤 리포트)를 제공하며, 결제 완료 후
            제공이 시작된 이후에는 「전자상거래 등에서의 소비자보호에 관한 법률」에
            따라 청약철회(환불)가 제한되며, 환불이 불가합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">4. 면책 및 책임</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            천재지변 또는 불가항력, 사용자의 귀책사유로 인한 이용 장애 등과
            관련하여 당사는 책임을 지지 않을 수 있습니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">5. 고객센터</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            고객센터: whitehorse4825@gmail.com
          </p>
        </section>

        <p className="text-[12px] leading-relaxed text-white/50">
          ※ 본 문서는 심사 제출을 위한 기본 형식이며, 실제 운영/법무 기준에 따라
          문구를 조정해 주세요.
        </p>
      </div>
    </main>
  );
}

