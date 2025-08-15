"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, ArrowLeft } from "lucide-react";

const schema = z.object({
  ownerName: z.string().min(2, "Nombre demasiado corto"),
  ownerPhone: z
    .string()
    .min(6, "Número inválido")
    .regex(/^[+0-9()\s-]+$/, "Solo números y + - ( )"),
  propertyType: z.enum(["HOUSE", "APARTMENT", "OFFICE", "LAND"], {
    required_error: "Selecciona un tipo",
  }),
  city: z.string().min(2, "Ciudad requerida"),
  neighborhood: z.string().optional(),
  // operation omitted per request
  price: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CapturePropertyPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ownerName: "",
      ownerPhone: "",
      propertyType: undefined as unknown as FormValues["propertyType"],
      city: "",
      neighborhood: "",
      price: "",
      description: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    const companyWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!companyWhatsApp) {
      alert("Falta configurar NEXT_PUBLIC_WHATSAPP_NUMBER en el entorno.");
      return;
    }

    const message = encodeURIComponent(
      `Nueva Captura de Propiedad\n\n` +
        `Nombre: ${values.ownerName}\n` +
        `Teléfono: ${values.ownerPhone}\n` +
        `Tipo: ${values.propertyType}\n` +
        `Ciudad: ${values.city}${values.neighborhood ? `, ${values.neighborhood}` : ""}\n` +
        `${values.price ? `Precio aprox.: ${values.price}\n` : ""}` +
        `${values.description ? `Detalle: ${values.description}\n` : ""}`
    );

    const wa = `https://wa.me/${companyWhatsApp.replace(/\D/g, "")}?text=${message}`;
    window.open(wa, "_blank");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-background dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto mb-4">
          <Button
            variant="outline"
            className="inline-flex items-center text-foreground border-border hover:bg-accent"
            onClick={() => router.back()}
            aria-label="Volver"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card className="max-w-3xl mx-auto bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Capturar propiedad
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Completa los datos y enviaremos la información por WhatsApp al
              equipo de UbiGroup.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-foreground">
            <Form {...form}>
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                onSubmit={form.handleSubmit(handleSubmit)}
              >
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-foreground">
                        Tu nombre
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
                  name="ownerPhone"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-foreground">
                        Tu WhatsApp
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+591 70000000"
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-muted-foreground">
                        Incluye el código de país.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Tipo de propiedad
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background border-border text-foreground">
                            <SelectValue placeholder="Selecciona un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border-border">
                          <SelectItem
                            value="HOUSE"
                            className="text-foreground hover:bg-accent"
                          >
                            Casa
                          </SelectItem>
                          <SelectItem
                            value="APARTMENT"
                            className="text-foreground hover:bg-accent"
                          >
                            Departamento
                          </SelectItem>
                          <SelectItem
                            value="OFFICE"
                            className="text-foreground hover:bg-accent"
                          >
                            Oficina
                          </SelectItem>
                          <SelectItem
                            value="LAND"
                            className="text-foreground hover:bg-accent"
                          >
                            Terreno
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Ciudad</FormLabel>
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

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Barrio/Zona (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Equipetrol"
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        Precio aproximado (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 120,000 USD"
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
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-foreground">
                        Descripción (opcional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cuéntanos detalles importantes (m2, habitaciones, estado, etc.)"
                          rows={5}
                          className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" className="inline-flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar por WhatsApp
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
