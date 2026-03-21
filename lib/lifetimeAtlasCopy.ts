import type { SajuProfile } from "./saju";
import { koreanEulReul } from "./koreanVocative";
import { buildWolaPrescription } from "./wolaPrescription";
import {
  buildCurrentDaewoonLine,
  buildDynamicLovePeople,
  buildDynamicMatrixNarrativeEn,
  buildDynamicMatrixNarrativeJa,
  buildDynamicMatrixNarrativeKo,
  buildDynamicMoneyCareer,
  buildDynamicOpening,
} from "./dynamicAtlasNarrative";

export type Tone = "ko" | "en" | "ja";

/** lunar-javascript → normalizeFive 결과와 리딩 문구 100% 동기화 */
function assertFiveSynced(saju: SajuProfile) {
  if (saju.earthIsZero !== (saju.five.earth === 0)) {
    throw new Error(
      `Earth sync: earthIsZero=${saju.earthIsZero} but five.earth=${saju.five.earth}`,
    );
  }
}

export type AtlasSectionCopy = {
  s1Title: string;
  s2Title: string;
  s3Title: string;
  s4Title: string;
  s5Title: string;
  premiumPreview: string;
  cta: string;
  s1: string;
  s2: string;
  s3: string;
  s4: string;
  s5: string;
};

/** 대운: 만세력 흐름 (오행 매트릭스와 별개) */
function decadeWhispers(tone: Tone, s: SajuProfile): string {
  const rows = s.daYun
    .filter((r) => r.ganZhi)
    .slice(0, 8)
    .map((r) => {
      const mood =
        r.flowScore >= 58
          ? tone === "ko"
            ? "움직이기 좋은 시기—지원·이직·시도해도 됨"
            : tone === "en"
              ? "good stretch to push—asks, moves, launches"
              : "動きやすい—挑戦・転機に向く"
          : r.flowScore >= 42
            ? tone === "ko"
              ? "겉은 잔잔한데 속은 엉키기 쉬움—말·계약 실수 주의"
              : tone === "en"
                ? "looks calm, tangles easily—watch contracts & tone"
                : "静かに見えて絡みやすい—言葉と約束に注意"
            : tone === "ko"
              ? "무리 말고 체력·돈·관계 방어부터"
              : tone === "en"
                ? "don’t force—protect sleep, money, nerves first"
                : "無理せず体力・お金・人間関係の防衛から";
      if (tone === "ko") {
        return `· ${r.ages}: ${r.ganZhi} — ${mood}`;
      }
      if (tone === "en") {
        return `· ${r.ages}: ${r.ganZhi} — ${mood}`;
      }
      return `· ${r.ages}: ${r.ganZhi} — ${mood}`;
    })
    .join("\n");

  if (tone === "ko") {
    return `아래는 ‘재회 타이밍’을 열 해씩 펼친 거야. 위 오행 매트릭스와 모순되면 매트릭스가 우선이야.\n${rows}\n\n전성기 구간에서는 겸손하게 밀고, 흐릴 때는 마음의 빗장부터 열어.\n`;
  }
  if (tone === "en") {
    return `Your Life Peak Timeline—decade windows. If this ever fights the element matrix, trust the matrix.\n${rows}\n\nWhen it’s hot, move. When it’s foggy, simplify.\n`;
  }
  return `人生の全盛期タイムライン—十年ごとの窓。五行マトリクスと矛盾したらマトリクス優先。\n${rows}\n\n調子が良いときは謙虚に前へ。薄いときは睡眠とお金の穴を先に塞ぐ。\n`;
}

