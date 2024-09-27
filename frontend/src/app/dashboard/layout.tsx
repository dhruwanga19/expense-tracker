import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dhruwang's Expense Tracker</h1>
      <TooltipProvider delayDuration={0}>
        {children}
        <Toaster />
      </TooltipProvider>
    </div>
  );
}
