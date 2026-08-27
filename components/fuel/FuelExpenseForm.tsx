"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar as CalendarIcon,
  Car,
  Fuel,
  Gauge,
  DollarSign,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { cn, getDriverNameFromUser, roundToTwoDecimals } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  FuelExpenseSchema,
  type FuelExpenseInput,
} from "@/lib/validations/fuel/fuel-expense";
import { fetchActiveVehicles } from "@/lib/services/vehicles";
import { supabase } from "@/lib/supabase/client";
import { redirectAfterAuth } from "@/lib/auth";
import { toast } from "sonner";
import { FormattedVehicle } from "@/types";

function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function FuelExpenseForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [vehicles, setVehicles] = useState<FormattedVehicle[]>([]);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FuelExpenseInput>({
    resolver: zodResolver(FuelExpenseSchema),
    defaultValues: {
      expenseDate: getTodayDateString(),
      vehicleId: "",
      driverName: "",
      odometerReading: "",
      liters: "",
      pricePerLiter: "",
      totalAmount: "",
      notes: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- live total sync requires watch()
  const litersValue = watch("liters");
  const priceValue = watch("pricePerLiter");
  const totalValue = watch("totalAmount");

  // Auto-calculate Total Amount when liters or price change
  useEffect(() => {
    const l = parseFloat(litersValue || "0");
    const p = parseFloat(priceValue || "0");

    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      const calculatedTotal = String(roundToTwoDecimals(l * p));
      if (calculatedTotal !== totalValue) {
        setValue("totalAmount", calculatedTotal, { shouldValidate: true });
      }
    } else if (!litersValue || !priceValue) {
      if (totalValue !== "") {
        setValue("totalAmount", "", { shouldValidate: false });
      }
    }
  }, [litersValue, priceValue, setValue, totalValue]);

  // Total Amount manually change karne ke liye handler
  const handleTotalManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("totalAmount", val, { shouldValidate: true });

    const t = parseFloat(val || "0");
    const l = parseFloat(litersValue || "0");

    if (!isNaN(t) && !isNaN(l) && l > 0 && t > 0) {
      const calculatedPrice = String(roundToTwoDecimals(t / l));
      setValue("pricePerLiter", calculatedPrice, { shouldValidate: true });
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsVehiclesLoading(true);

        const [userRes, vehiclesRes] = await Promise.all([
          supabase.auth.getUser(),
          fetchActiveVehicles(),
        ]);

        if (userRes.data?.user) {
          const name = getDriverNameFromUser(userRes.data.user);
          if (name) {
            setValue("driverName", name, { shouldValidate: true });
          }
        }

        if (vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
          if (vehiclesRes.data.length > 0) {
            setValue("vehicleId", vehiclesRes.data[0].id, { shouldValidate: true });
          }
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
      }  finally {
        setIsVehiclesLoading(false);
      }
    }

    void loadInitialData();
  }, [setValue]);

  const onSubmit = async (data: FuelExpenseInput) => {
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please login first to submit fuel expense.");
        router.push("/login");
        return;
      }

      const { error: insertError } = await supabase.from("fuel_expenses").insert([
        {
          user_id: user.id,
          vehicle_id: data.vehicleId,
          expense_date: data.expenseDate,
          driver_name: data.driverName.trim(),
          odometer_reading: parseFloat(data.odometerReading),
          liters: parseFloat(data.liters),
          price_per_liter: parseFloat(data.pricePerLiter),
          total_amount: parseFloat(data.totalAmount),
          notes: data.notes?.trim() || null,
        },
      ]);

      if (insertError) {
        setError(insertError.message);
        toast.error("Failed to submit expense", { description: insertError.message });
        return;
      }

      setIsRedirecting(true);
      await redirectAfterAuth(router, "/success");
    } catch (err) {
      console.error("Submission error:", err);
      setError("An unexpected error occurred while saving.");
      setIsRedirecting(false);
    }
  };

  const isLoading = isSubmitting || isRedirecting;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-2xl 2xl:max-w-3xl mx-auto space-y-5 sm:space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <Link
            href="/client-dashboard"
            className="inline-flex min-w-0 items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <Typography variant="button-medium" className="text-xs sm:text-sm truncate">
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Typography>
          </Link>
          <Logo width={120} className="shrink-0" />
        </div>

        <div className="bg-white dark:bg-card border border-grey-card-stroke rounded-2xl shadow-none p-5 sm:p-7 md:p-8 space-y-5 sm:space-y-6">
          <div className="space-y-1">
            <Typography
              variant="h2"
              as="h1"
              className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight"
            >
              Report Fuel Expense
            </Typography>
            <Typography
              variant="muted-sm"
              className="text-muted-foreground text-xs sm:text-sm"
            >
              Record fuel refills with liters, pricing, odometer readings, and notes.
            </Typography>
          </div>

          {error && (
            <div className="p-3.5 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FieldGroup className="space-y-4">
              {/* Date & Driver Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Date Picker */}
                <Field className="space-y-1.5">
                  <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Date
                  </FieldLabel>
                  <Controller
                    name="expenseDate"
                    control={control}
                    render={({ field }) => {
                      const selected = field.value
                        ? new Date(`${field.value}T00:00:00`)
                        : undefined;

                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              type="button"
                              className={cn(
                                "h-11 w-full justify-between text-left font-normal rounded-xl border-slate-200 bg-white text-xs sm:text-sm px-3 shadow-none hover:bg-white hover:text-slate-900",
                                !field.value && "text-slate-400"
                              )}
                            >
                              {field.value ? (
                                <span className="truncate pr-2">
                                  {format(selected!, "PPP")}
                                </span>
                              ) : (
                                <span className="truncate pr-2">Pick a date</span>
                              )}
                              <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 rounded-xl shadow-xl border border-slate-100"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(date) => {
                                if (!date) {
                                  field.onChange("");
                                  return;
                                }
                                const yyyy = date.getFullYear();
                                const mm = String(date.getMonth() + 1).padStart(2, "0");
                                const dd = String(date.getDate()).padStart(2, "0");
                                field.onChange(`${yyyy}-${mm}-${dd}`);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  {errors.expenseDate && (
                    <FieldError>{errors.expenseDate.message}</FieldError>
                  )}
                </Field>

                {/* Driver Name */}
                <Field className="space-y-1.5">
                  <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground">
                    Driver Name
                  </FieldLabel>
                  <Input
                    {...register("driverName")}
                    placeholder="Enter driver name"
                    className="h-11 text-xs sm:text-sm rounded-xl"
                    disabled={isLoading}
                  />
                  {errors.driverName && (
                    <FieldError>{errors.driverName.message}</FieldError>
                  )}
                </Field>
              </div>

              {/* Vehicle Selection */}
              <Field className="space-y-1.5">
                <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-primary" />
                  Vehicle
                </FieldLabel>
                <Controller
                  name="vehicleId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={
                        isLoading ||
                        isVehiclesLoading ||
                        vehicles.length === 0
                      }
                    >
                      <SelectTrigger className="h-11 w-full text-xs sm:text-sm rounded-xl">
                        <SelectValue
                          placeholder={
                            isVehiclesLoading
                              ? "Loading vehicles..."
                              : vehicles.length === 0
                                ? "No vehicles available. Contact admin."
                                : "Select Vehicle"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} • {v.plateNumber} ({v.fuelTypeLabel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.vehicleId && (
                  <FieldError>{errors.vehicleId.message}</FieldError>
                )}
              </Field>

              {/* Odometer Reading & Liters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <Field className="space-y-1.5">
                  <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-primary" />
                    Odometer Reading (km)
                  </FieldLabel>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 124500"
                    {...register("odometerReading")}
                    className="h-11 font-mono text-xs sm:text-sm rounded-xl"
                    disabled={isLoading}
                  />
                  {errors.odometerReading && (
                    <FieldError>{errors.odometerReading.message}</FieldError>
                  )}
                </Field>

                <Field className="space-y-1.5">
                  <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-primary" />
                    Fuel Volume (Liters)
                  </FieldLabel>
                  <Input
                    type="number"
                    step="any"
                    min="0.1"
                    placeholder="e.g. 45.5"
                    {...register("liters")}
                    className="h-11 font-mono text-xs sm:text-sm rounded-xl"
                    disabled={isLoading}
                  />
                  {errors.liters && (
                    <FieldError>{errors.liters.message}</FieldError>
                  )}
                </Field>
              </div>

              {/* Price Per Liter & Total Amount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <Field className="space-y-1.5">
                  <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-primary" />
                    Price per Liter (€)
                  </FieldLabel>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 1.85"
                    {...register("pricePerLiter")}
                    className="h-11 font-mono text-xs sm:text-sm rounded-xl"
                    disabled={isLoading}
                  />
                  {errors.pricePerLiter && (
                    <FieldError>{errors.pricePerLiter.message}</FieldError>
                  )}
                </Field>

                <Field className="space-y-1.5">
                  <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground">
                    Total Amount (€)
                  </FieldLabel>
                  <Controller
                    name="totalAmount"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Enter or auto-calculated"
                        className="h-11 font-mono font-bold text-xs sm:text-sm rounded-xl"
                        disabled={isLoading}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTotalManualChange(e);
                        }}
                      />
                    )}
                  />
                  {errors.totalAmount && (
                    <FieldError>{errors.totalAmount.message}</FieldError>
                  )}
                </Field>
              </div>

              {/* Optional Notes */}
              <Field className="space-y-1.5">
                <FieldLabel className="text-xs sm:text-sm font-semibold text-foreground">
                  Notes / Station Details (Optional)
                </FieldLabel>
                <Textarea
                  {...register("notes")}
                  placeholder="e.g. Shell Station Paris Nord, full tank refuel"
                  className="min-h-[80px] rounded-xl text-xs sm:text-sm"
                  disabled={isLoading}
                />
                {errors.notes && (
                  <FieldError>{errors.notes.message}</FieldError>
                )}
              </Field>
            </FieldGroup>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl text-sm font-bold shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : null}
                <Typography variant="button-semibold" className="text-white text-sm">
                  {isLoading ? "Submitting..." : "Submit Fuel Expense"}
                </Typography>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FuelExpenseForm;