/** 무료 구간: 대운 키워드만 짧게 (전체는 s4 프리미엄) */
export function buildDaewoonFreePreview(tone: Tone, s: SajuProfile): string {
  const slice = s.daYun.filter((r) => r.ganZhi).slice(0, 8).slice(0, 5);
  const rows = slice
    .map((r) => {
      const mood =
        r.flowScore >= 58
          ? tone === "ko"
            ? "움직이기 좋은 시기—지원·이직·시도해도 됨"
            : tone === "en"
              ? "good stretch to push—asks, moves, launches"
              : "動きやすい—挑戦・転機に向く"
          : r.flowScore >= 42
            ? tone === "ko"
              ? "겉은 잔잔한데 속은 엉키기 쉬움—말·계약 실수 주의"
              : tone === "en"
                ? "looks calm, tangles easily—watch contracts & tone"
                : "静かに見えて絡みやすい—言葉と約束に注意"
            : tone === "ko"
              ? "무리 말고 체력·돈·관계 방어부터"
              : tone === "en"
                ? "don’t force—protect sleep, money, nerves first"
                : "無理せず体力・お金・人間関係の防衛から";
      if (tone === "ko" || tone === "en") {
        return `· ${r.ages}: ${r.ganZhi} — ${mood}`;
      }
      return `· ${r.ages}: ${r.ganZhi} — ${mood}`;
    })
    .join("\n");

  if (tone === "ko") {
    return `10년 단위 흐름 (키워드만)\n${rows}\n\n(전체 열 해 해설은 프리미엄)`;
  }
  if (tone === "en") {
    return `Ten-year keywords (preview)\n${rows}\n\n(Full chapters in Premium)`;
  }
  return `十年のキーワード（抜粋）\n${rows}\n\n（全章はプレミアム）`;
}

