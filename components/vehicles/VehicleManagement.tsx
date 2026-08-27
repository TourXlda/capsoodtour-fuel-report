"use client";

import { useState } from "react";
import { Car, CheckCircle2, AlertTriangle, XCircle, Plus, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { GenericTable, type ColumnConfig } from "@/components/dashboard/GenericTable";
import { DeleteRecordButton } from "@/components/dashboard/DeleteRecordButton";
import { VehicleDialog } from "./VehicleDialog";
import { deleteVehicle, deleteVehicles } from "@/lib/services/vehicles";
import type { FormattedVehicle } from "@/types";
import { toast } from "sonner";

interface VehicleManagementProps {
  vehicles: FormattedVehicle[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function VehicleManagement({
  vehicles,
  isLoading,
  onRefresh,
}: VehicleManagementProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<FormattedVehicle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const activeCount = vehicles.filter((v) => v.status === "active").length;
  const maintenanceCount = vehicles.filter((v) => v.status === "maintenance").length;
  const inactiveCount = vehicles.filter((v) => v.status === "inactive").length;

  const handleDelete = async (vehicleId: string) => {
    try {
      setDeletingVehicleId(vehicleId);
      const result = await deleteVehicle(vehicleId);

      if (!result.success) {
        toast.error("Failed to delete vehicle", { description: result.message });
        return;
      }

      toast.success("Vehicle deleted successfully");
      setSelectedVehicleIds((prev) => {
        const next = new Set(prev);
        next.delete(vehicleId);
        return next;
      });
      onRefresh();
    } catch (err) {
      console.error("Delete vehicle error:", err);
      toast.error("Failed to delete vehicle");
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedVehicleIds);
    if (ids.length === 0) return;

    try {
      setIsBulkDeleting(true);
      const result = await deleteVehicles(ids);

      if (!result.success) {
        toast.error("Failed to delete vehicles", { description: result.message });
        return;
      }

      toast.success(`${result.deletedCount} vehicle(s) deleted successfully`);
      setSelectedVehicleIds(new Set());
      onRefresh();
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete selected vehicles");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicleIds(new Set(vehicles.map((v) => v.id)));
    } else {
      setSelectedVehicleIds(new Set());
    }
  };

  const allSelected =
    vehicles.length > 0 && vehicles.every((v) => selectedVehicleIds.has(v.id));
  const someSelected =
    vehicles.some((v) => selectedVehicleIds.has(v.id)) && !allSelected;
  const selectedCount = selectedVehicleIds.size;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
            <AlertTriangle className="w-3 h-3" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/60 shrink-0">
            <XCircle className="w-3 h-3" />
            Inactive
          </span>
        );
    }
  };

  const getFuelTypeBadge = (fuelType: string) => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
        {fuelType}
      </span>
    );
  };

  const columns: ColumnConfig<FormattedVehicle>[] = [
    {
      header: "Vehicle Name",
      accessorKey: "name",
      renderCell: (v) => (
        <span className="font-bold text-sm text-foreground">{v.name}</span>
      ),
    },
    {
      header: "Plate Number",
      accessorKey: "plateNumber",
      renderCell: (v) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200/70">
          {v.plateNumber}
        </span>
      ),
    },
    {
      header: "Fuel Type",
      accessorKey: "fuelTypeLabel",
      renderCell: (v) => getFuelTypeBadge(v.fuelTypeLabel),
    },
    {
      header: "Status",
      accessorKey: "statusLabel",
      renderCell: (v) => getStatusBadge(v.status),
    },
    {
      header: "Added Date",
      accessorKey: "createdAt",
      renderCell: (v) => (
        <Typography variant="muted-sm" className="text-muted-foreground text-sm">
          {v.createdAt}
        </Typography>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      renderCell: (v) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg text-slate-700 hover:text-primary hover:bg-primary/5 transition-all"
            onClick={() => {
              setSelectedVehicle(v);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          <DeleteRecordButton
            label={`Delete vehicle ${v.name}`}
            title="Delete vehicle?"
            description={`This will permanently remove ${v.name} (${v.plateNumber}) from the vehicle database. This action cannot be undone.`}
            isDeleting={deletingVehicleId === v.id}
            onConfirm={() => handleDelete(v.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Quick Summary Pill Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        <div className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-grey-card-stroke flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Car className="w-4 h-4 text-primary shrink-0" />
            <Typography variant="muted-sm" className="text-xs font-bold text-muted-foreground uppercase truncate">
              Total
            </Typography>
          </div>
          <span className="text-sm sm:text-base font-black text-foreground">{vehicles.length}</span>
        </div>

        <div className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-grey-card-stroke flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <Typography variant="muted-sm" className="text-xs font-bold text-muted-foreground uppercase truncate">
              Active
            </Typography>
          </div>
          <span className="text-sm sm:text-base font-black text-emerald-600">{activeCount}</span>
        </div>

        <div className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-grey-card-stroke flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <Typography variant="muted-sm" className="text-xs font-bold text-muted-foreground uppercase truncate">
              Maintenance
            </Typography>
          </div>
          <span className="text-sm sm:text-base font-black text-amber-600">{maintenanceCount}</span>
        </div>

        <div className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white dark:bg-card border border-grey-card-stroke flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <XCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <Typography variant="muted-sm" className="text-xs font-bold text-muted-foreground uppercase truncate">
              Inactive
            </Typography>
          </div>
          <span className="text-sm sm:text-base font-black text-slate-600">{inactiveCount}</span>
        </div>
      </div>

      <GenericTable
        title="Vehicle Database"
        data={vehicles}
        columns={columns}
        isLoading={isLoading}
        loadingLabel="Loading vehicles..."
        selection={{
          selectedIds: selectedVehicleIds,
          onToggle: toggleSelection,
          onToggleAll: toggleSelectAll,
          allSelected,
          someSelected,
        }}
        headerActions={
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCount > 0 && (
              <DeleteRecordButton
                label={`Delete ${selectedCount} vehicles`}
                title={`Delete ${selectedCount} vehicle${selectedCount === 1 ? "" : "s"}?`}
                description={`This will permanently remove ${selectedCount} selected vehicle${selectedCount === 1 ? "" : "s"}.`}
                isDeleting={isBulkDeleting}
                buttonText={`Delete Selected (${selectedCount})`}
                onConfirm={handleBulkDelete}
              />
            )}
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="h-10 rounded-xl font-bold gap-1.5 shadow-none"
            >
              <Plus className="w-4 h-4" />
              <Typography variant="button-semibold" className="text-white text-xs sm:text-sm">
                Add Vehicle
              </Typography>
            </Button>
          </div>
        }
        mobileRender={(v, mobile) => (
          <div
            className={`p-4 mx-3 sm:mx-4 my-3 sm:my-4 bg-white dark:bg-card border border-grey-card-stroke rounded-2xl shadow-sm space-y-3 ${
              mobile?.isSelected ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              {mobile?.selectionCheckbox}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Typography
                      variant="body-semibold"
                      className="text-foreground font-bold text-sm sm:text-base truncate block"
                    >
                      {v.name}
                    </Typography>
                    <div className="font-mono text-xs text-muted-foreground font-semibold">{v.plateNumber}</div>
                  </div>
                  {getStatusBadge(v.status)}
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {getFuelTypeBadge(v.fuelTypeLabel)}
                  <Typography variant="muted-sm" className="text-xs text-muted-foreground">
                    Added {v.createdAt}
                  </Typography>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-slate-700 dark:text-slate-200 font-semibold text-xs"
                    onClick={() => {
                      setSelectedVehicle(v);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                  <DeleteRecordButton
                    label={`Delete vehicle ${v.name}`}
                    title="Delete vehicle?"
                    description={`This will permanently remove ${v.name} (${v.plateNumber}).`}
                    isDeleting={deletingVehicleId === v.id}
                    onConfirm={() => handleDelete(v.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      />

      {/* Add Vehicle Dialog */}
      <VehicleDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={onRefresh}
      />

      {/* Edit Vehicle Dialog */}
      {selectedVehicle && (
        <VehicleDialog
          vehicle={selectedVehicle}
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setSelectedVehicle(null);
          }}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
