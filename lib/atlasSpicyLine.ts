import type { ElementKey, FiveElements } from "./saju";
import { bandFor } from "./fiveElementMatrix";

const LABEL_KO: Record<ElementKey, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

/** 무료 1줄 팩폭 — 오행 % 기반 (일간 단정 없음) */
export function getSpicyOneLiner(
  tone: "ko" | "en" | "ja",
  five: FiveElements,
  seed: number,
): string {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const list = keys.map((k) => ({ k, p: five[k] }));
  const min = list.reduce((a, b) => (a.p <= b.p ? a : b));
  const max = list.reduce((a, b) => (a.p >= b.p ? a : b));
  const pick = Math.abs(seed) % 2;
  const focus = pick === 0 ? min : max;
  const b = bandFor(focus.p);

  if (tone === "ko") {
    const L = LABEL_KO[focus.k];
    if (b === "deficiency" || b === "borderLow") {
      const tail =
        focus.k === "earth"
          ? "인생이 정착이 안 돼."
          : focus.k === "wood"
            ? "시작이 안 서."
            : focus.k === "fire"
              ? "말빨이 얼음장이야."
              : focus.k === "metal"
                ? "잘라야 할 걸 못 잘라."
                : "흐름이 굳었어.";
      return `너 ${L}가 ${focus.p}%라 ${tail} 자책 말고, 이대로만 채워 넣자.`;
    }
    if (b === "excess" || b === "borderHigh") {
      const tail =
        focus.k === "fire"
          ? "말 한마디에 불부터 붙어."
          : focus.k === "earth"
            ? "고집이 운을 막아."
            : focus.k === "wood"
              ? "고집불통으로 번아웃 각이야."
              : focus.k === "metal"
                ? "잘라내려다 인연까지 잘라."
                : "머릿속이 음침해질 수 있어.";
      return `너 ${L}가 ${focus.p}%나 밀려서 ${tail} 숫자부터 맞추자.`;
    }
    return `너 ${L}는 ${focus.p}% 적정이야. 밸런스는 됐고, 방향만 고르면 돼.`;
  }

  if (tone === "en") {
    const L =
      focus.k === "wood"
        ? "Wood"
        : focus.k === "fire"
          ? "Fire"
          : focus.k === "earth"
            ? "Earth"
            : focus.k === "metal"
              ? "Metal"
              : "Water";
    if (b === "deficiency" || b === "borderLow") {
      return `${L} at ${focus.p}%—your life won’t dock until you fill this gap. No self-pity; just patch it.`;
    }
    if (b === "excess" || b === "borderHigh") {
      return `${L} at ${focus.p}%—that excess is burning your runway. Trim before you chase more.`;
    }
    return `${L} at ${focus.p}%—balanced enough; pick a lane and commit.`;
  }

  const L =
    focus.k === "wood"
      ? "木"
      : focus.k === "fire"
        ? "火"
        : focus.k === "earth"
          ? "土"
          : focus.k === "metal"
            ? "金"
            : "水";
  if (b === "deficiency" || b === "borderLow") {
    return `${L}が${focus.p}%——足りないところから人生が揺れる。自責はやめて、埋めだけやろ。`;
  }
  if (b === "excess" || b === "borderHigh") {
    return `${L}が${focus.p}%——過ぎた分が邪魔をする。削ってから追いかけろ。`;
  }
  return `${L}は${focus.p}%で適正帯。あとは方向を一つに絞れ。`;
}
