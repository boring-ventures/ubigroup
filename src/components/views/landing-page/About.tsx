import { CheckCircle } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";
import { BlurFade } from "@/components/magicui/blur-fade";
import { SparklesText } from "@/components/magicui/sparkles-text";

export default function About() {
  return (
    <section id="about" className="py-20 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade className="max-w-3xl mx-auto text-center">
          <SparklesText text="Acerca de UbiGroup"></SparklesText>
          <p className="text-lg text-muted-foreground mb-12">
            UbiGroup es una plataforma revolucionaria diseñada para ayudarte a
            encontrar tu propiedad ideal. Nuestra misión es empoderar a las
            personas para que encuentren su hogar perfecto con confianza y
            transparencia.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <ShineBorder
            className="space-y-6 p-8 rounded-xl"
            borderWidth={1}
            color="rgba(var(--primary), 0.5)"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              ¿Por qué elegir UbiGroup?
            </h3>
            {[
              { id: "science", text: "Enfoque basado en la confianza" },
              { id: "personal", text: "Experiencia personalizada" },
              { id: "progress", text: "Seguimiento de tu búsqueda" },
              { id: "expert", text: "Orientación experta" },
            ].map((item) => (
              <BlurFade key={item.id} className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-primary" />
                <span className="text-foreground">{item.text}</span>
              </BlurFade>
            ))}
          </ShineBorder>

          <ShineBorder
            className="bg-primary/10 rounded-xl p-8"
            borderWidth={1}
            color="rgba(var(--primary), 0.5)"
          >
            <BlurFade>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Nuestra Visión
              </h3>
              <p className="text-muted-foreground">
                Visualizamos un mundo donde todos tengan las herramientas y el
                conocimiento para encontrar su hogar ideal. A través de
                UbiGroup, estamos haciendo la búsqueda de propiedades accesible
                y confiable para todos.
              </p>
            </BlurFade>
          </ShineBorder>
        </div>
      </div>
    </section>
  );
}
