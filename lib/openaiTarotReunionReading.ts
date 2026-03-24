import {
  TAROT_STAGE2_SYSTEM_PROMPT,
  buildTarotReunionUserPrompt,
  type TarotReunionUserContext,
} from "@/lib/tarotReunionReadingPrompt";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function generateTarotReunionReadingWithOpenAI(opts: {
  apiKey: string;
  model?: string;
  context: TarotReunionUserContext;
}): Promise<string> {
  const model = opts.model?.trim() || "gpt-4o";
  const userText = buildTarotReunionUserPrompt(opts.context);

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.86,
      /* 천 자급 한글 점사에 충분; 상한을 낮춰 응답·비용·지연을 줄임 */
      max_tokens: 4000,
      messages: [
        { role: "system", content: TAROT_STAGE2_SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
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
