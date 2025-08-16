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

type TransactionTab = "venta" | "alquiler" | "anticretico" | "proyectos";

export const HeroSearch = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState("");
  const [transaction, setTransaction] = useState<TransactionTab>("venta");
  const [type, setType] = useState<
    "" | "HOUSE" | "APARTMENT" | "OFFICE" | "LAND"
  >("");

  // Hero image carousel (desktop)
  const carouselImages: string[] = [
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200&auto=format&fit=crop",
    "https://plus.unsplash.com/premium_photo-1684175656320-5c3f701c082c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1430285561322-7808604715df?q=80&w=1200&auto=format&fit=crop",
  ];
  const [imageIndex, setImageIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  useEffect(() => {
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
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 bg-background/70 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Encuentra tu propiedad con confianza
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold leading-[1.1] text-foreground">
              <div className="block lg:inline">
                <span className="block lg:inline">Encuentra tu</span>{" "}
                <ContainerTextFlip
                  words={[
                    "Hogar Ideal",
                    "Departamento Ideal",
                    "Casa Ideal",
                    "Oficina Ideal",
                    "Terreno Ideal",
                  ]}
                  className="block lg:inline"
                />
              </div>
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-xl">
              Busca por ciudad, barrio o tipo de propiedad. Filtra por venta o
              alquiler y empieza a explorar.
            </p>

            {/* Trust indicator */}
            <AvatarCircles
              numPeople={500}
              avatarUrls={[
                {
                  imageUrl:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                },
                {
                  imageUrl:
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                },
                {
                  imageUrl:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
                },
                {
                  imageUrl:
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
                },
                {
                  imageUrl:
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
            {carouselImages.map((img, idx) => (
              <div
                key={img}
                className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ease-in-out ${
                  idx === imageIndex ? "opacity-100" : "opacity-0"
                }`}
                style={{ backgroundImage: `url(${img})` }}
                aria-hidden={idx !== imageIndex}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            {/* Carousel dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {carouselImages.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Ir a imagen ${i + 1}`}
                  onClick={() => setImageIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-colors ${
                    i === imageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
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
