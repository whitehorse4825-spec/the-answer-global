import DecodingExperience from "@/components/DecodingExperience";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DecodingPage({ params }: Props) {
  const { locale } = await params;
  return <DecodingExperience locale={locale} />;
}