export function buildLifetimeAtlasCopy(
  tone: Tone,
  ctx: {
    name: string;
    age: number;
    birthDate: string;
    birthTime: string;
    k1: string;
    k2: string;
    k3: string;
    saju: SajuProfile;
    /** destiny:last 저장 시각 — 처방 멘트 변주용 */
    reportTs?: number;
  },
): AtlasSectionCopy {
  const { name, age, birthDate, birthTime, k1, k2, k3, saju, reportTs } = ctx;
  assertFiveSynced(saju);
  const { five, pillarsLine, dayMasterGan } = saju;
  const dy = decadeWhispers(tone, saju);
  const prescriptionSeed =
    name.length +
    five.wood +
    five.fire +
    five.earth +
    five.metal +
    five.water;
  const s5Body = buildWolaPrescription({
    tone,
    five,
    seed: prescriptionSeed,
    userName: name,
    reportTs,
  });

  const opening = buildDynamicOpening(tone, name, five, k1);
  const matrix =
    tone === "ko"
      ? buildDynamicMatrixNarrativeKo(name, five)
      : tone === "en"
        ? buildDynamicMatrixNarrativeEn(name, five)
        : buildDynamicMatrixNarrativeJa(name, five);
  const money = buildDynamicMoneyCareer(tone, five, name);
  const love = buildDynamicLovePeople(tone, five, name);
  const daewoonLine = buildCurrentDaewoonLine(saju, tone);

  if (tone === "ko") {
    return {
      s1Title: `${name} — 인연줄 해독 · 오행 매트릭스`,
      s2Title: `${name} — 상대의 진심 · 리듬과 약속`,
      s3Title: `${name} — 상대의 진심 · 반응과 마음의 빗장`,
      s4Title: `${name} — 재회 타이밍 · 흐름과 D-Day`,
      s5Title: `${name} — 무녀의 비방 · 개운법`,
      premiumPreview:
        "여기부터는 인연줄 본편 — 상대의 진심, 재회 타이밍, 무녀의 비방이 숫자로 열려.",
      cta: "",
      s1:
        `${opening}\n\n` +
        `${matrix}\n\n` +
        (daewoonLine ? `${daewoonLine}\n\n` : "") +
        `네가 태어난 시각은 ${birthDate} ${birthTime} 로 잡혀 있고, 네 기둥 네 줄은 이렇게 짜여 있어: ${pillarsLine}. 가운데 일간은 ${dayMasterGan} — 이건 ‘기준 간문자’일 뿐이고, 성격 한 줄을 찍지 마. 위 오행 %와 싸우면 무조건 오행 매트릭스가 이겨.\n\n` +
        `사람들은 ${k1}, ${k2}, ${k3} 같은 말로 너를 부르겠지만, 그건 꼬리표야. ${age}세 전후는 ‘인연줄을 데이터로 잡을지, 감으로 흘릴지’ 갈리는 문이야.\n`,
      s2:
        `${money}\n\n` +
        `공통: 아침에 오늘 끊어진 인연줄이 새는 틈 한 줄만 적어. 한 달이면 패턴이 보여. 운은 마음의 빗장을 열 때 붙어.\n`,
      s3:
        `${love}\n\n` +
        `썸·연애 체크 세 가지: 약속 지키는지, 네 일정·돈 존중하는지, 문제 생기면 도망 아니고 말로 정리하는지. 두 개가 오래 비면 인연이 아니라 습관이야.\n\n` +
        `너를 작게 만드는 사람 옆에 오래 앉아 있지 마. 위 화·수·금 매트릭스가 그걸 말해 줘.\n`,
      s4: dy,
      s5: s5Body,
    };
  }

  if (tone === "en") {
    return {
      s1Title: `${name} — Element Matrix · Precision Decode`,
      s2Title: `${name} — Wealth Timeline & Top-3 Career Lanes`,
      s3Title: `${name} — Love/People Matrix & Future-Bond Hints`,
      s4Title: `${name} — Life Peak Timeline & Monthly D-Day`,
      s5Title: `${name} — Wol-a’s Prescription & Luck Hacks`,
      premiumPreview:
        "Ahead: Oracle Wol-a’s full chapter—monthly timing, traps, and the hidden window.",
      cta: "Continue decoding with Wol-a",
      s1:
        `${opening}\n\n` +
        `${matrix}\n\n` +
        (daewoonLine ? `${daewoonLine}\n\n` : "") +
        `Birth: ${birthDate} ${birthTime}. Pillars: ${pillarsLine}. Day stem ${dayMasterGan} is your anchor stem—not a personality override. If anything in this paragraph conflicts with the matrix above, the matrix wins.\n\n` +
        `Tags like ${k1}, ${k2}, ${k3} are costumes. Around ${age}, you choose data over drama.\n`,
      s2:
        `${money}\n\n` +
        `Daily: write one money leak each morning for a month. Luck follows plugged holes.\n`,
      s3:
        `${love}\n\n` +
        `Three checks: time kept, your schedule respected, conflict handled without ghosting. Two missing for weeks? That’s a habit, not fate.\n\n` +
        `Don’t finance bonds that shrink you—the Fire/Water/Metal bands above say why.\n`,
      s4: dy,
      s5: s5Body,
    };
  }

  return {
    s1Title: `${name}の五行マトリクス · 精密解読`,
    s2Title: `${name}の財運タイムライン＆天職TOP3`,
    s3Title: `${name}の恋・人マトリクス＆縁のヒント`,
    s4Title: `${name}の人生全盛期タイムライン＆月別D-Day`,
    s5Title: `${name}のためのウォラ処方・開運`,
    premiumPreview:
      "この先は月児ウォラの本編——月ごとのタイミング、関係の落とし穴、隠れた窓。",
    cta: "ウォラの解読を続ける",
    s1:
      `${opening}\n\n` +
      `${matrix}\n\n` +
      (daewoonLine ? `${daewoonLine}\n\n` : "") +
      `出生 ${birthDate} ${birthTime}。四柱 ${pillarsLine}。日干 ${dayMasterGan} は基準の干——性格一語で決めない。上の五行%と矛盾したらマトリクス優先。\n\n` +
      `${k1}・${k2}・${k3} は飾り。${age}歳前後はデータか台詞かの分岐。\n`,
    s2:
      `${money}\n\n` +
      `毎朝、お金の漏れを一つ書く。一週間で癖が見える。\n`,
    s3:
      `${love}\n\n` +
      `三つだけチェック: 時間、境界、衝突の対話。二つが長く欠けるなら習慣。\n\n` +
      `自分を小さくする関係に長く座らない。火・水・金の帯が理由を言う。\n`,
    s4: dy,
    s5: s5Body,
  };
}
