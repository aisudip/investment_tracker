import { DashboardNav } from "@/components/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-56 shrink-0 border-r border-border">
        <DashboardNav />
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
