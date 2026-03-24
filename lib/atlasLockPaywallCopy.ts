/**
 * 인생 도감(종합) 자물쇠 영역 — 섹션별 낚시 멘트 (황금기·D-Day 중심)
 */

import type { AtlasNarrativeTone } from "./dynamicAtlasNarrative";

export type AtlasLockSlot =
  | "statMatrix"
  | "timeline"
  | "s2"
  | "s3"
  | "s4"
  | "s5"
  | "generic";

export type AtlasLockLines = { tease: string; mid: string };

export function chapterIndexToAtlasLockSlot(
  idx: number,
): AtlasLockSlot | null {
  if (idx === 1) return "s2";
  if (idx === 2) return "s3";
  if (idx === 3) return "s4";
  if (idx === 4) return "s5";
  return null;
}

export function getAtlasLockPaywallLines(
  tone: AtlasNarrativeTone,
  slot: AtlasLockSlot,
): AtlasLockLines {
  if (tone === "ko") return linesKo();
  if (tone === "en") return linesEn(slot);
  return linesJa(slot);
}

const KO_LOCK_UNIFIED: AtlasLockLines = {
  tease: "이대로 두면 끊어질 인연입니다. 무녀의 비방으로 인연줄을 다시 이으세요.",
  mid: "₩19,900",
};

/** 재회 컨셉: 모든 자물쇠 멘트·가격 단일화 */
function linesKo(): AtlasLockLines {
  return KO_LOCK_UNIFIED;
}

function linesEn(slot: AtlasLockSlot): AtlasLockLines {
  switch (slot) {
    case "statMatrix":
      return {
        tease: "Your golden-era ingredients live in this matrix",
        mid: "Stamina, wallet, presence—decode it now with data. Premium breaks it down axis by axis.",
      };
    case "timeline":
      return {
        tease: "Life-peak D-Day—the curve tells you",
        mid: "When to push, when to pause, which months spike—see your golden windows on one graph. Check it now.",
      };
    case "s2":
      return {
        tease: "Money & work golden lane",
        mid: "Cashflow timing, career fit, spend leaks—open the band with numbers and stop looping the same money hole.",
      };
    case "s3":
      return {
        tease: "Bonds & boundaries—who fits your chart",
        mid: "Fit patterns, talk vs. action gaps, repeat loops—numbers show who belongs in your peak seasons.",
      };
    case "s4":
      return {
        tease: "Life Peak Timeline & monthly D-Day",
        mid: "Where peaks rise and where they bend—decade + month windows packed tight. Your golden-era map, on data, right now.",
      };
    case "s5":
      return {
        tease: "Prescription & luck hacks—executable",
        mid: "Colors, habits, micro-rituals matched to your chart—a checklist you can run today.",
      };
    default:
      return {
        tease: "Your golden-era D-Day—see it in the data",
        mid: "Premium strings peak seasons, monthly windows, and fixes to numbers—not vibes, not drama.",
      };
  }
}

function linesJa(slot: AtlasLockSlot): AtlasLockLines {
  switch (slot) {
    case "statMatrix":
      return {
        tease: "黄金期の“材料”はこの表に乗ってる",
        mid: "持久・財布・存在感をデータで今すぐ確認。プレミアムで軸ごとに抜く。",
      };
    case "timeline":
      return {
        tease: "人生の黄金期D-Day — 曲線が語る",
        mid: "攻めと守り、今月・今年の窓まで一発表示。今すぐ数字で見る。",
      };
    case "s2":
      return {
        tease: "財・仕事の黄金レーン",
        mid: "入るタイミング・適職・支出の癖をデータで開く。同じ穴ループを切る。",
      };
    case "s3":
      return {
        tease: "縁・境界 — 相性のシグナル",
        mid: "相性の型・言葉と行動のズレを数値で。黄金期に誰を引き寄せるかが見える。",
      };
    case "s4":
      return {
        tease: "人生全盛期タイムライン＆月別D-Day",
        mid: "盛り上がりと折れ目が十年・月単位で詰まってる。黄金期をデータで今すぐ確認。",
      };
    case "s5":
      return {
        tease: "処方・開運 — 実行リスト",
        mid: "命式に合わせた色・習慣・朝儀式。気休めじゃなく手順だけ。",
      };
    default:
      return {
        tease: "黄金期D-Dayをデータで今すぐ",
        mid: "プレミアムで全盛期・月窓・処方が数値で続く。感傷より先に表を見ろ。",
      };
  }
}
