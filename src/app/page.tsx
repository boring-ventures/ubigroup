import { Suspense } from "react";
import Header from "@/components/views/landing-page/Header";
import Footer from "@/components/views/landing-page/Footer";
import Properties from "@/components/views/landing-page/Properties";
import HeroSearch from "@/components/views/landing-page/HeroSearch";
import OpportunitiesSection from "@/components/views/landing-page/opportunities-section";
import AppraisalSection from "@/components/views/landing-page/appraisal-section";
import CaptureBanner from "@/components/views/landing-page/CaptureBanner";
import SectionSeparator from "@/components/ui/section-separator";

// Disable static generation for this page to avoid CSS build issues
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background dark">
      <Header />
      <main className="flex-grow relative pt-10 sm:pt-28">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
        <HeroSearch />
        <SectionSeparator />
        <Suspense
          fallback={
            <div className="flex justify-center p-8">Loading properties...</div>
          }
        >
          <Properties />
        </Suspense>
        <SectionSeparator />
        <OpportunitiesSection />
        <SectionSeparator />
        <AppraisalSection />
        <CaptureBanner />
      </main>
      <Footer />
    </div>
  );
}
