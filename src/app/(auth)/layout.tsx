import Sidebar from "@/components/Sidebar";
import AppShell from "./_components/app-shell";
import { getHeaderData } from "./_data-access/get-header-data";
import { getStoreSettings } from "./settings/_data-access/get-store-settings";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ notificationsCount, userEmail }, { storeName }] = await Promise.all([
    getHeaderData(),
    getStoreSettings(),
  ]);

  return (
    <>
      <Sidebar storeName={storeName} />
      <AppShell notificationsCount={notificationsCount} userEmail={userEmail}>
        {children}
      </AppShell>
    </>
  );
}
