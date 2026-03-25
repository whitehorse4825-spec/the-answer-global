/** 나이스페이 결제창 JS SDK — pay.nicepay.co.kr/v1/js/ */
export {};

declare global {
  interface Window {
    AUTHNICE?: {
      requestPay: (opts: NicePayRequestPayOptions) => void;
    };
  }
}

type NicePayRequestPayOptions = {
  clientId: string;
  method: string;
  orderId: string;
  amount: number;
  goodsName: string;
  returnUrl: string;
  buyerName?: string;
  buyerTel?: string;
  buyerEmail?: string;
  mallName?: string;
  /** 큰따옴표 불가·짧게 유지 (예: locale:ko) */
  mallReserved?: string;
  language?: string;
  /** 인증 응답 인코딩 — utf-8(기본) / euc-kr @see 나이스 매뉴얼 returnCharSet */
  returnCharSet?: string;
  /** @see 나이스 매뉴얼 PC 옵션 — 레이어 z-index 하한 11000 (기본 9999보다 위로) */
  zIdxHigher?: boolean;
  fnError?: (result: { errorMsg?: string }) => void;
};
