import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPolicyPage({ params }: Props) {
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
        <h1 className="mb-3 text-xl font-bold">개인정보처리방침</h1>
        <p className="mb-5 text-[13px] leading-relaxed text-white/60">
          본 방침은 귀하가 본 서비스를 이용할 때 당사가 처리하는
          개인정보에 관한 사항을 설명합니다.
        </p>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">1. 개인정보의 처리 목적</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            서비스 제공, 결제 및 이용 내역 확인, 고객 문의 대응, 부정이용
            방지 등을 위하여 개인정보를 처리합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">2. 처리하는 개인정보 항목</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            결제 관련 정보(주문/결제 식별정보 등), 문의/상담을 위한 연락 정보
            (이메일), 서비스 이용 과정에서 생성되는 정보(접속 로그 등)를
            처리할 수 있습니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">3. 개인정보의 보유 및 이용 기간</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            관계 법령에 따라 보관이 필요한 경우 그 기간까지 보관하며, 목적이
            달성되면 지체 없이 파기합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">4. 개인정보의 제3자 제공</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            결제 수행 및 서비스 운영을 위해 필요한 범위에서 결제대행사/서비스
            제공자에게 개인정보가 제공될 수 있습니다. 이 경우 관련 법령에 따른
            안전조치를 시행합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">5. 개인정보 처리 위탁</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            서비스 운영에 필요한 업무를 위탁하는 경우 법령에 따라 안내하며,
            위탁 계약을 통해 개인정보 보호 책임을 부담하게 합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">6. 개인정보의 파기절차</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            개인정보는 보유 목적이 달성되거나 보유 기간이 종료되면 복구
            불가능한 방법으로 지체 없이 파기합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">7. 이용자 권리</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            이용자는 관련 법령에 따라 개인정보 열람, 정정, 삭제, 처리정지
            등의 권리를 행사할 수 있으며, 요청 시 담당 부서가 신속히 처리합니다.
          </p>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-sm font-semibold">8. 고객 문의</h2>
          <p className="text-[13px] leading-relaxed text-white/70">
            고객센터: whitehorse4825@gmail.com
          </p>
        </section>

        <p className="text-[12px] leading-relaxed text-white/50">
          ※ 본 문서는 서비스 운영에 필요한 일반 형식이며, 실제 사업자 정보/처리 방식에 따라
          세부 조정이 필요할 수 있습니다.
        </p>
      </div>
    </main>
  );
}

