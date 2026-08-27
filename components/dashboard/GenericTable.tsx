"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Typography } from "@/components/ui/typography";
import { FileText, Loader2 } from "lucide-react";
import type {
  ColumnConfig,
  TableSelectionConfig,
  MobileRenderContext,
} from "@/types";

export type { ColumnConfig, TableSelectionConfig, MobileRenderContext };

interface GenericTableProps<T> {
  title: string;
  data: T[];
  columns: ColumnConfig<T>[];
  mobileRender: (item: T, mobile?: MobileRenderContext) => React.ReactNode;
  pagination?: React.ReactNode;
  isLoading?: boolean;
  loadingLabel?: string;
  selection?: TableSelectionConfig;
  headerActions?: React.ReactNode;
}

export function GenericTable<T extends { id: string | number }>({
  title,
  data,
  columns,
  mobileRender,
  pagination,
  isLoading = false,
  loadingLabel = "Loading data...",
  selection,
  headerActions,
}: GenericTableProps<T>) {
  const hasTitle = title && title.trim() !== "";
  const isEmpty = !data || data.length === 0;
  const showHeader = hasTitle || headerActions;

  const getSelectAllState = (): boolean | "indeterminate" => {
    if (!selection) return false;
    if (selection.allSelected) return true;
    if (selection.someSelected) return "indeterminate";
    return false;
  };

  return (
    <Card className="rounded-2xl gap-0 py-0 shadow-none border-grey-card-stroke overflow-hidden bg-white dark:bg-card w-full">
      {showHeader && (
        <CardHeader className="px-4 sm:px-5 md:px-6 py-3.5 sm:py-4 border-b border-grey-card-stroke">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {hasTitle && (
              <CardTitle>
                <Typography
                  variant="h3"
                  as="h2"
                  className="text-text dark:text-card-foreground font-bold text-base sm:text-lg md:text-xl"
                >
                  {title}
                </Typography>
              </CardTitle>
            )}
            {headerActions && (
              <div className="flex items-center gap-2 flex-wrap">{headerActions}</div>
            )}
          </div>
        </CardHeader>
      )}

      {isLoading ? (
        <div className="flex min-h-[280px] sm:min-h-[320px] flex-col items-center justify-center p-8 sm:p-16 text-center space-y-3 bg-white dark:bg-card">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <Typography variant="body-regular" className="text-text/70 text-sm font-medium">
            {loadingLabel}
          </Typography>
        </div>
      ) : isEmpty ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 text-center space-y-3 bg-white dark:bg-card">
          <div className="p-3.5 bg-bg-subtle dark:bg-slate-800 rounded-full text-text/40">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <Typography variant="body-bold" className="text-text dark:text-foreground font-bold text-base sm:text-lg">
              No records found
            </Typography>
            <Typography variant="muted-sm" className="text-text/60 text-xs sm:text-sm max-w-xs mx-auto">
              There is currently no data available to display in this section.
            </Typography>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop & Laptop Screen View (Table) */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader className="bg-bg-subtle/80">
                <TableRow className="border-b border-grey-card-stroke">
                  {selection && (
                    <TableHead className="w-12 px-4 py-3.5 text-center">
                      <Checkbox
                        checked={getSelectAllState()}
                        onCheckedChange={(checked) =>
                          selection.onToggleAll(checked === true)
                        }
                        aria-label="Select all rows"
                      />
                    </TableHead>
                  )}
                  {columns.map((col, idx) => (
                    <TableHead key={idx} className="px-4 xl:px-6 py-3.5 text-center">
                      <Typography
                        variant="body-semibold"
                        className="text-text/80 text-xs xl:text-sm font-bold inline-block w-full"
                      >
                        {col.header}
                      </Typography>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const itemId = String(item.id);
                  const isSelected = selection?.selectedIds.has(itemId) ?? false;

                  return (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-bg-subtle/50 border-b border-grey-card-stroke transition-colors ${
                        isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      {selection && (
                        <TableCell className="w-12 px-4 py-4 text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              selection.onToggle(itemId, checked === true)
                            }
                            aria-label={`Select row ${itemId}`}
                          />
                        </TableCell>
                      )}
                      {columns.map((col, idx) => (
                        <TableCell key={idx} className="px-4 xl:px-6 py-4 text-center">
                          {col.renderCell ? (
                            col.renderCell(item)
                          ) : (
                            <Typography
                              variant="body-regular"
                              className="text-text dark:text-foreground text-sm"
                            >
                              {String(item[col.accessorKey as keyof T])}
                            </Typography>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile & Tablet View (Cards) */}
          <div className="lg:hidden divide-y divide-grey-card-stroke bg-white dark:bg-card">
            {selection && data.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-bg-subtle border-b border-grey-card-stroke">
                <Checkbox
                  checked={getSelectAllState()}
                  onCheckedChange={(checked) =>
                    selection.onToggleAll(checked === true)
                  }
                  aria-label="Select all rows"
                />
                <Typography variant="body-semibold" className="text-xs sm:text-sm font-bold text-text/80">
                  Select all records
                </Typography>
              </div>
            )}
            {data.map((item) => {
              const itemId = String(item.id);
              const isSelected = selection?.selectedIds.has(itemId) ?? false;

              const mobileContext: MobileRenderContext | undefined = selection
                ? {
                    isSelected,
                    selectionCheckbox: (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          selection.onToggle(itemId, checked === true)
                        }
                        aria-label={`Select row ${itemId}`}
                        className="shrink-0 mt-0.5"
                      />
                    ),
                  }
                : undefined;

              return (
                <React.Fragment key={item.id}>
                  {mobileRender(item, mobileContext)}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}

      {pagination && (
        <div
          className={`p-3.5 sm:p-4 border-t border-grey-card-stroke bg-white dark:bg-card ${
            isLoading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {pagination}
        </div>
      )}
    </Card>
  );
}
