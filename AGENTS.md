<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Destiny keywords (i18n)

- Canonical hashtag words live in Korean in `lib/keywordI18n.ts` (`KEYWORD_TRIPLETS`); UI uses `translateKeywords(..., locale)`.
- Any AI/system prompt that emits hashtags must include `AI_KEYWORD_LOCALE_RULE` from that file and respect the user’s locale.

## Wol-a prescription (s5)

- Built in `lib/wolaPrescription.ts`. Pass `reportTs` from `destiny:last` (`ArchiveForm` sets `ts: Date.now()` on each submit) so copy shifts when the user generates a new report.
- Do **not** reintroduce the retired intro line about “북쪽 바람”.

## Free vs Premium (lifetime atlas)

- Client flag: `localStorage` key `wola:premium` = `"1"`, or open **`/{locale}/result?premium=1`** once to unlock (see `lib/premiumClient.ts`).
- Free tier: `buildFreeAtlasChapter1Text` + blurred stats, timeline, and chapters 2–5.
- Premium: full `buildLifetimeAtlasCopy` bodies; **Save destiny image** enabled only when premium.
- Share: viral copy + PNG card (`shareCardRef`); URLs use `utm_source=share` via `lib/shareViral.ts`.
- Kakao Talk deep share needs a Kakao JS key and template IDs (not wired in repo).
