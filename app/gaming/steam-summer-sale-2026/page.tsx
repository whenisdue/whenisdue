import fs from "fs";
import path from "path";
import { getBaseUrl } from "@/lib/siteUrl";

export async function generateMetadata() {
  const manifestPath = path.join(
    process.cwd(),
    "public/assets/og/generated/manifest.json"
  );

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

  const slug = "gaming/steam-summer-sale-2026";
  const ogImagePath = manifest[slug];

  const baseUrl = getBaseUrl();
  const absoluteOgImage = `${baseUrl}${ogImagePath}`;
  const canonicalUrl = `${baseUrl}/${slug}`;

  return {
    title: "Steam Summer Sale 2026 | WhenIsDue",
    description: "Confirmed date and live countdown.",
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: "Steam Summer Sale 2026",
      description: "Confirmed date and live countdown.",
      url: canonicalUrl,
      images: [
        {
          url: absoluteOgImage,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Steam Summer Sale 2026",
      description: "Confirmed date and live countdown.",
      images: [absoluteOgImage],
    },
  };
}

export default function Page() {
  return (
    <main className="p-10 text-white bg-black min-h-screen">
      <h1 className="text-4xl font-bold">
        Steam Summer Sale 2026
      </h1>
      <p className="mt-4 text-gray-400">
        Confirmed date and live countdown.
      </p>
    </main>
  );
}