import { z } from "zod";

/** Vehicle database entry — used by admin vehicle management (UI later) */
export const VehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name is required").max(100),
  plateNumber: z.string().min(1, "Plate number is required").max(30),
  fuelType: z.enum(["petrol", "diesel", "cng", "electric", "hybrid", "other"]),
  status: z.enum(["active", "inactive", "maintenance"]),
});

export type VehicleInput = z.infer<typeof VehicleSchema>;
