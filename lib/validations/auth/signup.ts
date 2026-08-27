import { z } from "zod";

export const SignupSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name is too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Please confirm your password"),
   
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], 
  });

export type SignupInput = z.infer<typeof SignupSchema>;