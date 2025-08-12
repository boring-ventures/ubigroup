import { CheckCircle } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";
import { BlurFade } from "@/components/magicui/blur-fade";
import { SparklesText } from "@/components/magicui/sparkles-text";

export default function About() {
  return (
    <section id="about" className="py-20 bg-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <BlurFade className="max-w-3xl mx-auto text-center">
          <SparklesText text="About POSITIVE-Next"></SparklesText>
          <p className="text-lg text-muted-foreground mb-12">
            POSITIVE-Next is a revolutionary app designed to help you harness
            the power of your mind. Our mission is to empower individuals to
            overcome mental saboteurs and achieve their full potential.
          </p>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <ShineBorder
            className="space-y-6 p-8 rounded-xl"
            borderWidth={1}
            color="rgba(var(--primary), 0.5)"
          >
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Why Choose POSITIVE-Next?
            </h3>
            {[
              { id: "science", text: "Science-based approach" },
              { id: "personal", text: "Personalized experience" },
              { id: "progress", text: "Track your progress" },
              { id: "expert", text: "Expert guidance" },
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
                Our Vision
              </h3>
              <p className="text-muted-foreground">
                We envision a world where everyone has the tools and knowledge
                to cultivate a positive, resilient mindset. Through
                POSITIVE-Next, we&apos;re making mental fitness accessible and
                engaging for all.
              </p>
            </BlurFade>
          </ShineBorder>
        </div>
      </div>
    </section>
  );
}
