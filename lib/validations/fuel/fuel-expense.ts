import { z } from "zod";

/** Fuel expense entry — used by the fuel report form (UI later) */
export const FuelExpenseSchema = z.object({
  expenseDate: z.string().min(1, "Date is required"),
  vehicleId: z.string().uuid("Select a vehicle"),
  driverName: z.string().min(1, "Driver name is required").max(100),
  odometerReading: z
    .string()
    .min(1, "Odometer reading is required")
    .refine((v) => Number(v) >= 0, "Odometer must be 0 or greater"),
  liters: z
    .string()
    .min(1, "Liters is required")
    .refine((v) => Number(v) > 0, "Liters must be greater than 0"),
  pricePerLiter: z
    .string()
    .min(1, "Price per liter is required")
    .refine((v) => Number(v) >= 0, "Price must be 0 or greater"),
  totalAmount: z
    .string()
    .min(1, "Total amount is required")
    .refine((v) => Number(v) >= 0, "Total must be 0 or greater"),
  notes: z.string().max(500).optional(),
});

export type FuelExpenseInput = z.infer<typeof FuelExpenseSchema>;
