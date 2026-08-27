"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteRecordButtonProps {
  label: string;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  buttonText?: string;
}

export function DeleteRecordButton({
  label,
  title,
  description,
  onConfirm,
  isDeleting = false,
  buttonText,
}: DeleteRecordButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size={buttonText ? "default" : "sm"}
          disabled={isDeleting}
          className={
            buttonText
              ? "h-10 max-w-full px-3 sm:px-4 rounded-xl font-bold gap-2 text-xs sm:text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              : "h-8 px-2.5 rounded-lg text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          }
          aria-label={label}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {buttonText && <span>{buttonText}</span>}
          {!buttonText && <span className="sr-only">{label}</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void onConfirm()}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
