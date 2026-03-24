import type { ElementKey, FiveElements } from "./saju";
import { koreanVocativeCall } from "./koreanVocative";

export type PrescriptionTone = "ko" | "en" | "ja";

const ORDER: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];

function entries(five: FiveElements): { key: ElementKey; pct: number }[] {
  return ORDER.map((key) => ({ key, pct: five[key] }));
}

/** 결핍(10% 미만 우선, 없으면 최저 %) — 과다(40% 이상 우선, 없으면 최고 %) 조합으로 2~3개 */
export function pickPrescriptionTargets(five: FiveElements): Array<{
  kind: "deficiency" | "excess";
  key: ElementKey;
  pct: number;
}> {
  const list = entries(five);
  const defStrict = list.filter((x) => x.pct < 10).sort((a, b) => a.pct - b.pct);
  const excStrict = list.filter((x) => x.pct >= 40).sort((a, b) => b.pct - a.pct);
  const minE = list.reduce((a, b) => (a.pct <= b.pct ? a : b));
  const maxE = list.reduce((a, b) => (a.pct >= b.pct ? a : b));

  const picks: Array<{
    kind: "deficiency" | "excess";
    key: ElementKey;
    pct: number;
  }> = [];

  const d0 = defStrict[0] ?? minE;
  picks.push({ kind: "deficiency", key: d0.key, pct: d0.pct });

  const e0 = excStrict[0] ?? maxE;
  if (e0.key !== d0.key) {
    picks.push({ kind: "excess", key: e0.key, pct: e0.pct });
  } else if (defStrict.length >= 2) {
    picks.push({
      kind: "deficiency",
      key: defStrict[1].key,
      pct: defStrict[1].pct,
    });
  } else if (excStrict.length >= 2) {
    picks.push({
      kind: "excess",
      key: excStrict[1].key,
      pct: excStrict[1].pct,
    });
  } else {
    const sorted = [...list].sort((a, b) => a.pct - b.pct);
    const second = sorted.find((x) => x.key !== d0.key);
    if (second) {
      picks.push({ kind: "deficiency", key: second.key, pct: second.pct });
    }
  }

  if (picks.length < 3) {
    const used = new Set(picks.map((p) => `${p.kind}:${p.key}`));
    if (defStrict.length >= 2) {
      const p = defStrict[1];
      if (!used.has(`deficiency:${p.key}`)) {
        picks.push({ kind: "deficiency", key: p.key, pct: p.pct });
      }
    } else if (excStrict.length >= 2) {
      const p = excStrict[1];
      if (!used.has(`excess:${p.key}`)) {
        picks.push({ kind: "excess", key: p.key, pct: p.pct });
      }
    }
  }

  return picks.slice(0, 3);
}

type LineTriplet = { ko: string[]; en: string[]; ja: string[] };

/** 한글 표시명 → 호격 (마지막 글자 받침 기준 아/야, 예: 김유선아 · 무녀야) */
function vocativeKo(displayName: string): string {
  const raw = displayName.replace(/\s+/g, "").trim();
  if (!raw) return "";
  return koreanVocativeCall(raw);
}

