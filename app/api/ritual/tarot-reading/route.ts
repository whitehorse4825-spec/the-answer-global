import { NextResponse } from "next/server";

import type { RitualRelation } from "@/lib/ritualStorage";

export async function POST(req: Request) {
  let body: {
    cards?: string[];
    birthDate?: string;
    relation?: RitualRelation;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const cards = body.cards?.filter(Boolean) ?? [];
  if (cards.length !== 3) {
    return NextResponse.json({ error: "need 3 cards" }, { status: 400 });
  }

  const rel =
    body.relation === "crush"
      ? "짝사랑의 실"
      : body.relation === "crisis"
        ? "위기의 실타래"
        : "재회를 바라는 실";

  const reading = `${cards[0]} — 지금 네 인연의 뿌리다. 말보다 행동의 무게를 보라.
${cards[1]} — 막히는 지점이다. 여기서 밀면 끊기고, 비우면 숨통이 트인다.
${cards[2]} — 다가올 흐름의 문이다.

【사주와 맞물린 타이밍】
${body.birthDate ? `생년월일 ${body.birthDate}의 기운을 겹쳐 보니, 달이 기울기 전·해가 뉘엿뉘엿할 때 연락 채널이 열리기 쉽다.` : "생시를 알려주지 않아 대략의 달무리만 읽는다. 시간을 알려주면 더 좁혀지느니라."}

【${rel}에 대한 비방】
첫 메시지는 변명 말고 '내 마음 한 줄'만 실어라. 상대가 문을 열면 그때부터 사과·설명을 한 숨에 쏟아도 늦지 않다. 세 장이 모두 말하는 건 한 가지—네가 먼저 숨을 고르고, 상대에게도 숨 쉴 틈을 주라는 것이다.

※ 데모 해석입니다.`;

  return NextResponse.json({ reading });
}
