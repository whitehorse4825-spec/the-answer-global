/** 포트원(구 아임포트) v1 — CDN `iamport.js` 전역 IMP */
export type PortoneV1Response = {
  success: boolean;
  error_code?: string;
  error_msg?: string;
  imp_uid?: string;
  merchant_uid?: string;
  pay_method?: string;
  paid_amount?: number;
  status?: string;
  pg_tid?: string;
};

declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void;
      request_pay: (
        params: Record<string, unknown>,
        callback: (rsp: PortoneV1Response) => void,
      ) => void;
    };
  }
}

export {};
