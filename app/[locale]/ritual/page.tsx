import RitualIntake from "@/components/ritual/RitualIntake";

type Props = { params: Promise<{ locale: string }> };

export default async function RitualPage({ params }: Props) {
  const { locale } = await params;
  return <RitualIntake locale={locale} />;
}
