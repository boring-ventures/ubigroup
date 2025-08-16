import { Suspense } from "react";
import Header from "@/components/views/landing-page/Header";
import Footer from "@/components/views/landing-page/Footer";
import Properties from "@/components/views/landing-page/Properties";
import HeroSearch from "@/components/views/landing-page/HeroSearch";
import CaptureBanner from "@/components/views/landing-page/CaptureBanner";

// Disable static generation for this page to avoid CSS build issues
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background dark">
      <Header />
      <main className="flex-grow relative pt-10 sm:pt-28">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
        <HeroSearch />
        <Suspense
          fallback={
            <div className="flex justify-center p-8">Loading properties...</div>
          }
        >
          <Properties />
        </Suspense>
      </main>
      <CaptureBanner />
      <Footer />
    </div>
  );
}
