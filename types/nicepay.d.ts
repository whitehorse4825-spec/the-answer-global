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
  fnError?: (result: { errorMsg?: string }) => void;
};
