import { DashboardLayoutProvider } from "@/components/layout/DashboardLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayoutProvider>
      {children}
    </DashboardLayoutProvider>
  );
}
