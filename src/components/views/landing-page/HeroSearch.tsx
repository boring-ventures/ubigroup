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
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { usePublicLandingImages } from "@/hooks/use-public-landing-images";
import Image from "next/image";

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

  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

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
    <section className="relative">
      <div className="container">
        {/* Visual hero with image on the right and content overlay */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 items-center pt-8 sm:pt-20 md:pt-24 lg:pt-28 pb-14 lg:pb-16">
          {/* Left copy */}
          <div
            className="order-1 lg:order-1 space-y-4 lg:space-y-6"
            ref={mobileSearchRef}
          >
            {/* Brand Card */}
            <div className="absolute top-8 left-0 z-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-700 scale-110"></div>
                <div className="relative bg-background/95 backdrop-blur-2xl rounded-3xl p-6 lg:p-8 border border-border/50 shadow-2xl transition-all duration-500">
                  <div className="flex items-center gap-4 lg:gap-6">
                    <Image
                      src="/assets/logos/logo_dark.svg"
                      alt="UBIGroup Logo"
                      width={64}
                      height={64}
                      className="h-16 w-auto lg:h-20 lg:w-auto transition-all duration-500"
                      priority
                    />
                    <div className="flex flex-col">
                      <h2 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                        UBIGroup
                      </h2>
                      <p className="text-base lg:text-lg text-muted-foreground font-medium">
                        Revolucionando el rubro inmobiliario
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-background/70 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Encuentra tu propiedad con confianza
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold leading-[1.1] text-foreground">
              <div className="block">
                <span className="block">Encuentra tu</span>
                <ContainerTextFlip
                  words={[
                    "Hogar Ideal",
                    "Departamento Ideal",
                    "Casa Ideal",
                    "Oficina Ideal",
                    "Terreno Ideal",
                  ]}
                  className="block"
                />
              </div>
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-xl">
              Busca por ciudad, barrio o tipo de propiedad. Filtra por venta o
              alquiler y empieza a explorar.
            </p>

            {/* Trust indicator */}
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

            {/* Search Panel - mobile */}
            <div className="lg:hidden w-full">
              <ShineBorder className="p-1 rounded-2xl w-full">
                <Card className="p-0 bg-background/80 backdrop-blur-xl shadow-2xl w-full border-0">
                  <div className="flex flex-col gap-3 p-4 w-full">
                    <div className="flex flex-col gap-1.5 w-full">
                      <Tabs
                        value={transaction}
                        onValueChange={(v) =>
                          setTransaction(v as TransactionTab)
                        }
                        className="w-full"
                      >
                        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap min-w-0">
                          <TabsTrigger value="venta" className="flex-shrink-0">
                            Venta
                          </TabsTrigger>
                          <TabsTrigger
                            value="alquiler"
                            className="flex-shrink-0"
                          >
                            Alquiler
                          </TabsTrigger>
                          <TabsTrigger
                            value="anticretico"
                            className="flex-shrink-0"
                          >
                            Anticrético
                          </TabsTrigger>
                          <TabsTrigger
                            value="proyectos"
                            className="flex-shrink-0"
                          >
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
                        <SelectTrigger className="w-full border-[hsl(0_0%_25%)] bg-[hsl(0_0%_13%)] text-[hsl(0_0%_85%)]">
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
                    </div>
                    <PropertySearchBar
                      value={query}
                      onSearch={handleSearch}
                      placeholder="Buscar por ciudad, barrio o palabra clave"
                      className="w-full [&_input]:border-[hsl(0_0%_25%)] [&_input]:bg-[hsl(0_0%_13%)] [&_input]:text-[hsl(0_0%_85%)] [&_input]:placeholder-[hsl(0_0%_65%)]"
                    />
                    <div className="text-xs text-muted-foreground">
                      Búsqueda rápida. Para filtros avanzados, baja a la sección
                      de propiedades.
                    </div>
                  </div>
                </Card>
              </ShineBorder>
            </div>
          </div>

          {/* Right image (carousel) */}
          <div
            className="order-2 lg:order-2 relative h-[240px] sm:h-[320px] lg:h-[480px] rounded-3xl overflow-hidden"
            onTouchStart={(e) => {
              touchStartXRef.current = e.changedTouches[0].clientX;
              touchEndXRef.current = null;
            }}
            onTouchMove={(e) => {
              touchEndXRef.current = e.changedTouches[0].clientX;
            }}
            onTouchEnd={() => {
              const start = touchStartXRef.current;
              const end = touchEndXRef.current;
              if (start != null && end != null) {
                const delta = end - start;
                if (Math.abs(delta) > 40) {
                  setImageIndex((prev) =>
                    delta < 0
                      ? (prev + 1) % carouselImages.length
                      : (prev - 1 + carouselImages.length) %
                        carouselImages.length
                  );
                }
              }
              touchStartXRef.current = null;
              touchEndXRef.current = null;
            }}
          >
            {/* Always show images immediately - no loading state */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />

                {/* Carousel dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {carouselImages.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Ir a imagen ${i + 1}`}
                      onClick={() => setImageIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
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

          {/* Search Panel - desktop overlay (raised higher) */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 bottom-6 w-full max-w-5xl z-10">
            <ShineBorder className="p-3 rounded-2xl">
              <Card className="p-6 bg-background/90 backdrop-blur-xl border-border shadow-2xl w-full">
                <div className="flex items-center gap-4">
                  <Tabs
                    value={transaction}
                    onValueChange={(v) => setTransaction(v as TransactionTab)}
                  >
                    <TabsList className="flex-nowrap overflow-x-auto whitespace-nowrap">
                      <TabsTrigger value="venta">Venta</TabsTrigger>
                      <TabsTrigger value="alquiler">Alquiler</TabsTrigger>
                      <TabsTrigger value="anticretico">Anticrético</TabsTrigger>
                      <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
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
                    <SelectTrigger className="w-48 border-[hsl(0_0%_25%)] bg-[hsl(0_0%_13%)] text-[hsl(0_0%_85%)]">
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
                  <div className="flex-1">
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
