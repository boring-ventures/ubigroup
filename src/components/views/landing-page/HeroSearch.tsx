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
import { Sparkles, MapPin } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";

type TransactionTab = "venta" | "alquiler" | "anticretico";

const defaultBackground =
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

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
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
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
  }, []);

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Visual hero with image on the right and content overlay */}
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 items-center py-4 md:py-10 lg:py-12 pb-14 lg:pb-16">
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
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold leading-[1.1]">
              Encuentra tu
              <span className="text-primary"> Hogar Ideal</span>
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground max-w-xl">
              Busca por ciudad, barrio o tipo de propiedad. Filtra por venta o
              alquiler y empieza a explorar.
            </p>

            {/* Search Panel - mobile */}
            <div className="lg:hidden">
              <ShineBorder className="p-3 rounded-2xl">
                <Card className="p-5 bg-background/80 backdrop-blur-xl border-border shadow-2xl">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <Tabs
                        value={transaction}
                        onValueChange={(v) =>
                          setTransaction(v as TransactionTab)
                        }
                      >
                        <TabsList className="w-full justify-start overflow-x-auto whitespace-nowrap">
                          <TabsTrigger value="venta">Venta</TabsTrigger>
                          <TabsTrigger value="alquiler">Alquiler</TabsTrigger>
                          <TabsTrigger value="anticretico">
                            Anticrético
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
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos</SelectItem>
                          <SelectItem value="HOUSE">Casa</SelectItem>
                          <SelectItem value="APARTMENT">
                            Departamento
                          </SelectItem>
                          <SelectItem value="OFFICE">Oficina</SelectItem>
                          <SelectItem value="LAND">Terreno</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <PropertySearchBar
                      value={query}
                      onSearch={handleSearch}
                      placeholder="Buscar por ciudad, barrio o palabra clave"
                      className="flex-1"
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
              <Card className="p-6 bg-background/90 backdrop-blur-xl border-border shadow-2xl">
                <div className="flex items-center gap-4">
                  <Tabs
                    value={transaction}
                    onValueChange={(v) => setTransaction(v as TransactionTab)}
                  >
                    <TabsList className="flex-nowrap overflow-x-auto whitespace-nowrap">
                      <TabsTrigger value="venta">Venta</TabsTrigger>
                      <TabsTrigger value="alquiler">Alquiler</TabsTrigger>
                      <TabsTrigger value="anticretico">Anticrético</TabsTrigger>
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
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="HOUSE">Casa</SelectItem>
                      <SelectItem value="APARTMENT">Departamento</SelectItem>
                      <SelectItem value="OFFICE">Oficina</SelectItem>
                      <SelectItem value="LAND">Terreno</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1">
                    <PropertySearchBar
                      value={query}
                      onSearch={handleSearch}
                      placeholder="Buscar por ciudad, barrio o palabra clave"
                      className="w-full"
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
