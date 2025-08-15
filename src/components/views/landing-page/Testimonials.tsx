import { Star } from "lucide-react";

const testimonials = [
  {
    id: "t1",
    quote:
      "POSITIVE-Next has completely transformed my mindset. I'm more productive and happier than ever!",
    author: "Sarah J., Entrepreneur",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "As a CEO, mental fitness is crucial. This app has been a game-changer for my leadership skills.",
    author: "Michael R., CEO",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "I've tried many self-improvement apps, but POSITIVE-Next stands out with its practical approach.",
    author: "Emily L., Life Coach",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
          What Our Users Say
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-card rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-700"
              style={{
                animationDelay: `${Number(testimonial.id.slice(1)) * 100}ms`,
              }}
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={`${testimonial.id}-star-${i}`}
                    className="h-5 w-5 text-primary fill-current"
                  />
                ))}
              </div>
              <p className="text-foreground mb-4">
                &quot;{testimonial.quote}&quot;
              </p>
              <p className="text-primary font-semibold">{testimonial.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
