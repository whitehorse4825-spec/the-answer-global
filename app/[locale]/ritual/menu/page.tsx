import RitualMenu from "@/components/ritual/RitualMenu";

type Props = { params: Promise<{ locale: string }> };

export default async function RitualMenuPage({ params }: Props) {
  const { locale } = await params;
  return <RitualMenu locale={locale} />;
}
