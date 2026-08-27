import type React from "react";

export interface ColumnConfig<T> {
  header: string;
  accessorKey: keyof T | string;
  renderCell?: (item: T) => React.ReactNode;
}

export interface TableSelectionConfig {
  selectedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  allSelected: boolean;
  someSelected: boolean;
}

export interface MobileRenderContext {
  selectionCheckbox: React.ReactNode;
  isSelected: boolean;
}
