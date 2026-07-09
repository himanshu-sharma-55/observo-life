import { PanelSkeleton } from "@/components/lazy-loading-skeletons";
import dynamic from "next/dynamic";

const MonthRecapStory = dynamic(
  () => import("@/components/month-recap-story").then((mod) => mod.MonthRecapStory),
  { loading: () => <PanelSkeleton /> },
);

export default async function RecapMonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  return <MonthRecapStory month={month} />;
}
