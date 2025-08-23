"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ShineBorder } from "@/components/magicui/shine-border";
import {
  Users,
  Building2,
  MessageCircle,
  ArrowRight,
  Star,
  TrendingUp,
} from "lucide-react";

export default function OpportunitiesSection() {
  const handleAgentClick = () => {
    const companyWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!companyWhatsApp) {
      alert("Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER en el entorno.");
      return;
    }

    const message = encodeURIComponent(
      `👨‍💼 *Solicitud para ser Agente UbiGroup*\n\n` +
        `👋 *Hola! Estoy interesado en ser agente*\n\n` +
        `✨ *Me gustaría:*\n` +
        `• Conocer el proceso para ser agente\n` +
        `• Información sobre comisiones y beneficios\n` +
        `• Requisitos y capacitación necesaria\n` +
        `• Oportunidades de crecimiento\n\n` +
        `📞 *Por favor contáctenme para más detalles*\n` +
        `Gracias! 🙏`
    );

    const wa = `https://wa.me/${companyWhatsApp.replace(/\D/g, "")}?text=${message}`;
    window.open(wa, "_blank");
  };

  const handleFranchiseClick = () => {
    const companyWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!companyWhatsApp) {
      alert("Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER en el entorno.");
      return;
    }

    const message = encodeURIComponent(
      `🏢 *Solicitud de Franquicia UbiGroup*\n\n` +
        `👋 *Hola! Estoy interesado en abrir una franquicia*\n\n` +
        `✨ *Me gustaría:*\n` +
        `• Conocer más sobre las franquicias UbiGroup\n` +
        `• Información sobre inversión y requisitos\n` +
        `• Proceso de apertura de franquicia\n` +
        `• Oportunidades de mercado\n\n` +
        `📞 *Por favor contáctenme para más detalles*\n` +
        `Gracias! 🙏`
    );

    const wa = `https://wa.me/${companyWhatsApp.replace(/\D/g, "")}?text=${message}`;
    window.open(wa, "_blank");
  };

  return (
    <section id="opportunities" className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Únete a UbiGroup
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre las oportunidades para crecer con nosotros. Ya sea como
            agente o franquiciado, tenemos el programa perfecto para ti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Agent Card */}
          <ShineBorder className="p-1 rounded-2xl">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Sé un Agente</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Únete a nuestro equipo de agentes inmobiliarios y construye tu
                  carrera profesional
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Comisiones competitivas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Capacitación continua</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Apoyo de equipo</span>
                  </div>
                </div>

                <Button
                  onClick={handleAgentClick}
                  className="w-full group-hover:bg-primary/90 transition-colors duration-300"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Quiero ser agente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </ShineBorder>

          {/* Franchise Card */}
          <ShineBorder className="p-1 rounded-2xl">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Abre tu Franquicia</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Convierte tu pasión por el sector inmobiliario en tu propio
                  negocio con UbiGroup
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>Modelo probado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Alto potencial de crecimiento</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Soporte completo</span>
                  </div>
                </div>

                <Button
                  onClick={handleFranchiseClick}
                  className="w-full group-hover:bg-primary/90 transition-colors duration-300"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Solicitar información
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </ShineBorder>
        </div>
      </div>
    </section>
  );
}
