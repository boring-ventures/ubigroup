"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { PropertySearchBar } from "@/components/public/property-search-bar";
import { Sparkles } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";
import { WordPullUp } from "@/components/ui/word-pull-up";
import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { usePublicLandingImages } from "@/hooks/use-public-landing-images";
import Image from "next/image";
import logoLight from "@logos/logo_ligth.svg";
import logoDark from "@logos/logo_dark.svg";

type TransactionTab = "venta" | "alquiler" | "anticretico" | "proyectos";
// Hardcoded fallback images for immediate display
const FALLBACK_IMAGES = [
  "https://plus.unsplash.com/premium_photo-1684175656320-5c3f701c082c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1430285561322-7808604715df?q=80&w=1200&auto=format&fit=crop",
];

export const HeroSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { landingImages } = usePublicLandingImages();

  const [query, setQuery] = useState("");
  const [transaction, setTransaction] = useState<TransactionTab>("venta");
  const [type, setType] = useState<
    "" | "HOUSE" | "APARTMENT" | "OFFICE" | "LAND"
  >("");

  // Hero image carousel - smooth transition from hardcoded to DB images
  const [carouselImages, setCarouselImages] =
    useState<string[]>(FALLBACK_IMAGES);
  const [imageIndex, setImageIndex] = useState(0);
  const hasInsertedDbImages = useRef(false);
  const cleanupScheduled = useRef(false);

  // Handle smooth progressive transition when database images load
  useEffect(() => {
    if (landingImages.length > 0 && !hasInsertedDbImages.current) {
      const databaseImageUrls = landingImages.map((img) => img.imageUrl);

      setCarouselImages((prevImages) => {
        // Check if database images are already in the carousel
        const hasDbImages = databaseImageUrls.some((url) =>
          prevImages.includes(url)
        );
        if (hasDbImages) {
          return prevImages; // No changes needed
        }

        // Insert database images after the current position
        // If we're showing h2 (index 1), the new array becomes [h1, h2, d1, d2, d3, ...]
        const beforeCurrent = prevImages.slice(0, imageIndex + 1);
        const afterCurrent = prevImages.slice(imageIndex + 1);

        // Create new array: [hardcoded up to current, database images, remaining hardcoded]
        return [...beforeCurrent, ...databaseImageUrls, ...afterCurrent];
      });

      hasInsertedDbImages.current = true;
    }
  }, [landingImages, imageIndex]);

  // Cleanup hardcoded images after they're no longer visible
  useEffect(() => {
    if (
      hasInsertedDbImages.current &&
      !cleanupScheduled.current &&
      landingImages.length > 0
    ) {
      const databaseImageUrls = landingImages.map((img) => img.imageUrl);

      // Find the position where database images start
      const dbStartIndex = carouselImages.findIndex((img) =>
        databaseImageUrls.includes(img)
      );

      // Check if we're currently showing a database image
      const currentImage = carouselImages[imageIndex];
      const isShowingDbImage = databaseImageUrls.includes(currentImage);

      // Clean up when we're showing a DB image and have moved past the insertion point
      if (
        dbStartIndex !== -1 &&
        isShowingDbImage &&
        imageIndex >= dbStartIndex
      ) {
        // Clean up: remove hardcoded images, keep only database images
        const cleanImages = carouselImages.filter((img) =>
          databaseImageUrls.includes(img)
        );

        if (
          cleanImages.length > 0 &&
          cleanImages.length !== carouselImages.length
        ) {
          // Adjust current index to match the new array
          const newIndex = cleanImages.findIndex((img) => img === currentImage);

          setCarouselImages(cleanImages);
          setImageIndex(newIndex !== -1 ? newIndex : 0);
          cleanupScheduled.current = true;
        }
      }
    }
  }, [imageIndex, carouselImages, landingImages]);

  // Auto-advance carousel
  useEffect(() => {
    if (carouselImages.length === 0) return;

    const intervalId = setInterval(() => {
      setImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [carouselImages.length]);

  // Sticky search pill on mobile
  const [showStickySearch, setShowStickySearch] = useState(false);
  const mobileSearchRef = React.useRef<HTMLDivElement | null>(null);
  const lastScrollYRef = useRef<number>(0);
  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const goingDown = current > lastScrollYRef.current;
      setShowStickySearch(current > 120 && goingDown);
      lastScrollYRef.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    if (type) params.set("type", type);
    params.set("tab", transaction);
    const url = params.toString()
      ? `${pathname}?${params.toString()}#properties`
      : `${pathname}#properties`;
    router.push(url);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden -mt-10 sm:-mt-28">
      {/* Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {carouselImages.length > 0 ? (
          <>
            {carouselImages.map((img, idx) => {
              return (
                <div
                  key={img}
                  className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                    idx === imageIndex ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ backgroundImage: `url(${img})` }}
                  aria-hidden={idx !== imageIndex}
                />
              );
            })}
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

            {/* Carousel dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {carouselImages.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Ir a imagen ${i + 1}`}
                  onClick={() => setImageIndex(i)}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    i === imageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-white text-lg">
              No hay imágenes disponibles
            </div>
          </div>
        )}
      </div>

      {/* Main Content Overlay */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-32">
        <div className="text-center space-y-6 lg:space-y-8">
          {/* Centered Logo - Main Focus */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/30 to-primary/40 rounded-3xl blur-3xl group-hover:blur-4xl transition-all duration-700 scale-125"></div>
              <div className="relative bg-background/95 backdrop-blur-2xl rounded-3xl p-6 lg:p-8 border border-border/50 shadow-2xl transition-all duration-500">
                <div className="flex items-center gap-4 lg:gap-6">
                  <Image
                    src={logoLight}
                    alt="UbiGroup logo"
                    width={64}
                    height={64}
                    className="h-16 w-auto dark:hidden lg:h-20 lg:w-auto transition-all duration-500"
                    priority
                  />
                  <Image
                    src={logoDark}
                    alt="UbiGroup logo"
                    width={64}
                    height={64}
                    className="hidden h-16 w-auto dark:block lg:h-20 lg:w-auto transition-all duration-500"
                    priority
                  />
                  <div className="flex flex-col">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                      UbiGroup
                    </h1>
                    <p className="text-base lg:text-lg text-muted-foreground font-medium">
                      Tu socio inmobiliario de confianza
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Text Content */}
          <div className="space-y-4 lg:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-background/80 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Encuentra tu propiedad con confianza
              </span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-white">
                <span className="block">Encuentra tu</span>
              </h2>
              <WordPullUp
                words="Hogar Ideal"
                className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-primary"
                wrapperFramerProps={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.5,
                    },
                  },
                }}
                framerProps={{
                  hidden: { y: 30, opacity: 0 },
                  show: {
                    y: 0,
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 100,
                      damping: 10,
                    },
                  },
                }}
              />
            </div>

            <p className="text-base lg:text-lg text-white/90 max-w-xl mx-auto">
              Busca por ciudad, barrio o tipo de propiedad. Filtra por venta o
              alquiler y empieza a explorar.
            </p>

            {/* Trust indicator */}
            <div className="flex justify-center">
              <AvatarCircles
                numProperties={500}
                propertyUrls={[
                  {
                    imageUrl:
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=150&h=150&fit=crop&crop=entropy",
                  },
                  {
                    imageUrl:
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150&h=150&fit=crop&crop=entropy",
                  },
                  {
                    imageUrl:
                      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=150&h=150&fit=crop&crop=entropy",
                  },
                  {
                    imageUrl:
                      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=150&h=150&fit=crop&crop=entropy",
                  },
                  {
                    imageUrl:
                      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&h=150&fit=crop&crop=entropy",
                  },
                ]}
              />
            </div>
          </div>

          {/* Search Panel - Centered */}
          <div className="w-full max-w-3xl mx-auto" ref={mobileSearchRef}>
            <ShineBorder className="p-1.5 rounded-2xl w-full">
              <Card className="p-4 lg:p-6 bg-background/95 backdrop-blur-2xl shadow-2xl w-full border-0">
                <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-4">
                  <Tabs
                    value={transaction}
                    onValueChange={(v) => setTransaction(v as TransactionTab)}
                  >
                    <TabsList className="flex-nowrap overflow-x-auto whitespace-nowrap h-9">
                      <TabsTrigger value="venta" className="text-xs px-3">
                        Venta
                      </TabsTrigger>
                      <TabsTrigger value="alquiler" className="text-xs px-3">
                        Alquiler
                      </TabsTrigger>
                      <TabsTrigger value="anticretico" className="text-xs px-3">
                        Anticrético
                      </TabsTrigger>
                      <TabsTrigger value="proyectos" className="text-xs px-3">
                        Proyectos
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Select
                    value={type || "ALL"}
                    onValueChange={(v: string) =>
                      setType(
                        v === "ALL"
                          ? ""
                          : (v as "HOUSE" | "APARTMENT" | "OFFICE" | "LAND")
                      )
                    }
                  >
                    <SelectTrigger className="w-full lg:w-40 border-[hsl(0_0%_25%)] bg-[hsl(0_0%_13%)] text-[hsl(0_0%_85%)] h-9 text-sm">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[hsl(0_0%_13%)] text-[hsl(0_0%_85%)] border-[hsl(0_0%_25%)] shadow-lg">
                      <SelectItem
                        value="ALL"
                        className="hover:bg-[hsl(162_50%_33%)] hover:text-[hsl(0_0%_85%)] focus:bg-[hsl(162_50%_33%)] focus:text-[hsl(0_0%_85%)]"
                      >
                        Todos
                      </SelectItem>
                      <SelectItem
                        value="HOUSE"
                        className="hover:bg-[hsl(162_50%_33%)] hover:text-[hsl(0_0%_85%)] focus:bg-[hsl(162_50%_33%)] focus:text-[hsl(0_0%_85%)]"
                      >
                        Casa
                      </SelectItem>
                      <SelectItem
                        value="APARTMENT"
                        className="hover:bg-[hsl(162_50%_33%)] hover:text-[hsl(0_0%_85%)] focus:bg-[hsl(162_50%_33%)] focus:text-[hsl(0_0%_85%)]"
                      >
                        Departamento
                      </SelectItem>
                      <SelectItem
                        value="OFFICE"
                        className="hover:bg-[hsl(162_50%_33%)] hover:text-[hsl(0_0%_85%)] focus:bg-[hsl(162_50%_33%)] focus:text-[hsl(0_0%_85%)]"
                      >
                        Oficina
                      </SelectItem>
                      <SelectItem
                        value="LAND"
                        className="hover:bg-[hsl(162_50%_33%)] hover:text-[hsl(0_0%_85%)] focus:bg-[hsl(162_50%_33%)] focus:text-[hsl(0_0%_85%)]"
                      >
                        Terreno
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 w-full">
                    <PropertySearchBar
                      value={query}
                      onSearch={handleSearch}
                      placeholder="Buscar por ciudad, barrio o palabra clave"
                      className="w-full [&_input]:border-[hsl(0_0%_25%)] [&_input]:bg-[hsl(0_0%_13%)] [&_input]:text-[hsl(0_0%_85%)] [&_input]:placeholder-[hsl(0_0%_65%)]"
                    />
                  </div>
                </div>
              </Card>
            </ShineBorder>
          </div>
        </div>
      </div>

      {/* Sticky search pill (mobile only) */}
      {showStickySearch && (
        <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={() =>
              mobileSearchRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="px-4 py-2 rounded-full shadow-lg bg-primary text-primary-foreground text-sm font-medium"
            aria-label="Ir a la búsqueda"
          >
            Buscar propiedades
          </button>
        </div>
      )}
    </section>
  );
};

export default HeroSearch;