/** 결핍 처방 (목·화·토·금·수) — 항목마다 ko/en/ja 변주 여러 개 */
const DEFICIENCY: Record<ElementKey, LineTriplet> = {
  wood: {
    ko: [
      "아침 7시 알람 맞추고 무조건 일어나서 기지개 켜. 시작하는 에너지를 강제로라도 만들어야 해.",
      "창문 열고 심호흡 세 번. ‘시작’이 안 보이면 운도 안 움직여—목(木)은 움직임에서 열려.",
      "오늘은 ‘나중에’ 말고 ‘지금 일어나’만 실행해. 목이 비면 하루가 안 열려.",
    ],
    en: [
      "Set a 7 a.m. alarm, get up, and stretch—no excuses. You need to force-start your momentum.",
      "Open a window and take three deep breaths. If nothing starts, luck won’t either—Wood opens through motion.",
      "Today trade ‘later’ for ‘up now’—without Wood, the day won’t open.",
    ],
    ja: [
      "朝7時アラーム。起きて伸展。始まりのエネルギーを無理にでも作らないと。",
      "窓を開けて深呼吸三回。始まりが見えないと運も動かない——木は動きで開く。",
      "今日は『あとで』より『今起きる』。木が空くと一日が開かない。",
    ],
  },
  fire: {
    ko: [
      "오늘 점심은 무조건 햇볕 드는 창가에서 먹어. 그리고 대화할 때 리액션 한 번만 더 크게 해봐.",
      "붉은 말 한 마디보다, 눈 마주치고 고개 한 번 끄덕이는 게 오늘의 화(火) 보충이야.",
      "햇살 10분이라도 얼굴에 쏘이게 해. 화는 ‘보이는 열’에서 채워져.",
    ],
    en: [
      "Eat lunch today by a sunny window. And react just a little louder once when you talk.",
      "One nod of eye contact beats a clever line—that’s your Fire top-up today.",
      "Let sunlight hit your face for ten minutes—Fire fills from visible warmth.",
    ],
    ja: [
      "今日の昼は日当たりの窓辺で。会話のリアクションも一回だけ大きく。",
      "上手な一言より、目を見てうなずく一回——今日の火の補充はそれで十分。",
      "顔に日を10分。火は『見える熱』で満たされる。",
    ],
  },
  earth: {
    ko: [
      "가계부 앱 깔고 오늘 쓴 돈 딱 3가지만 적어. 네 운명은 '기록'에서 시작돼.",
      "오늘 먹은 것과 잔액만 메모해도 돼. 토(土)는 ‘땅에 새기는 것’이야, 기분 말고.",
      "현금·카드 구분 말고, 오늘 나간 금액 한 줄만 남겨. 토는 숫자가 밟히면 움직여.",
    ],
    en: [
      "Install a budgeting app and write three expenses from today. Your fortune starts in records.",
      "Note what you ate and your balance—Earth is what you carve into ground, not mood.",
      "Skip the lecture—one line of what left your wallet today. Earth moves when numbers touch soil.",
    ],
    ja: [
      "家計簿アプリを入れて、今日使ったのを3つだけ記録。運命は『記録』から始まる。",
      "食べたものと残高だけでもいい。土は『地面に刻む』こと——気分じゃない。",
      "説明はいらない。今日出た金額を一行。土は数字が地面に触れたとき動く。",
    ],
  },
  metal: {
    ko: [
      "서랍이나 가방 속 영수증, 쓰레기 다 버려. 안 쓰는 앱 3개 삭제하는 게 오늘 네 부적이야.",
      "끊을 건 끊어. 금(金)은 정리가 곧 경계고, 경계가 곧 운이야.",
      "오늘은 ‘보관’ 금지. 한 군데만 비워. 금이 과하면 잡동사니가 칼날을 가려.",
    ],
    en: [
      "Clear receipts and junk from your bag or drawer. Delete three unused apps—that’s your today talisman.",
      "Cut what needs cutting—Metal is boundaries, and boundaries are luck.",
      "No ‘saving for later’ today—clear one shelf. Clutter dulls Metal’s edge.",
    ],
    ja: [
      "鞄・引き出しのレシートとゴミを捨てる。未使用アプリ3つ削除が今日の護符。",
      "切るものは切る。金は整理が境界で、境界が運。",
      "今日は『取っておき』禁止。一箇所空ける。雑多が刃を鈍らせる。",
    ],
  },
  water: {
    ko: [
      "오늘 밤엔 휴대폰 치우고 따뜻한 물에 10분만 씻어. 머릿속 열기부터 식혀야 운이 들어와.",
      "물 한 잔 천천히. 수(水)는 멈춤에서 채워져—스크롤이 아니라.",
      "샤워만으로도 됨. 목덜미까지 시원해지게. 수는 ‘흐름’이 먼저 식어야 맑아져.",
    ],
    en: [
      "Tonight put the phone away and soak in warm water for 10 minutes. Cool the head before luck can flow in.",
      "Drink one glass slowly—Water refills in stillness, not scrolling.",
      "Even a shower counts—cool the back of your neck. Water clears when heat drains first.",
    ],
    ja: [
      "今夜はスマホを離し、ぬるめの湯に10分。頭の熱を下げてから運が入る。",
      "水を一杯ゆっくり。水は止まりで満たされる——スクロールじゃない。",
      "シャワーだけでも首筋まで冷ます。水は熱が抜けてから澄む。",
    ],
  },
};

