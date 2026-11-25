"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  FuelExpenseSchema,
  type FuelExpenseInput,
} from "@/lib/validations/fuel/fuel-expense";
import { updateFuelExpense } from "@/lib/services/fuel/fuel-expenses";
import { fetchAllVehicles } from "@/lib/services/vehicles";
import { roundToTwoDecimals } from "@/lib/utils";
import type { AdminFuelExpense, FormattedVehicle } from "@/types";
import { toast } from "sonner";

function toFormValues(expense: AdminFuelExpense): FuelExpenseInput {
  return {
    expenseDate: expense.date === "N/A" ? "" : expense.date,
    vehicleId: expense.vehicleId,
    driverName: expense.driver === "Unknown Driver" ? "" : expense.driver,
    odometerReading: String(expense.odometer),
    liters: String(expense.liters),
    pricePerLiter: String(expense.pricePerLiter),
    totalAmount: String(expense.totalAmount),
    notes: expense.rawNotes,
  };
}

interface EditFuelExpenseButtonProps {
  expense: AdminFuelExpense;
  onSaved: () => void;
}

/** Admin-only: pencil button that opens a dialog to edit a driver's fuel expense. */
export function EditFuelExpenseButton({ expense, onSaved }: EditFuelExpenseButtonProps) {
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState<FormattedVehicle[]>([]);
  const [isVehiclesLoading, setIsVehiclesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FuelExpenseInput>({
    resolver: zodResolver(FuelExpenseSchema),
    defaultValues: toFormValues(expense),
  });

  const openDialog = () => {
    reset(toFormValues(expense));
    setOpen(true);
    setIsVehiclesLoading(true);
    fetchAllVehicles()
      .then(({ data }) => {
        if (data) setVehicles(data);
      })
      .finally(() => setIsVehiclesLoading(false));
  };

  // Same rule as the driver form: price per liter = total / liters.
  // Only runs when the admin edits liters or total, so untouched records keep their stored price.
  const recalculatePrice = () => {
    const l = parseFloat(getValues("liters") || "0");
    const t = parseFloat(getValues("totalAmount") || "0");
    if (!isNaN(l) && !isNaN(t) && l > 0 && t > 0) {
      setValue("pricePerLiter", String(roundToTwoDecimals(t / l)), { shouldValidate: true });
    }
  };

  const litersField = register("liters", { onChange: recalculatePrice });
  const totalField = register("totalAmount", { onChange: recalculatePrice });

  const onSubmit = async (data: FuelExpenseInput) => {
    const result = await updateFuelExpense(expense.id, {
      expense_date: data.expenseDate,
      vehicle_id: data.vehicleId,
      driver_name: data.driverName.trim(),
      odometer_reading: parseFloat(data.odometerReading),
      liters: parseFloat(data.liters),
      price_per_liter: parseFloat(data.pricePerLiter),
      total_amount: parseFloat(data.totalAmount),
      notes: data.notes?.trim() || null,
    });

    if (!result.success) {
      toast.error("Failed to update fuel expense", { description: result.message });
      return;
    }

    toast.success("Fuel expense updated");
    setOpen(false);
    onSaved();
  };

  const vehicleInList = vehicles.some((v) => v.id === expense.vehicleId);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Edit expense on ${expense.date}`}
        title="Edit"
        onClick={openDialog}
        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={(next) => !isSubmitting && setOpen(next)}>
        <DialogContent className="sm:max-w-[520px] max-h-[min(90vh,760px)] overflow-y-auto rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Edit Fuel Expense
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Correct this driver submission. The record stays linked to the driver who sent it.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field className="space-y-1.5">
                  <FieldLabel className="text-sm font-semibold text-foreground">Date</FieldLabel>
                  <Input
                    type="date"
                    {...register("expenseDate")}
                    className="h-11 rounded-xl"
                    disabled={isSubmitting}
                  />
                  {errors.expenseDate && <FieldError>{errors.expenseDate.message}</FieldError>}
                </Field>

                <Field className="space-y-1.5">
                  <FieldLabel className="text-sm font-semibold text-foreground">Driver Name</FieldLabel>
                  <Input
                    {...register("driverName")}
                    className="h-11 rounded-xl"
                    disabled={isSubmitting}
                  />
                  {errors.driverName && <FieldError>{errors.driverName.message}</FieldError>}
                </Field>
              </div>

              <Field className="space-y-1.5">
                <FieldLabel className="text-sm font-semibold text-foreground">Vehicle</FieldLabel>
                <Controller
                  name="vehicleId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || isVehiclesLoading}
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl">
                        <SelectValue
                          placeholder={isVehiclesLoading ? "Loading vehicles..." : "Select vehicle"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!vehicleInList && (
                          <SelectItem value={expense.vehicleId}>
                            {expense.vehicleName} ({expense.plateNumber})
                          </SelectItem>
                        )}
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} ({v.plateNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.vehicleId && <FieldError>{errors.vehicleId.message}</FieldError>}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field className="space-y-1.5">
                  <FieldLabel className="text-sm font-semibold text-foreground">Total Amount (€)</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    {...totalField}
                    className="h-11 rounded-xl font-semibold"
                    disabled={isSubmitting}
                  />
                  {errors.totalAmount && <FieldError>{errors.totalAmount.message}</FieldError>}
                </Field>

                <Field className="space-y-1.5">
                  <FieldLabel className="text-sm font-semibold text-foreground">Liters</FieldLabel>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    inputMode="decimal"
                    {...litersField}
                    className="h-11 rounded-xl"
                    disabled={isSubmitting}
                  />
                  {errors.liters && <FieldError>{errors.liters.message}</FieldError>}
                </Field>

                <Field className="space-y-1.5">
                  <FieldLabel className="text-sm font-semibold text-foreground">Price / Liter (€)</FieldLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    inputMode="decimal"
                    {...register("pricePerLiter")}
                    className="h-11 rounded-xl"
                    disabled={isSubmitting}
                  />
                  {errors.pricePerLiter && <FieldError>{errors.pricePerLiter.message}</FieldError>}
                </Field>

                <Field className="space-y-1.5">
                  <FieldLabel className="text-sm font-semibold text-foreground">Odometer (km)</FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    {...register("odometerReading")}
                    className="h-11 rounded-xl"
                    disabled={isSubmitting}
                  />
                  {errors.odometerReading && <FieldError>{errors.odometerReading.message}</FieldError>}
                </Field>
              </div>

              <Field className="space-y-1.5">
                <FieldLabel className="text-sm font-semibold text-foreground">Notes</FieldLabel>
                <Textarea
                  {...register("notes")}
                  rows={3}
                  className="rounded-xl"
                  disabled={isSubmitting}
                />
                {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
              </Field>
            </FieldGroup>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl font-semibold sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl font-semibold sm:w-auto"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                <span>Save Changes</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
