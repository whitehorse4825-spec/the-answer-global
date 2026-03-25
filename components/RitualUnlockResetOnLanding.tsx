"use client";

import { useEffect } from "react";

import { clearFullPackageSessionUnlock } from "@/lib/ritualStorage";

/** 랜딩(홈) 진입 시 풀패키지 결제 세션 플래그 제거 — 홈 → 비방 재입장 시 다시 결제 흐름이 맞도록 */
export default function RitualUnlockResetOnLanding() {
  useEffect(() => {
    clearFullPackageSessionUnlock();
  }, []);
  return null;
}