/** 과다 처방 */
const EXCESS: Record<ElementKey, LineTriplet> = {
  wood: {
    ko: [
      "책 한 장 넘기기 전에, 한 줄만 정리해. 네 안에 자라는 게 너무 많아서 통로가 막혔어.",
      "새로 붙이기 전에 하나 떼. 목(木)이 과하면 가지치기가 운이야.",
      "시작만 잔뜩이면 안 돼. 끝낸 줄 하나 올려. 목 과다는 숲이 길을 가린다는 뜻이야.",
    ],
    en: [
      "Before you flip another page, finish one line. Growth inside you is crowding the airway.",
      "Prune before you plant—when Wood is heavy, trimming is the ritual.",
      "Stop stacking starts—finish one line. Too much Wood is a forest blocking the path.",
    ],
    ja: [
      "次のページを開く前に、一行を終える。内側の成長が通路を狭すぎる。",
      "足す前に一つ手放す。木が過剰なら剪定が運。",
      "始めばかり積むな。終わった一行を載せろ。木過多は森が道を塞ぐ。",
    ],
  },
  fire: {
    ko: [
      "말하기 전에 속으로 숫자 셋만 세. 네 입에서 나가는 화(火)가 네 복을 태우고 있어.",
      "지금은 말 줄이고 숨부터 고르기. 불이 세면 주변만 태우고 너는 텅 비게 돼.",
      "입 밖으로 말 내뱉기 전에 딱 3초만 참아봐. 그 불기운이 네 복을 다 태우고 있거든.",
      "말 속도부터 반으로. 화(火)가 넘치면 복이 타기 전에 네가 먼저 타버려.",
    ],
    en: [
      "Before you speak, count to three in your head. Your Fire is burning your fortune.",
      "Talk less, breathe first—too much Fire hollows you while scorching the room.",
      "Before words leave your mouth, hold three seconds—that spark is torching your luck.",
      "Halve your talking speed first—excess Fire burns you before it burns fortune.",
    ],
    ja: [
      "話す前に頭の中で3数。口から出る火が福を焼いている。",
      "今は話を減らして呼吸から。火が強すぎると周りを焼いて中が空く。",
      "言葉が出る前に3秒だけ止める。その火が福を焼いている。",
      "まず話す速度を半分に。火過多は福より先に自分を焼く。",
    ],
  },
  earth: {
    ko: [
      "오늘 평소 안 가던 길로 퇴근해봐. 네 고집이 운을 막고 있으니 경로를 틀어야 해.",
      "‘익숙함’ 한 번만 깨봐. 토(土)가 굳으면 물도 안 들어와.",
      "지도 앱 켜고 ‘우회’ 한 번만 눌러봐. 토가 굳으면 같은 자리만 맴돌아.",
    ],
    en: [
      "Take a different route home today. Your stubbornness is blocking your luck—bend the path.",
      "Break one habit of comfort—when Earth hardens, nothing soaks in.",
      "Tap ‘reroute’ once—when Earth clings, you loop the same groove.",
    ],
    ja: [
      "今日はいつもと違う道で帰る。固執が運を塞いでいるから、ルートを変えて。",
      "慣れを一つだけ壊す。土が固まると水も入らない。",
      "地図で一回だけ迂回。土が硬いと同じ場所をぐるぐるする。",
    ],
  },
  metal: {
    ko: [
      "오늘은 '정리' 말고 '한 가지만 끝내기'만 해. 딱딱한 기준이 너를 얼려놓고 있어.",
      "완벽한 칼날 말고, 한 번만 쓴 칼부터 닦아. 금(金) 과다는 너무 잘라서 인연이 새.",
      "기준서 한 페이지만 접어. 금 과다는 ‘맞다/틀리다’만 보다가 온기를 잘라.",
    ],
    en: [
      "Today skip ‘organizing’ and finish one thing. Rigid rules are freezing you.",
      "Polish one blade you’ve used—Metal excess cuts ties too clean to hold luck.",
      "Fold one page of your rulebook—Metal overkill freezes warmth.",
    ],
    ja: [
      "今日は『整頓』ではなく『一件を終わらせる』だけ。硬い基準があなたを凍らせている。",
      "完璧な刃より、一度使った刃を磨く。金が過剰だと縁まで切りすぎる。",
      "基準のページを一枚折れ。金過多は正誤だけ見て温かみを切る。",
    ],
  },
  water: {
    ko: [
      "물처럼 흐르지 말고, 오늘 한 끼 시간만 고정해. 둥둥 떠다니면 운이 안 묻어.",
      "‘나중에’ 한 줄만 ‘지금’으로 바꿔. 수(水)가 넘치면 정하는 앵커가 필요해.",
      "스케줄 하나만 못 박아. 수 과다는 흐름만 있고 받침이 없대서 운이 안 남아.",
    ],
    en: [
      "Don’t drift like water—lock one mealtime today. Luck won’t stick if you float.",
      "Change one ‘later’ to ‘now’—excess Water needs an anchor.",
      "Pin one block on the calendar—too much Water flows away with nothing to hold it.",
    ],
    ja: [
      "水のように流すな。今日は食事の時間だけ固定。浮かぶと運が定着しない。",
      "『あとで』を一つ『今』に。水が過剰なら錨が要る。",
      "スケジュールを一つだけ打ち抜け。水過多は受け皿がなく流れ去る。",
    ],
  },
};

