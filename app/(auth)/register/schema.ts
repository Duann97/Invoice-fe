import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  fullName: z.string().min(2, "Nama minimal 2 karakter").optional(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
