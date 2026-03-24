"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { computeSajuProfile } from "@/lib/saju";
import { buildLifetimeAtlasCopy } from "@/lib/lifetimeAtlasCopy";
import { translateKeyword, translateKeywords } from "@/lib/keywordI18n";
import { buildWolaPrescription } from "@/lib/wolaPrescription";
import { buildFreeAtlasChapter1Text } from "@/lib/atlasFreeTier";
import { type AtlasNarrativeTone } from "@/lib/dynamicAtlasNarrative";
import {
  chapterIndexToAtlasLockSlot,
  getAtlasLockPaywallLines,
  type AtlasLockSlot,
} from "@/lib/atlasLockPaywallCopy";
import { syncPremiumFromUrl } from "@/lib/premiumClient";
import { koreanVocativeCall } from "@/lib/koreanVocative";

import FiveElementPentagon from "@/components/FiveElementPentagon";
import PremiumLifePeakTimeline from "@/components/PremiumLifePeakTimeline";
import AtlasResultLoading from "@/components/AtlasResultLoading";

const STORAGE_KEY = "destiny:last";

type StoredDestiny = {
  name?: string;
  mode?: string;
  mainCategory?: string;
  subCategory?: string;
  gender?: string;
  birthDate?: string;
  birthTimeUnknown?: boolean;
  birthTime?: string;
  chatFiles?: { count?: number; names?: string[] };
  ts?: number;
};

function clampString(s: unknown, fallback: string) {
  if (typeof s !== "string") return fallback;
  const v = s.trim();
  return v.length ? v : fallback;
}

function parseLocaleTone(locale: string): "ko" | "en" | "ja" {
  if (locale === "en") return "en";
  if (locale === "ja") return "ja";
  return "ko";
}

function TypeReveal({
  text,
  speed = 10,
  wolaMode = false,
}: {
  text: string;
  speed?: number;
  /** 인생 도감: 달빛·금가루·무녀 텍스트 연출 */
  wolaMode?: boolean;
}) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i += 4;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [speed, text]);

  return (
    <div className="relative">
      {wolaMode ? (
        <span
          className="pointer-events-none absolute -inset-1 -z-0 lux-wola-text-aura"
          aria-hidden
        />
      ) : null}
      <p
        className={[
          "lux-section-body whitespace-pre-line relative z-[1]",
          wolaMode ? "lux-wola-text" : "",
        ].join(" ")}
      >
        {shown}
      </p>
    </div>
  );
}

function mysticBreathLabel(
  score: number,
  tone: "ko" | "en" | "ja",
): string {
  if (tone === "ko") {
    if (score >= 62) return "지금 괜찮아요";
    if (score >= 42) return "적당해요";
    return "여기 챙겨요";
  }
  if (tone === "en") {
    if (score >= 62) return "Strong here";
    if (score >= 42) return "Balanced";
    return "Fix this first";
  }
  if (score >= 62) return "今は安定";
  if (score >= 42) return "まあまあ";
  return "要フォロー";
}

