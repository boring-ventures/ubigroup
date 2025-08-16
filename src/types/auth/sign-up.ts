import { z } from "zod";

export const signUpFormSchema = z
  .object({
    email: z.string().email(),
    firstName: z.string().min(2).max(30),
    lastName: z.string().min(2).max(30),
    phone: z.string().min(10).max(20).optional(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpFormSchema>;

export type SignUpFormProps = React.HTMLAttributes<HTMLDivElement>;
