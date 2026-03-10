import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SeriesClientUI } from "./SeriesClientUI";

type SeriesPageProps = {
  params: Promise<{ seriesKey: string }>;
};

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { seriesKey } = await params;

  const series = await prisma.eventSeries.findUnique({
    where: { slugBase: seriesKey },
    include: {
      events: { orderBy: { dueAt: "asc" } },
    },
  });

  if (!series) notFound();

  return <SeriesClientUI series={series} />;
}
