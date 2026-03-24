import RitualBriefing from "@/components/ritual/RitualBriefing";

type Props = { params: Promise<{ locale: string }> };

export default async function RitualBriefingPage({ params }: Props) {
  const { locale } = await params;
  return <RitualBriefing locale={locale} />;
}
