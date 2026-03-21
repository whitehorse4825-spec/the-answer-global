import { NextResponse } from "next/server";

import type { RitualRelation } from "@/lib/ritualStorage";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: {
    messages?: Msg[];
    userName?: string;
    relation?: RitualRelation;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const messages = body.messages?.filter((m) => m.content?.trim()) ?? [];
  const last = messages.filter((m) => m.role === "user").pop();
  if (!last?.content?.trim()) {
    return NextResponse.json({ error: "no user message" }, { status: 400 });
  }

  const t = last.content.trim();
  const rel = body.relation ?? "reunion";
  const endings =
    rel === "crisis"
      ? ["…미안.", "그냥 그래.", "알아서 해.", "피곤해."]
      : rel === "crush"
        ? ["ㅋㅋ 뭐야", "응…", "고마워", "바빠서", "나중에 얘기해"]
        : ["…응.", "생각해볼게", "그때 얘기하자", "글쎄", "알겠어"];

  const pick = endings[Math.abs(hash(t)) % endings.length];
  const reply = `…${pick} ${t.length > 20 ? "길게는 못 읽었어." : ""}`.trim();

  return NextResponse.json({
    reply,
    note: "데모: 실서비스에서는 상대 말투·관계 맥락을 학습한 모델을 연동하거라.",
  });
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
