import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FUEL_TYPE_LABELS: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
  electric: "Electric",
  hybrid: "Hybrid",
  other: "Other",
};

export function formatFuelType(fuelType: string | null | undefined): string {
  if (!fuelType) return "Petrol";
  const key = fuelType.trim().toLowerCase();
  return FUEL_TYPE_LABELS[key] ?? fuelType;
}

const VEHICLE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  maintenance: "Maintenance",
};

export function formatVehicleStatus(status: string | null | undefined): string {
  if (!status) return "Active";
  const key = status.trim().toLowerCase();
  return VEHICLE_STATUS_LABELS[key] ?? status;
}

export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatDecimalAmountString(value: number): string {
  return roundToTwoDecimals(value).toFixed(2).replace(/\.?0+$/, "") || "0";
}

export function formatEuroAmount(
  amount: number | string | null | undefined,
): string {
  const numericValue =
    typeof amount === "string"
      ? Number(amount.replace(/,/g, ""))
      : Number(amount ?? 0);

  const value = Number.isFinite(numericValue)
    ? roundToTwoDecimals(numericValue)
    : 0;

  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatLiters(
  liters: number | string | null | undefined,
): string {
  const num = typeof liters === "string" ? Number(liters) : Number(liters ?? 0);
  if (!Number.isFinite(num)) return "0 L";
  return `${num.toLocaleString("en-IE", { maximumFractionDigits: 2 })} L`;
}

export function formatKm(
  distance: number | string | null | undefined,
): string {
  const num = typeof distance === "string" ? Number(distance) : Number(distance ?? 0);
  if (!Number.isFinite(num)) return "0 km";
  return `${num.toLocaleString("en-IE", { maximumFractionDigits: 1 })} km`;
}

export function formatConsumption(
  litersPer100Km: number | string | null | undefined,
): string {
  const num = typeof litersPer100Km === "string" ? Number(litersPer100Km) : Number(litersPer100Km ?? 0);
  if (!Number.isFinite(num) || num <= 0) return "—";
  return `${num.toFixed(1)} L/100km`;
}

export function getDriverNameFromUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const metadata = user.user_metadata ?? {};
  const firstName =
    typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const lastName =
    typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (fullName) return fullName;

  if (user.email) {
    return user.email.split("@")[0] ?? user.email;
  }

  return "";
}

