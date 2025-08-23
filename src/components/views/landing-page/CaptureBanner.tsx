"use client";

import Link from "next/link";
import { Building2, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CaptureBanner() {
  return (
    <section
      id="capture-banner"
      className="relative py-12 md:py-16 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-primary/10 to-blue-500/10 pointer-events-none" />
      <div className="container relative">
        <div className="rounded-2xl border bg-card text-card-foreground shadow-sm p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-primary mb-3">
              <Building2 className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">
                ¡Tu propiedad merece ser vista!
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              Comercializa tu propiedad con UbiGroup
            </h3>
            <p className="text-muted-foreground mb-4">
              ¿Tienes una casa, departamento o terreno que quieres vender o
              alquilar? Nuestro equipo especializado te ayudará a encontrar el
              comprador ideal. Solo toma 2 minutos completar el formulario y te
              contactaremos personalmente.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>Asesoría personalizada</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span>Sin compromisos</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-3 w-full md:w-auto">
            <Button asChild className="w-full md:w-auto">
              <Link
                href="/capture-property"
                aria-label="Ir al formulario de captura de propiedad"
              >
                <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Cuéntanos sobre tu propiedad
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground text-center">
              Te contactaremos personalmente en menos de 24 horas
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