function lineFor(
  kind: "deficiency" | "excess",
  key: ElementKey,
  tone: PrescriptionTone,
  mix: number,
  lineIndex: number,
): string {
  const table = kind === "deficiency" ? DEFICIENCY[key] : EXCESS[key];
  const col = tone === "en" ? table.en : tone === "ja" ? table.ja : table.ko;
  const salt =
    mix +
    lineIndex * 97 +
    key.charCodeAt(0) * 3 +
    (kind === "deficiency" ? 11 : 29);
  const idx = Math.abs(salt) % col.length;
  return col[idx] ?? col[0];
}

/** 인트로: (구) ‘북쪽 바람…’ 문구는 사용하지 않음. reportTs·seed로 3종 중 선택 */
function buildIntro(
  tone: PrescriptionTone,
  userName: string,
  mix: number,
): string {
  const idx = Math.abs(mix) % 3;
  const name = userName.trim();
  const voc = vocativeKo(name);

  if (tone === "ko") {
    const lines = [
      voc
        ? `${voc}, 네 팔자에 부족한 기운을 채우려면 이것부터 해.`
        : `네 팔자에 부족한 기운을 채우려면 이것부터 해.`,
      "운을 바꾸고 싶어? 그럼 머릿속 꽃밭 치우고 이것만 지켜봐.",
      "무녀는 거짓말 안 해. 끊어진 인연줄 다시 잇기 싫으면 당장 시작해.",
    ];
    return `${lines[idx]}\n\n`;
  }

  if (tone === "en") {
    const lines = [
      name
        ? `${name}, if your chart is short on qi—start by filling the gap from this.`
        : `If your chart is short on qi—start by filling the gap from this.`,
      "Want to shift your luck? Clear the flower bed in your head and stick to this one thing.",
      "Wol-a doesn’t lie. Don’t want your life tangled? Start now.",
    ];
    return `${lines[idx]}\n\n`;
  }

  const lines = [
    name
      ? `${name}、四柱で薄い気を補うなら、まずこれから。`
      : `四柱で薄い気を補うなら、まずこれから。`,
    "運を変えたいなら、頭の中の花畑を整理して、これだけ守って。",
    "ウォラは嘘をつかない。人生を絡ませたくなければ、今すぐ始めて。",
  ];
  return `${lines[idx]}\n\n`;
}

function buildOutro(tone: PrescriptionTone, mix: number): string {
  const idx = Math.abs(mix * 7 + 3) % 4;

  if (tone === "ko") {
    const lines = [
      "\n이건 위로가 아니라 거울이야. 네 운명의 결은 이제 네 손에 있어.\n",
      "\n위로는 친구한테 가서 받아. 무녀는 인연줄과 길만 알려줄 뿐이야.\n",
      "\n거울 보듯이 읽어. 네가 피하면 안 되는 건, 지금 여기 적혀 있어.\n",
      "\n위로는 휴지통에 넣고, 처방만 골라. 무녀는 장난 안 쳐.\n",
    ];
    return lines[idx];
  }

  if (tone === "en") {
    const lines = [
      "\nThis isn’t comfort—it’s a mirror. The knot of fate is in your hands now.\n",
      "\nGet your comfort from a friend. Wol-a only points at the path.\n",
      "\nRead it like a mirror—what you can’t dodge is written right here.\n",
      "\nTrash the pep talk; pick the prescription. Wol-a doesn’t do jokes.\n",
    ];
    return lines[idx];
  }

  const lines = [
    "\nこれは慰めではなく鏡。運命の結び目は、今ここに。\n",
    "\n慰めは友達に取りに行って。ウォラは道を指すだけ。\n",
    "\n鏡を見るように読んで。避けてはいけないことは、ここに書いてある。\n",
    "\n励ましは捨てて、処方だけ選べ。ウォラは冗談を言わない。\n",
  ];
  return lines[idx];
}

export type BuildWolaPrescriptionOptions = {
  tone: PrescriptionTone;
  five: FiveElements;
  /** 이름·오행 합 등 기본 시드 */
  seed: number;
  userName?: string;
  /** 리포트를 새로 저장할 때의 타임스탬프 — 바뀔 때마다 인트로·아웃트로·문장 변주 */
  reportTs?: number;
};

/**
 * 오행 % 기반 무녀 처방 본문 (s5).
 * `reportTs`를 넣으면 같은 사주라도 새 리포트마다 멘트가 달라짐.
 */
export function buildWolaPrescription(opts: BuildWolaPrescriptionOptions): string {
  const { tone, five, seed, userName = "", reportTs = 0 } = opts;
  const mix = seed + reportTs * 13 + userName.length * 5;
  const targets = pickPrescriptionTargets(five);
  const lines = targets.map((t, i) => {
    const s = mix + i * 17 + t.pct;
    const bullet = lineFor(t.kind, t.key, tone, s, i);
    return `· ${bullet}`;
  });

  return `${buildIntro(tone, userName, mix)}${lines.join("\n")}${buildOutro(tone, mix)}`;
}
