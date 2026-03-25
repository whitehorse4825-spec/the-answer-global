import Link from "next/link";

/**
 * PG 심사용 고지(사업자정보/환불/약관/개인정보) — 화면 하단에 반드시 노출되도록 구성.
 * 주의: 법률 자문이 아니며, 실제 심사 기준에 맞춰 문구/형식을 최종 확인해 주세요.
 */
export default function LegalFooter() {
  return (
    <footer
      aria-label="법적 고지"
      className="w-full max-w-[34rem] pb-4 text-[10px] leading-snug text-white/35"
    >
      <div className="flex flex-col gap-2">
        <div>
          <span className="text-white/45">사업자명(상호):</span> 디앤써부업스쿨 &nbsp;|&nbsp;{" "}
          <span className="text-white/45">사업자등록번호:</span> 6931202759
        </div>
        <div>
          <span className="text-white/45">주소:</span> 부산시 사하구 다대1동 조성 3-612 &nbsp;|&nbsp;{" "}
          <span className="text-white/45">대표자:</span> 김유선
        </div>
        <div>
          <span className="text-white/45">고객센터:</span> whitehorse4825@gmail.com &nbsp;|&nbsp;{" "}
          <span className="text-white/45">통신판매업:</span> 2024-부산사하-0926
        </div>
        <div>
          <span className="text-white/45">환불/취소 고지:</span>{" "}
          본 서비스는 디지털 콘텐츠(맞춤 리포트) 제공이며, 결제 완료 후 제공이 시작됩니다.
          「전자상거래 등에서의 소비자보호에 관한 법률」 및 관련 법령에 따라 고객이
          이용(제공) 시작에 동의한 경우 청약철회가 제한될 수 있으며, 결제 완료 후 환불이 불가합니다.
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
          <a
            href="/ko/privacy-policy"
            className="underline underline-offset-2 text-white/55 hover:text-danchung-gold"
            target="_blank"
            rel="noreferrer"
          >
            개인정보처리방침(/ko/privacy-policy)
          </a>
          <a
            href="/ko/terms"
            className="underline underline-offset-2 text-white/55 hover:text-danchung-gold"
            target="_blank"
            rel="noreferrer"
          >
            이용약관(/ko/terms)
          </a>
          <Link
            href="/ko/ritual/menu?stay=1"
            className="underline underline-offset-2 text-white/55 hover:text-danchung-gold"
          >
            서비스 안내(/ko/ritual/menu?stay=1)
          </Link>
        </div>
      </div>
    </footer>
  );
}

