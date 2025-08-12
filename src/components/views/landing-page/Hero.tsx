import Link from "next/link";
import { ArrowRight, Sparkles, Home, Building2, MapPin } from "lucide-react";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { BoxReveal } from "@/components/magicui/box-reveal";
import { ShineBorder } from "@/components/magicui/shine-border";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

export default function Hero() {
  return (
    <section className="relative py-10 md:py-16 lg:py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <ShineBorder className="p-8 rounded-2xl">
            <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Floating badge */}
              <BlurFade>
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-background/50 px-6 py-2 mb-8 shadow-glow backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-primary mr-2" />
                  <SparklesText text="Plataforma Líder en Bienes Raíces" />
                </div>
              </BlurFade>

              <BoxReveal>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                  Encuentra tu
                  <br />
                  <span className="text-primary">Propiedad Ideal</span>
                </h1>
              </BoxReveal>

              <BlurFade delay={0.2}>
                <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto">
                  Explora nuestra amplia selección de propiedades en venta y
                  alquiler. Conectamos compradores con los mejores agentes
                  inmobiliarios.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                  <ShimmerButton>
                    <Link
                      href="/#properties"
                      className="inline-flex items-center px-8 py-3 text-lg font-medium"
                    >
                      Ver Propiedades
                      <ArrowRight
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                        size={20}
                      />
                    </Link>
                  </ShimmerButton>

                  <Link
                    href="/#features"
                    className="inline-flex items-center text-foreground hover:text-primary transition-colors px-8 py-3"
                  >
                    Conoce Más
                  </Link>
                </div>
              </BlurFade>
            </div>

            {/* Stats section with enhanced styling */}
            <div className="mt-10 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 max-w-3xl mx-auto">
              {[
                { label: "Propiedades Activas", value: "500+", icon: Home },
                {
                  label: "Agentes Certificados",
                  value: "50+",
                  icon: Building2,
                },
                { label: "Ciudades Cubiertas", value: "25+", icon: MapPin },
              ].map((stat, i) => (
                <BlurFade
                  key={stat.label}
                  delay={i * 0.1}
                  className="flex flex-col items-center p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300"
                >
                  <stat.icon className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </BlurFade>
              ))}
            </div>
          </ShineBorder>
        </div>
      </div>
    </section>
  );
}
