import {
  PERSONA_STAGE3_SYSTEM_PROMPT,
  buildPersonaStage3UserEnvelope,
  type PersonaStage3Context,
} from "@/lib/personaStage3Prompt";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

type ChatMsg = { role: "user" | "assistant"; content: string };

export async function generatePersonaStage3WithOpenAI(opts: {
  apiKey: string;
  model?: string;
  /** 전체 대화 (마지막은 방금 보낸 유저 메시지) */
  messages: ChatMsg[];
  context: PersonaStage3Context;
  maxUserTurns: number;
}): Promise<string> {
  const model = opts.model?.trim() || "gpt-4o";
  const userMsgs = opts.messages.filter((m) => m.role === "user");
  const turnIndex = userMsgs.length;
  const lastUserText = userMsgs[userMsgs.length - 1]?.content?.trim() ?? "";
  if (!lastUserText) {
    throw new Error("마지막 유저 메시지가 비어 있습니다.");
  }

  const envelope = buildPersonaStage3UserEnvelope({
    turnIndex,
    maxTurns: opts.maxUserTurns,
    context: opts.context,
    latestUserMessage: lastUserText,
  });

  const prior: ChatMsg[] = [];
  const hist = opts.messages.slice(0, -1);
  for (const m of hist) {
    prior.push(m);
  }

  const composed: Array<{ role: "system" | "user" | "assistant"; content: string }> =
    [
      { role: "system", content: PERSONA_STAGE3_SYSTEM_PROMPT },
      ...prior,
      { role: "user", content: envelope },
    ];

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.82,
      max_tokens: 1200,
      messages: composed,
    }),
  });

  const raw = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  if (!res.ok) {
    const msg = raw.error?.message ?? res.statusText;
    throw new Error(`OpenAI API 오류 (${res.status}): ${msg}`);
  }

  const text = raw.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI 응답에 본문이 없습니다.");
  }
  return text;
}
