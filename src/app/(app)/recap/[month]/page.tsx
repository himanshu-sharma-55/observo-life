import { MonthRecapStory } from "@/components/month-recap-story";

export default async function RecapMonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  return <MonthRecapStory month={month} />;
}
