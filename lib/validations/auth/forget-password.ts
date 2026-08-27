import * as z from "zod";

export const RecoverSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type RecoverInput = z.infer<typeof RecoverSchema>;