"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  VehicleSchema,
  type VehicleInput,
} from "@/lib/validations/fuel/vehicle";
import { createVehicle, updateVehicle } from "@/lib/services/vehicles";
import type { FormattedVehicle } from "@/types";
import { toast } from "sonner";

const FUEL_TYPES = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
  { value: "other", label: "Other" },
] as const;

const VEHICLE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "maintenance", label: "Maintenance" },
] as const;

interface VehicleDialogProps {
  vehicle?: FormattedVehicle | null;
  onSuccess: () => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VehicleDialog({
  vehicle,
  onSuccess,
  trigger,
  isOpen: externalOpen,
  onOpenChange: setExternalOpen,
}: VehicleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (setExternalOpen ?? (() => {})) : setInternalOpen;

  const isEditing = Boolean(vehicle);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(VehicleSchema),
    defaultValues: {
      name: "",
      plateNumber: "",
      fuelType: "petrol",
      status: "active",
    },
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        name: vehicle.name,
        plateNumber: vehicle.plateNumber,
        fuelType: vehicle.fuelType,
        status: vehicle.status,
      });
    } else {
      reset({
        name: "",
        plateNumber: "",
        fuelType: "petrol",
        status: "active",
      });
    }
  }, [vehicle, reset, open]);

  const onSubmit = async (data: VehicleInput) => {
    try {
      if (isEditing && vehicle) {
        const result = await updateVehicle(vehicle.id, data);
        if (!result.success) {
          toast.error("Failed to update vehicle", { description: result.message });
          return;
        }
        toast.success("Vehicle updated successfully");
      } else {
        const result = await createVehicle(data);
        if (!result.success) {
          toast.error("Failed to add vehicle", { description: result.message });
          return;
        }
        toast.success("Vehicle added successfully");
      }

      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error("Vehicle submit error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button className="h-10 rounded-xl font-bold gap-2">
            {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isEditing ? "Edit Vehicle" : "Add Vehicle"}</span>
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[480px] max-h-[min(90vh,720px)] overflow-y-auto rounded-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditing
                ? "Update vehicle details, fuel type, and operational status."
                : "Register a new vehicle to the fleet database."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4 py-2">
            {/* Vehicle Name */}
            <Field className="space-y-1.5">
              <FieldLabel className="text-sm font-semibold text-foreground">
                Vehicle Name / Model
              </FieldLabel>
              <Input
                {...register("name")}
                placeholder="e.g. Toyota Prius, Ford Transit"
                className="h-11"
                disabled={isSubmitting}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            {/* Plate Number */}
            <Field className="space-y-1.5">
              <FieldLabel className="text-sm font-semibold text-foreground">
                Plate Number / License
              </FieldLabel>
              <Input
                {...register("plateNumber")}
                placeholder="e.g. ABC-1234"
                className="h-11 uppercase"
                disabled={isSubmitting}
              />
              {errors.plateNumber && (
                <FieldError>{errors.plateNumber.message}</FieldError>
              )}
            </Field>

            {/* Fuel Type & Status row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field className="space-y-1.5">
                <FieldLabel className="text-sm font-semibold text-foreground">
                  Fuel Type
                </FieldLabel>
                <Controller
                  name="fuelType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select Fuel Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.fuelType && (
                  <FieldError>{errors.fuelType.message}</FieldError>
                )}
              </Field>

              <Field className="space-y-1.5">
                <FieldLabel className="text-sm font-semibold text-foreground">
                  Status
                </FieldLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <FieldError>{errors.status.message}</FieldError>
                )}
              </Field>
            </div>
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
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              <span>{isEditing ? "Save Changes" : "Add Vehicle"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
