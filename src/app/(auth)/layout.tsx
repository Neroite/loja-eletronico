import Sidebar from "@/components/Sidebar";
import AppShell from "./_components/app-shell";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <AppShell>{children}</AppShell>
    </>
  );
}
