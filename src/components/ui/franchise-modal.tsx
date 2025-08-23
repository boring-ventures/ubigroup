"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Mail, User, MapPin } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nombre demasiado corto"),
  email: z.string().email("Email inválido"),
  city: z.string().min(2, "Ciudad requerida"),
});

type FormValues = z.infer<typeof schema>;

interface FranchiseModalProps {
  children: React.ReactNode;
}

export function FranchiseModal({ children }: FranchiseModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      city: "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Here you would typically send the data to your API
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Send WhatsApp message
      const companyWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
      if (companyWhatsApp) {
        const message = encodeURIComponent(
          `🏢 *Solicitud de Franquicia UbiGroup*\n\n` +
            `👋 *Hola! Soy ${values.name}*\n` +
            `📧 *Email:* ${values.email}\n` +
            `🏙️ *Ciudad:* ${values.city}\n\n` +
            `✨ *Estoy interesado en:*\n` +
            `• Conocer más sobre las franquicias UbiGroup\n` +
            `• Información sobre inversión y requisitos\n` +
            `• Proceso de apertura de franquicia\n\n` +
            `📞 *Por favor contáctenme para más detalles*\n` +
            `Gracias! 🙏`
        );

        const wa = `https://wa.me/${companyWhatsApp.replace(/\D/g, "")}?text=${message}`;
        window.open(wa, "_blank");
      }

      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Solicitud de Franquicia
          </DialogTitle>
          <DialogDescription>
            Completa el formulario y nos pondremos en contacto contigo para
            discutir las oportunidades de franquicia.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombre completo
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Juan Pérez"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="juan@ejemplo.com"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ciudad
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Santa Cruz"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
