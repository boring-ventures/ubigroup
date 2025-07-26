import { Search, Shield, Users, MapPin, Phone, TrendingUp } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { BlurFade } from "@/components/magicui/blur-fade";

const features = [
  {
    id: "advanced-search",
    icon: Search,
    title: "Búsqueda Avanzada",
    description:
      "Encuentra tu propiedad ideal con filtros avanzados por ubicación, precio, características y más.",
  },
  {
    id: "verified-properties",
    icon: Shield,
    title: "Propiedades Verificadas",
    description:
      "Todas nuestras propiedades son verificadas y aprobadas por administradores certificados.",
  },
  {
    id: "expert-agents",
    icon: Users,
    title: "Agentes Expertos",
    description:
      "Conecta con agentes inmobiliarios profesionales y certificados para obtener la mejor asesoría.",
  },
  {
    id: "location-coverage",
    icon: MapPin,
    title: "Amplia Cobertura",
    description:
      "Propiedades disponibles en múltiples ciudades y estados con información detallada de ubicación.",
  },
  {
    id: "direct-contact",
    icon: Phone,
    title: "Contacto Directo",
    description:
      "Comunícate directamente con los agentes por teléfono o WhatsApp para obtener información inmediata.",
  },
  {
    id: "market-insights",
    icon: TrendingUp,
    title: "Información de Mercado",
    description:
      "Accede a datos actualizados del mercado inmobiliario y tendencias de precios en tiempo real.",
  },
].map((feature, index) => ({
  ...feature,
  animationDelay: index * 100,
}));

export default function Features() {
  return (
    <section id="features" className="relative py-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/20 -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade className="text-center mb-16">
          <AnimatedShinyText>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ¿Por Qué Elegir UbiGroup?
            </h2>
          </AnimatedShinyText>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las ventajas de nuestra plataforma inmobiliaria y encuentra
            la propiedad perfecta con la ayuda de expertos certificados.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <ShineBorder
              key={feature.id}
              duration={10}
              className="group relative backdrop-blur-sm rounded-xl overflow-hidden animate-in fade-in-0 duration-1000"
              borderWidth={1}
              color="rgba(var(--primary), 0.5)"
            >
              <div
                className="relative p-8"
                style={{ animationDelay: `${feature.animationDelay}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </ShineBorder>
          ))}
        </div>
      </div>
    </section>
  );
}