function Reveal({
  children,
  delayMs = 0,
}: {
  children: ReactNode;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) setVisible(true);
      },
      { threshold: 0.22, rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={["lux-reveal", visible ? "lux-reveal--visible" : ""].join(
        " ",
      )}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

export default function LuxuryResult({ locale }: { locale: string }) {
  const t = useTranslations("Result");
  const router = useRouter();

  const [stored, setStored] = useState<StoredDestiny | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const tone = parseLocaleTone(locale);
  const [showBaguaLoading, setShowBaguaLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setStored(JSON.parse(raw) as StoredDestiny);
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setIsPremium(syncPremiumFromUrl());
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setIsClient(true);
    });
  }, []);

  const atlasTone = tone as AtlasNarrativeTone;
  const timelineLockLines = useMemo(
    () => getAtlasLockPaywallLines(atlasTone, "timeline"),
    [atlasTone],
  );
  const statMatrixLockLines = useMemo(
    () => getAtlasLockPaywallLines(atlasTone, "statMatrix"),
    [atlasTone],
  );

  const derived = useMemo(() => {
    const name = clampString(stored?.name, "익명의 운명");
    const main = typeof stored?.mainCategory === "string" ? stored.mainCategory : "";
    const sub = typeof stored?.subCategory === "string" ? stored.subCategory : "";

    const keywordMapByMain: Record<string, Record<string, string[]>> = {
      romance: {
        solo: ["솔로", "여유", "리듬"],
        reunion: ["재회", "정렬", "타이밍"],
        crush: ["짝사랑", "심장", "파동"],
        flirt: ["썸", "흔들림", "연결"],
        couple: ["커플", "동행", "성장"],
      },
      career: {
        jobChange: ["이직", "전환", "기술"],
        success: ["합격", "완성", "자격"],
        startup: ["창업", "불꽃", "확장"],
      },
      money: {
        investment: ["투자", "성장", "기회"],
        wealth: ["재물운", "안정", "축적"],
      },
      lifetimeAtlas: {
        _: ["평생", "도감", "패턴"],
      },
      soulBond: {
        dog: ["강아지", "충성", "보호"],
        cat: ["고양이", "독립", "정화"],
        otherFriend: ["기타", "교감", "치유"],
        _: ["소울", "본드", "결속"],
      },
    };

    const keywordsKo =
      (main && sub && keywordMapByMain[main]?.[sub]) ||
      (main && keywordMapByMain[main]?.["_"]) ||
      (() => {
        const mode = typeof stored?.mode === "string" ? stored.mode : "lifetimeAtlas";
        const keywordMapByOldMode: Record<string, string[]> = {
          lifetimeAtlas: ["평생", "도감", "패턴"],
          pastLifeRecord: ["전생", "기억", "흔적"],
          petBond: ["교감", "유대", "보호"],
          loveWealth: ["연애", "재물", "시그널"],
          today: ["오늘", "징조", "리듬"],
        };
        return keywordMapByOldMode[mode] ?? ["운명", "데이터", "빛"];
      })();

    const keywords = translateKeywords(keywordsKo, locale);

    const mode = main || (typeof stored?.mode === "string" ? stored.mode : "lifetimeAtlas");
    const birthDate = clampString(stored?.birthDate, "1995-01-01");
    const birthTime = clampString(stored?.birthTime, "07:30");

    const k1Ko = keywordsKo[0] ?? "운명";
    const k2Ko = keywordsKo[1] ?? "데이터";
    const k3Ko = keywordsKo[2] ?? "빛";

    const k1 = keywords[0] ?? translateKeyword("운명", locale);
    const k2 = keywords[1] ?? translateKeyword("데이터", locale);
    const k3 = keywords[2] ?? translateKeyword("빛", locale);

    const seed = Math.max(1, name.length + k1Ko.length + k2Ko.length + k3Ko.length);
    const birthYear = Number.parseInt(birthDate.slice(0, 4), 10) || 1995;
    const thisYear = new Date().getFullYear();
    const age = Math.max(1, thisYear - birthYear + 1);
    const birthTimeUnknown = !!stored?.birthTimeUnknown;
    const genderRaw = typeof stored?.gender === "string" ? stored.gender : "male";

    const saju = computeSajuProfile({
      birthDate,
      birthTime,
      birthTimeUnknown,
      gender: genderRaw,
    });

    const five = saju.five;
    const radar = {
      wealth: saju.stats.moneyIQ,
      love: saju.stats.socialRadar,
      honor: saju.stats.spark,
      health: saju.stats.endurance,
      relation: saju.stats.chill,
    };
    const timeline = [38, 44, 49, 61, 56, 68, 72, 65, 77, 82, 73, 88].map(
      (v, i) => Math.min(95, Math.max(25, v + ((seed + i * 3) % 7) - 3)),
    );
    const chat = {
      freq: 63 + (seed % 23),
      positivity: 54 + ((seed * 3) % 31),
      response: 58 + ((seed * 5) % 29),
    };
    const daewoon = saju.daYun.map((d) => d.flowScore);
    const sewoon = Array.from({ length: 12 }, (_, i) =>
      Math.min(94, Math.max(28, 52 + ((seed + i * 11) % 20) - 8)),
    );
    return {
      name,
      mode,
      age,
      birthDate,
      birthTime,
      birthTimeUnknown,
      keywordsKo,
      keywords,
      k1,
      k2,
      k3,
      five,
      saju,
      radar,
      timeline,
      daewoon,
      sewoon,
      chat,
    };
  }, [stored, locale]);

  const sectionCopy = useMemo(() => {
    const prescriptionTone =
      tone === "en" ? "en" : tone === "ja" ? "ja" : "ko";
    const prescriptionSeed =
      derived.name.length +
      derived.five.wood +
      derived.five.fire +
      derived.five.earth +
      derived.five.metal +
      derived.five.water;
    const prescriptionS5 = buildWolaPrescription({
      tone: prescriptionTone,
      five: derived.five,
      seed: prescriptionSeed,
      userName: derived.name,
      reportTs: stored?.ts,
    });

    if (derived.mode === "lifetimeAtlas") {
      const atlasTone = tone === "en" ? "en" : tone === "ja" ? "ja" : "ko";
      const timeLabel = derived.birthTimeUnknown
        ? tone === "en"
          ? "(birth time unknown — noon estimate)"
          : tone === "ja"
            ? "(出生時刻不明・正午推定)"
            : "(시간 미입력 · 정오 기준)"
        : derived.birthTime;
      return buildLifetimeAtlasCopy(atlasTone, {
        name: derived.name,
        age: derived.age,
        birthDate: derived.birthDate,
        birthTime: timeLabel,
        k1: derived.k1,
        k2: derived.k2,
        k3: derived.k3,
        saju: derived.saju,
        reportTs: stored?.ts,
      });
    }

    if (tone === "en") {
      return {
        s1Title: "Oracle Wol-a — Frequency Scan",
        s2Title: "Innate Nature vs Present Force",
        s3Title: "Deep Precision Decoding",
        s4Title: "3 / 6 / 12-Month Timeline",
        s5Title: "Wol-a’s Prescription",
        premiumPreview: "Preview — Oracle Wol-a’s full chapter continues beyond this point.",
        cta: "Continue Wol-a’s Data Decoding",
        s1: `${derived.name}'s waveform enters at a refined frequency band where ${derived.k1}, ${derived.k2}, and ${derived.k3} synchronize in sequence. This is not a loud fortune; it is an expensive rhythm that compounds quietly. The scan indicates high potential for directional clarity once one strategic choice is made and protected from noise.`,
        s2: `Your native trait is elegant persistence, yet your current field keeps testing speed over depth. That conflict is the source of your recent fatigue. Hard truth: your standards are high, but your emotional budget has been spent on low-yield cycles. Keep the standards. Cut the cycles. Your luck responds instantly when boundaries become measurable.`,
        s3: `Cross-layer pattern decoding suggests your interactions are rich in latent signal rather than explicit promise. Frequency density is high around evening windows, with response volatility indicating emotional asymmetry in at least one key thread. In practical terms, your strongest outcomes emerge when communication is concise, timed, and anchored to a clear ask. The data also shows that over-explaining weakens your authority curve. In career and money contexts, your probability rises when you narrow focus from five options to two and remove performative urgency. In relationship contexts, your emotional ROI improves once reciprocity is observed in behavior, not language. A premium-grade interpretation: your luck is not missing; it is currently diluted. Once channel architecture is simplified, results accelerate.`,
        s4: `Month 3: Stabilization. Remove one draining commitment and protect sleep quality.\nMonth 6: Leverage point. A new alliance or role becomes available if you show a finished prototype.\nMonth 12: Expansion. Reputation compounds; choose the lane that aligns with your natural cadence, not social pressure.\n\nSignal rule: consistency outruns intensity.`,
        s5: prescriptionS5,
      };
    }
    if (tone === "ja") {
      return {
        s1Title: "月児ウォラ · 周波数スキャン",
        s2Title: "本質と現在気流の衝突",
        s3Title: "精密データ深層解読",
        s4Title: "3 / 6 / 12か月タイムライン",
        s5Title: "ウォラの秘伝処方",
        premiumPreview: "プレビュー — ここから先は月児ウォラの本編が続きます。",
        cta: "ウォラの解読を続ける",
        s1: `${derived.name}様の波形は、${derived.k1}・${derived.k2}・${derived.k3}が順に共鳴する上位帯域に入っています。派手さよりも、静かに積み上がる高級な運の流れです。現在は方向性が定まる直前段階であり、不要な刺激を減らすほど精度が上がります。`,
        s2: `本来の資質は「丁寧な持久力」にありますが、現在の環境は即効性を強く要求しています。このズレが疲労感の主因です。率直に申し上げると、基準は高いのに、投入先の選別が甘い局面があります。基準は下げず、投下先だけを厳選することが最適解です。`,
        s3: `行動データとパターン解析を重ねると、明示的な約束よりも潜在シグナルが優位です。特定時間帯で反応密度が上がる一方、往復の熱量に軽度の非対称が観測されます。したがって、説明量を増やすより、短く・時刻を合わせて・要点を一つに絞る構成が有効です。仕事面では選択肢を絞ったときに成果速度が上がり、金運面では見栄コストの削減が運気を直結で改善します。対人面では言葉より行動の継続性を評価軸に置くほど、誤判定が減少します。結論として、運は不足ではなく拡散状態です。回路を整理すれば、成果は段階的に強まります。`,
        s4: `3か月: 土台安定。消耗案件を1つ手放し、体調管理を最優先に。\n6か月: 変曲点。成果物を明確化すると新規機会が到来。\n12か月: 拡張期。評価が積み上がり、選択権が増えます。\n\n規則: 強度より継続。`,
        s5: prescriptionS5,
      };
    }
    return {
      s1Title: "인연줄 해독 · 지금 네 기운",
      s2Title: "상대의 진심 · 타고난 리듬 vs 지금 환경",
      s3Title: "상대의 진심 · 마음의 빗장 패턴",
      s4Title: "재회 타이밍 · 3/6/12개월",
      s5Title: "무녀의 비방 · 오늘부터",
      premiumPreview: "맛보기 — 여기부터는 무녀의 인연줄 본편이 열려.",
      cta: "",
      s1: `${derived.name}님의 파동을 스캔한 결과, 지금의 운은 “느리지만 크게 수익 나는 파동”으로 들어왔습니다. ${derived.k1}, ${derived.k2}, ${derived.k3} 축이 한 점으로 모이며, 불필요한 관계와 소음만 끊어도 체감이 빠르게 올라옵니다. 말 그대로 운이 없는 게 아니라, 운의 통로가 복잡해서 새고 있던 상태입니다. 좋은 소식은 이 통로가 이미 절반 이상 정리됐다는 점입니다.`,
      s2: `팩폭부터 하겠습니다. 본래 리듬은 단단하고 오래 버티는 타입인데, 최근 선택 구조는 즉시 보상형에 끌려 에너지를 과소비했습니다. 기준은 높은데 투자 대상 선별이 느슨했던 구간이 있었고, 그게 피로와 자존감 저하를 동시에 만들었습니다. 다만 이건 약점이 아니라 방향 오류입니다. 기준을 낮추지 말고, 사람·일·말의 투입 순서만 재설계하면 현재 기운은 오히려 폭발적으로 반등합니다.`,
      s3: `요즘 패턴을 겹쳐보면, 관계에서 말 길이보다 타이밍이랑 결(決)이 성패를 가려. 반응은 잦은데 마음 열림이 한쪽으로 기울었거나, 설명을 늘릴수록 오히려 설득이 약해지는 구간이 있었을 거야. 지금 필요한 건 말 더하기가 아니라 딱 한 줄로 끊는 거야. 직업·돈도 같아. 다섯 갈래를 동시에 잡으려다 보니 집중이 흐트러졌고, 두 가지 핵심만 남기면 성과는 급상승해. 최근 몇 주는 감정 쏟은 만큼 돌아오는 게 적은 루프가 반복됐을 수 있어. 그걸 끊으려면 말이 아니라 행동이 몇 번 반복됐는지 세어봐. 말만 예쁜데 행동이 안 쌓이면 그건 신호가 아니야. 말이 서툴러도 행동이 쌓이면 그게 믿을 구간이야. 운은 없는 게 아니라 지금 필터를 켜야 할 때야.`,
      s4: `3개월: 정리기. 에너지 새는 약속 1개를 끊고, 수면·루틴 고정.\n6개월: 점프기. 완료된 결과물 1개가 새로운 기회로 연결.\n12개월: 확장기. 평판 자산이 누적되어 선택권이 늘어남.\n\n규칙은 단순합니다. 강도보다 지속, 속도보다 방향.`,
      s5: prescriptionS5,
    };
  }, [tone, derived, stored?.ts]);

  const freeAtlasChapter1 = useMemo(() => {
    if (derived.mode !== "lifetimeAtlas") return "";
    const atlasTone = tone === "en" ? "en" : tone === "ja" ? "ja" : "ko";
    const timeLabel = derived.birthTimeUnknown
      ? tone === "en"
        ? "(birth time unknown — noon estimate)"
        : tone === "ja"
          ? "(出生時刻不明・正午推定)"
          : "(시간 미입력 · 정오 기준)"
      : derived.birthTime;
    const seed =
      derived.name.length +
      derived.five.wood +
      derived.five.fire +
      derived.five.earth +
      derived.five.metal +
      derived.five.water +
      (stored?.ts ?? 0);
    return buildFreeAtlasChapter1Text(atlasTone, {
      name: derived.name,
      five: derived.five,
      pillarsLine: derived.saju.pillarsLine,
      dayMasterGan: derived.saju.dayMasterGan,
      birthDate: derived.birthDate,
      birthTime: timeLabel,
      k1: derived.k1,
      k2: derived.k2,
      k3: derived.k3,
      age: derived.age,
      saju: derived.saju,
      seed,
    });
  }, [derived, tone, stored?.ts]);

  type ChapterRow = { title: string; body: string; locked?: boolean };

  const chapters = useMemo((): ChapterRow[] => {
    const s1Title =
      derived.mode === "lifetimeAtlas" && !isPremium
        ? t("freeChapter1Title")
        : sectionCopy.s1Title;
    const full: ChapterRow[] = [
      { title: s1Title, body: sectionCopy.s1 },
      { title: sectionCopy.s2Title, body: sectionCopy.s2 },
      { title: sectionCopy.s3Title, body: sectionCopy.s3 },
      { title: sectionCopy.s4Title, body: sectionCopy.s4 },
      { title: sectionCopy.s5Title, body: sectionCopy.s5 },
    ];
    if (isPremium) return full;
    if (derived.mode === "lifetimeAtlas" && freeAtlasChapter1) {
      return [
        { title: s1Title, body: freeAtlasChapter1 },
        { title: sectionCopy.s2Title, body: sectionCopy.s2, locked: true },
        { title: sectionCopy.s3Title, body: sectionCopy.s3, locked: true },
        { title: sectionCopy.s4Title, body: sectionCopy.s4, locked: true },
        { title: sectionCopy.s5Title, body: sectionCopy.s5, locked: true },
      ];
    }
    return [
      { title: s1Title, body: sectionCopy.s1 },
      { title: sectionCopy.s2Title, body: sectionCopy.s2, locked: true },
      { title: sectionCopy.s3Title, body: sectionCopy.s3, locked: true },
      { title: sectionCopy.s4Title, body: sectionCopy.s4, locked: true },
      { title: sectionCopy.s5Title, body: sectionCopy.s5, locked: true },
    ];
  }, [
    sectionCopy,
    isPremium,
    derived.mode,
    freeAtlasChapter1,
    t,
  ]);

  const radarPolygon = useMemo(() => {
    const vals = [
      derived.radar.wealth,
      derived.radar.love,
      derived.radar.honor,
      derived.radar.health,
      derived.radar.relation,
    ];
    return vals
      .map((v, idx) => {
        const angle = (Math.PI * 2 * idx) / vals.length - Math.PI / 2;
        const r = 90 * (v / 100);
        const x = 110 + Math.cos(angle) * r;
        const y = 110 + Math.sin(angle) * r;
        return `${x},${y}`;
      })
      .join(" ");
  }, [derived.radar]);

  const timelinePath = useMemo(() => {
    const points =
      derived.mode === "lifetimeAtlas" ? derived.daewoon : derived.timeline;
    if (points.length < 2) {
      return "M 20 130 L 540 130";
    }
    const step = 520 / (points.length - 1);
    return points
      .map((v, i) => {
        const x = 20 + i * step;
        const y = 130 - (v / 100) * 110;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [derived.mode, derived.daewoon, derived.timeline]);

  useEffect(() => {
    if (!showBaguaLoading) return;
    const id = window.setTimeout(() => setShowBaguaLoading(false), 1300);
    return () => window.clearTimeout(id);
  }, [showBaguaLoading]);

  const timelinePoints =
    derived.mode === "lifetimeAtlas" ? derived.daewoon : derived.timeline;

  if (!isClient) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#02040b] text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <AtlasResultLoading />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02040b] text-white">
      {showBaguaLoading && derived.mode === "lifetimeAtlas" ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#02040b]/92 backdrop-blur-sm">
          <AtlasResultLoading />
        </div>
      ) : null}

      <div className="lux-oriental-bg absolute inset-0" aria-hidden />
      <div className="lux-moonlight-overlay absolute inset-0" aria-hidden />
      <div className="lux-mist-layer absolute inset-0" aria-hidden />
      <div className="lux-oriental-bagua lux-bagua-glow absolute left-1/2 top-1/2 h-[180vmax] w-[180vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.32]" aria-hidden />
      <div className="lux-oriental-kaleido lux-dancheong-glow absolute left-1/2 top-1/2 h-[170vmax] w-[170vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.26]" aria-hidden />
      <div className="lux-dancheong-kaleido-slow lux-dancheong-glow absolute left-1/2 top-1/2 h-[165vmax] w-[165vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.14]" aria-hidden />
      <div className="lux-gold-dust lux-gold-dust--rich absolute inset-0" aria-hidden />

      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/goddess_the_answer.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center bottom",
          opacity: 0.13,
          filter: "blur(14px) saturate(1.05)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 10%, rgba(212,175,55,0.16), transparent 45%), radial-gradient(circle at 70% 40%, rgba(43,108,176,0.10), transparent 50%), linear-gradient(to bottom, rgba(4,8,21,0.1), rgba(4,8,21,0.95))",
        }}
      />

      <main
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-20 pb-28"
      >
        <section
          className={[
            "lux-destiny-card",
            "relative overflow-hidden rounded-[22px]",
          ].join(" ")}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage: "url('/pattern_danchung.jpg')",
              backgroundSize: "340px auto",
              backgroundRepeat: "repeat",
              mixBlendMode: "overlay",
              filter: "saturate(1.15) contrast(1.05)",
            }}
          />

          <div className="relative border border-white/10 bg-[#070B18]/35 backdrop-blur-xl">
            <div className="p-7 sm:p-10">
              <div className="lux-eyebrow">{t("destinyCardEyebrow")}</div>

              <h1 className="lux-name">{derived.name}</h1>

              {derived.mode === "lifetimeAtlas" ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-danchung-gold/88">
                  {t("dataDecodingTagline")}
                </p>
              ) : null}

              {derived.mode === "lifetimeAtlas" ? (
                <p className="mt-3 font-mono text-sm tracking-wide text-[#FFFDD0]/85">
                  {derived.saju.pillarsLine}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="lux-hash-label">{t("keywordsLabel")}</span>
                {derived.keywords.map((k, i) => (
                  <span
                    key={`${derived.keywordsKo[i] ?? "k"}-${i}`}
                    className="lux-keyword"
                  >
                    #{k}
                  </span>
                ))}
              </div>

              {!isPremium ? (
                <div className="mt-6">
                  <div className="lux-premium-info-static text-left">
                    <span className="relative z-[1] block text-[11px] font-semibold leading-relaxed tracking-wide text-[#FFF8E7]/95">
                      {t("premiumLockBanner")}
                    </span>
                    <span className="relative z-[1] mt-3 block text-lg font-black tracking-wide text-danchung-gold">
                      {t("premium_price")}
                    </span>
                    <span className="relative z-[1] mt-2 block text-[10px] font-medium leading-snug text-white/55">
                      {derived.mode === "lifetimeAtlas"
                        ? t("mudangInfoCardTitle")
                        : t("premiumInfoCardFootnote")}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div aria-hidden="true" className="lux-gold-shimmer" />
        </section>

        {derived.mode === "lifetimeAtlas" ? (
          <section className="mt-8">
            <div className="lux-glass border border-danchung-gold/30 p-5 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
              <div className="lux-section-head">{t("reunionServicesTitle")}</div>
              <ul className="mt-4 space-y-4 text-sm leading-relaxed text-[#FFFDD0]/90">
                <li className="rounded-xl border border-danchung-gold/15 bg-black/20 px-4 py-3">
                  <div className="font-semibold text-danchung-gold/95">
                    {t("reunionStep1Title")}
                  </div>
                  <p className="mt-1.5 text-xs text-white/75">
                    {t("reunionStep1Body")}
                  </p>
                </li>
                <li className="rounded-xl border border-danchung-gold/15 bg-black/20 px-4 py-3">
                  <div className="font-semibold text-danchung-gold/95">
                    {t("reunionStep2Title")}
                  </div>
                  <p className="mt-1.5 text-xs text-white/75">
                    {t("reunionStep2Body")}
                  </p>
                </li>
                <li className="rounded-xl border border-danchung-gold/15 bg-black/20 px-4 py-3">
                  <div className="font-semibold text-danchung-gold/95">
                    {t("reunionStep3Title")}
                  </div>
                  <p className="mt-1.5 text-xs text-white/75">
                    {t("reunionStep3Body")}
                  </p>
                </li>
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-danchung-gold/70">
                {t("atlasTocTitle")} · {sectionCopy.s1Title} · {sectionCopy.s2Title}{" "}
                · {sectionCopy.s3Title} · {sectionCopy.s4Title} · {sectionCopy.s5Title}
              </p>
            </div>
          </section>
        ) : null}

        {derived.mode === "lifetimeAtlas" && isPremium ? (
          <section className="mt-4">
            <div className="lux-glass border border-danchung-gold/35 bg-[#060a14]/40 p-5 sm:p-6">
              <div className="lux-section-head">{t("premiumAtlasTocTitle")}</div>
              <p className="mt-2 text-xs leading-relaxed text-white/55 sm:text-sm">
                {t("premiumValueFootnote")}
              </p>
              <PremiumLifePeakTimeline
                daYun={derived.saju.daYun}
                title={
                  tone === "ko"
                    ? "내 인생 전성기 타임라인"
                    : tone === "ja"
                      ? "人生の全盛期タイムライン"
                      : "Life Peak Timeline"
                }
                subtitle={
                  tone === "ko"
                    ? "대운 흐름 점수 곡선 — 골든 구간·D-Day가 어디서 열리는지 한눈에."
                    : tone === "ja"
                      ? "大運フロー曲線 — ゴールデン帯とD-Dayがどこで開くか一目で。"
                      : "Decade flow curve—see where golden windows & D-Days open at a glance."
                }
              />
              <div className="mt-5 space-y-5">
                {(
                  [
                    ["premiumStage1Title", "premiumStage1Items"],
                    ["premiumStage2Title", "premiumStage2Items"],
                    ["premiumStage3Title", "premiumStage3Items"],
                    ["premiumStage4Title", "premiumStage4Items"],
                    ["premiumStage5Title", "premiumStage5Items"],
                  ] as const
                ).map(([titleKey, itemsKey], idx) => {
                  const title = t(titleKey);
                  const raw = t(itemsKey);
                  const lines = raw
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean);
                  return (
                    <div
                      key={titleKey}
                      className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-danchung-gold/95">
                        {title}
                      </div>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-[#FFFDD0]/88 sm:text-sm">
                        {lines.map((line, li) => (
                          <li key={`${idx}-${li}`}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="lux-glass p-4">
            {derived.mode === "lifetimeAtlas" ? (
              <>
                <div className="lux-section-head">
                  {tone === "ko"
                    ? t("pentagonSectionTitle")
                    : tone === "ja"
                      ? "五行レーダー（ウォラ）"
                      : "Five elements — pentagon radar"}
                </div>
                <FiveElementPentagon five={derived.five} />
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/70">
                  <div>木 {derived.five.wood}%</div>
                  <div>火 {derived.five.fire}%</div>
                  <div>土 {derived.five.earth}%</div>
                  <div>金 {derived.five.metal}%</div>
                  <div>水 {derived.five.water}%</div>
                </div>
                <div className="mt-3 text-[11px] leading-relaxed text-danchung-gold/85">
                  {tone === "ko"
                    ? "비율이지 성적표가 아니야. 어디가 세고 어디가 약한지만 보면 돼."
                    : tone === "ja"
                      ? "割合は成績じゃない。どこが強くてどこが薄いかの目安だよ。"
                      : "Ratios, not grades—just where you’re strong or thin."}
                </div>
                <div
                  className={[
                    "relative mt-4",
                    !isPremium ? "pointer-events-none" : "",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "grid grid-cols-1 gap-2 text-[11px] text-white/80 sm:grid-cols-2",
                      !isPremium ? "blur-[22px] opacity-[0.22]" : "",
                    ].join(" ")}
                  >
                    {(
                      tone === "en"
                        ? [
                            ["Stick-with-it", derived.saju.stats.endurance],
                            ["Presence & pitch", derived.saju.stats.spark],
                            ["Wallet defense", derived.saju.stats.moneyIQ],
                            ["Reading the room", derived.saju.stats.socialRadar],
                            ["Emotional brakes", derived.saju.stats.chill],
                          ]
                        : tone === "ja"
                          ? [
                              ["根気・粘り", derived.saju.stats.endurance],
                              ["勢い・口の武器", derived.saju.stats.spark],
                              ["財布の防衛力", derived.saju.stats.moneyIQ],
                              ["空気を読む力", derived.saju.stats.socialRadar],
                              ["感情のブレーキ", derived.saju.stats.chill],
                            ]
                          : [
                              ["버티는 힘", derived.saju.stats.endurance],
                              ["말빨·존재감", derived.saju.stats.spark],
                              ["지갑 방어력", derived.saju.stats.moneyIQ],
                              ["사람·상황 읽기", derived.saju.stats.socialRadar],
                              ["감정 브레이크", derived.saju.stats.chill],
                            ]
                    ).map(([label, val]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-danchung-gold/20 bg-black/25 px-3 py-2"
                      >
                        <div className="text-[10px] uppercase tracking-[0.2em] text-danchung-gold/90">
                          {label}
                        </div>
                        <div className="mt-1 text-xs text-[#FFFDD0]/90">
                          {mysticBreathLabel(Number(val), tone)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!isPremium ? (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-[#030510]/88 px-2 py-3 text-center backdrop-blur-md ring-1 ring-danchung-gold/25">
                      <span className="text-2xl" aria-hidden>
                        🔒
                      </span>
                      <p className="max-w-[240px] text-[10px] font-semibold leading-snug text-danchung-gold/95">
                        {statMatrixLockLines.tease}
                      </p>
                      <p className="max-w-[260px] text-[9px] leading-relaxed text-white/65">
                        {statMatrixLockLines.mid}
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="lux-section-head">Destiny Radar</div>
                <svg viewBox="0 0 220 220" className="mt-4 w-full">
                  {[30, 55, 80].map((r) => (
                    <polygon
                      key={r}
                      points={Array.from({ length: 5 })
                        .map((_, idx) => {
                          const angle = (Math.PI * 2 * idx) / 5 - Math.PI / 2;
                          const x = 110 + Math.cos(angle) * r;
                          const y = 110 + Math.sin(angle) * r;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1"
                    />
                  ))}
                  <polygon
                    points={radarPolygon}
                    fill="rgba(212,175,55,0.22)"
                    stroke="rgba(212,175,55,0.9)"
                    strokeWidth="2"
                  />
                </svg>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/70">
                  <div>재물 {derived.radar.wealth}</div>
                  <div>애정 {derived.radar.love}</div>
                  <div>명예 {derived.radar.honor}</div>
                  <div>건강 {derived.radar.health}</div>
                  <div>인복 {derived.radar.relation}</div>
                </div>
              </>
            )}
          </div>

          <div className="lux-glass relative p-4">
            <div className="lux-section-head">
              {derived.mode === "lifetimeAtlas"
                ? tone === "ko"
                  ? "내 인생 전성기 타임라인"
                  : tone === "ja"
                    ? "人生の全盛期タイムライン"
                    : "Life Peak Timeline"
                : "Energy Timeline (12M)"}
            </div>
            <div
              className={[
                derived.mode === "lifetimeAtlas" && !isPremium
                  ? "blur-[26px] opacity-[0.28]"
                  : "",
              ].join(" ")}
            >
            <svg viewBox="0 0 560 150" className="mt-4 w-full">
              <defs>
                <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(212,175,55,0.25)" />
                  <stop offset="50%" stopColor="rgba(255,244,180,0.95)" />
                  <stop offset="100%" stopColor="rgba(212,175,55,0.35)" />
                </linearGradient>
              </defs>
              <path
                d={timelinePath}
                fill="none"
                stroke="url(#goldLine)"
                strokeWidth="3"
                className="lux-line-draw"
              />
              {timelinePoints.map((v, i, arr) => {
                const step = 520 / (arr.length - 1 || 1);
                const x = 20 + i * step;
                const y = 130 - (v / 100) * 110;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="2.6"
                    fill="rgba(255,245,200,0.95)"
                  />
                );
              })}
            </svg>
            </div>
            {derived.mode === "lifetimeAtlas" && !isPremium ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-[#050816]/68 px-3 py-4 text-center backdrop-blur-[2px]">
                <span className="text-xl" aria-hidden>
                  🔒
                </span>
                <span className="max-w-[min(100%,280px)] text-[11px] font-semibold leading-snug text-danchung-gold/90">
                  {timelineLockLines.tease}
                </span>
                <span className="max-w-[min(100%,300px)] text-[10px] leading-relaxed text-white/65">
                  {timelineLockLines.mid}
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {derived.mode === "romance" ? (
          <section className="mt-4">
            <div className="lux-glass p-4">
              <div className="lux-section-head">Messenger Data Card</div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="lux-mini-card">
                  <div className="lux-mini-key">대화 빈도</div>
                  <div className="lux-mini-val">{derived.chat.freq}%</div>
                </div>
                <div className="lux-mini-card">
                  <div className="lux-mini-key">긍정어 비율</div>
                  <div className="lux-mini-val">{derived.chat.positivity}%</div>
                </div>
                <div className="lux-mini-card">
                  <div className="lux-mini-key">응답 안정성</div>
                  <div className="lux-mini-val">{derived.chat.response}%</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-12 space-y-5">
          {chapters.map((c, idx) => {
            const lockSlot: AtlasLockSlot =
              derived.mode === "lifetimeAtlas"
                ? chapterIndexToAtlasLockSlot(idx) ?? "generic"
                : "generic";
            const lockLines = getAtlasLockPaywallLines(atlasTone, lockSlot);
            return (
            <Reveal key={`${c.title}-${idx}`} delayMs={idx * 120}>
              <div className="lux-glass relative overflow-hidden">
                {derived.mode === "lifetimeAtlas" ? (
                  <div className="lux-wola-silhouette" aria-hidden />
                ) : null}
                <div className="lux-section-head flex flex-col gap-1">
                  <span>
                    {c.locked ? "🔒 " : ""}
                    {c.title}
                  </span>
                  {derived.mode === "lifetimeAtlas" &&
                  c.title === sectionCopy.s5Title ? (
                    <span className="text-xs font-normal text-danchung-gold/85">
                      {t("s5ActionSubtitle")}
                    </span>
                  ) : null}
                </div>
                {c.locked ? (
                  derived.mode === "lifetimeAtlas" ? (
                    <div className="relative mt-3 min-h-[200px] overflow-hidden rounded-xl border border-white/5">
                      <div
                        aria-hidden
                        className="pointer-events-none max-h-[240px] select-none blur-[64px] opacity-[0.08] sm:blur-[72px] sm:opacity-[0.07]"
                      >
                        <p className="whitespace-pre-line text-sm leading-relaxed text-white/90">
                          {c.body}
                        </p>
                      </div>
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#02040b]/82 via-[#02040b]/96 to-[#02040b]" />
                      <div className="pointer-events-none absolute inset-0 bg-[#02040b]/75 backdrop-blur-md" />
                      <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 px-4 text-center">
                        <span className="text-3xl" aria-hidden>
                          🔒
                        </span>
                        <p className="text-sm font-semibold text-danchung-gold">
                          {lockLines.tease}
                        </p>
                        <p className="max-w-md text-xs leading-relaxed text-white/80">
                          {lockLines.mid}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative min-h-[140px]">
                      <div className="pointer-events-none select-none blur-[16px] opacity-[0.35]">
                        <TypeReveal
                          text={c.body}
                          speed={tone === "ko" ? 9 : 8}
                          wolaMode={derived.mode === "lifetimeAtlas"}
                        />
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-[#050816]/82 px-4 text-center">
                        <span className="text-2xl" aria-hidden>
                          🔒
                        </span>
                        <p className="text-sm font-semibold text-danchung-gold">
                          {lockLines.tease}
                        </p>
                        <p className="max-w-md text-xs leading-relaxed text-white/80">
                          {lockLines.mid}
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    <TypeReveal
                      text={c.body}
                      speed={tone === "ko" ? 9 : 8}
                      wolaMode={derived.mode === "lifetimeAtlas"}
                    />
                    {derived.mode === "lifetimeAtlas" &&
                    !isPremium &&
                    idx === 0 ? (
                      <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-950/30 px-3 py-2.5 text-xs leading-relaxed text-amber-50/95">
                        {t("freeCrisisLine", {
                          name:
                            tone === "ko"
                              ? koreanVocativeCall(derived.name)
                              : derived.name,
                        })}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              {idx < chapters.length - 1 ? (
                <div className="lux-danchung-divider" aria-hidden />
              ) : null}
            </Reveal>
            );
          })}
        </section>

        <div className="mt-12 flex justify-center gap-4 text-sm text-white/60">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/ritual`)}
            className="transition-colors hover:text-danchung-gold/95"
          >
            {t("backArchive")}
          </button>
          <span className="opacity-35">/</span>
          <button
            type="button"
            onClick={() => router.push(`/${locale}`)}
            className="transition-colors hover:text-danchung-gold/95"
          >
            {t("backHome")}
          </button>
        </div>
      </main>

    </div>
  );
}
