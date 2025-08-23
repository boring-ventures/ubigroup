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
  Calculator,
  MessageCircle,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function AppraisalSection() {
  const handleAppraisalClick = () => {
    const companyWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!companyWhatsApp) {
      alert("Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER en el entorno.");
      return;
    }

    const message = encodeURIComponent(
      `🏠 *Solicitud de Tasación UbiGroup*\n\n` +
        `👋 *Hola! Necesito una tasación de mi propiedad*\n\n` +
        `✨ *Me gustaría:*\n` +
        `• Obtener una tasación profesional de mi propiedad\n` +
        `• Conocer el valor real de mercado\n` +
        `• Información sobre el proceso de tasación\n` +
        `• Asesoría para optimizar el valor\n\n` +
        `📞 *Por favor contáctenme para coordinar la visita*\n` +
        `Gracias! 🙏`
    );

    const wa = `https://wa.me/${companyWhatsApp.replace(/\D/g, "")}?text=${message}`;
    window.open(wa, "_blank");
  };

  return (
    <section id="appraisal" className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Avalúos Inmobiliarios
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            En UbiGroup realizamos avalúos profesionales que determinan el valor
            real de tu propiedad, basados en estudios de mercado y estándares
            técnicos confiables.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <ShineBorder className="p-1 rounded-2xl">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-0">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    Tasación de Propiedad
                  </CardTitle>
                </div>
                <CardDescription className="text-base">
                  Obtén una evaluación profesional y precisa del valor de tu
                  propiedad con nuestro equipo de expertos tasadores
                  certificados.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Tasación profesional certificada</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Resultados en 24-48 horas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>Análisis de mercado actualizado</span>
                  </div>
                </div>

                <Button
                  onClick={handleAppraisalClick}
                  className="w-full group-hover:bg-primary/90 transition-colors duration-300"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Solicitar tasación
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
