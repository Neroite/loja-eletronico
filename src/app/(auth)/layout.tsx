import Sidebar from "@/components/Sidebar";
import AppShell from "./_components/app-shell";
import { getHeaderData } from "./_data-access/get-header-data";
import { getStoreSettings } from "./settings/_data-access/get-store-settings";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ notificationsCount, lowStockProducts, userEmail, role }, { storeName }] =
    await Promise.all([getHeaderData(), getStoreSettings()]);

  return (
    <>
      <Sidebar storeName={storeName} role={role} />
      <AppShell
        notificationsCount={notificationsCount}
        lowStockProducts={lowStockProducts}
        userEmail={userEmail}
      >
        {children}
      </AppShell>
    </>
  );
}
