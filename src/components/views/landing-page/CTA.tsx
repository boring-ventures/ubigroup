import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para encontrar tu hogar ideal?
          </h2>
          <p className="text-xl mb-8">
            Únete a UbiGroup hoy y comienza tu viaje hacia encontrar la
            propiedad perfecta.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center bg-primary-foreground text-primary px-8 py-3 rounded-md text-lg font-medium hover:bg-primary-foreground/90 transition-colors"
          >
            Comenzar Ahora
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
