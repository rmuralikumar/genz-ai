import { LandingPage } from "@/components/landing/LandingPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig, getHomepageSchema } from "@/lib/seo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const schema = getHomepageSchema();

  return (
    <>
      <JsonLd data={schema} />
      <LandingPage />
    </>
  );
}
