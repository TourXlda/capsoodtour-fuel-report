"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white dark:bg-background antialiased px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center justify-center gap-6 min-h-[70vh]">
          {/* Success Icon */}
          <div className="flex items-center justify-center">
            <CheckCircle
              className="w-16 h-16 text-emerald-600 dark:text-emerald-500"
              strokeWidth={1.5}
            />
          </div>

          {/* Heading */}
          <Typography
            variant="h2"
            as="h1"
            className="text-center font-bold tracking-tight text-foreground text-xl sm:text-2xl md:text-3xl"
          >
            Fuel Expense Recorded
          </Typography>

          {/* Description */}
          <Typography
            variant="body-regular"
            className="text-muted-foreground text-center max-w-[280px]"
          >
            Your fuel expense submission has been saved successfully to the system.
          </Typography>

          {/* Action Buttons Container */}
          <div className="w-full flex flex-col gap-3 mt-4">
            {/* Submit Another Report Button */}
            <Link href="/fuel-report" className="w-full">
              <Button className="w-full h-12 rounded-xl">
                <Typography variant="button-semibold" className="text-white font-bold">
                  Submit Another Expense
                </Typography>
              </Button>
            </Link>

            {/* Back To Client Dashboard Action */}
            <Link href="/client-dashboard" className="w-full">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-primary font-bold border-slate-200"
              >
                <Typography variant="button-semibold" className="text-foreground">
                  Go to Dashboard
                </Typography>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
