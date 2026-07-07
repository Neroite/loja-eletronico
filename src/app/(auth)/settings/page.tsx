import { redirect } from "next/navigation";
import SettingsContent from "./_components/settings-content";
import { getStoreSettings } from "./_data-access/get-store-settings";
import { getProfiles } from "./_data-access/get-profiles";
import { getCurrentUserRole } from "@/lib/auth/get-current-role";
import { canManageSettings } from "@/lib/auth/roles";

export default async function SettingsPage() {
  const current = await getCurrentUserRole();
  if (!current || !canManageSettings(current.role)) {
    redirect("/dashboard");
  }

  const [{ storeName, storeSegment, stockCritical, stockLow }, profiles] = await Promise.all([
    getStoreSettings(),
    getProfiles(),
  ]);

  return (
    <SettingsContent
      storeName={storeName}
      storeSegment={storeSegment}
      stockCritical={stockCritical}
      stockLow={stockLow}
      profiles={profiles}
      currentUserId={current.userId}
    />
  );
}
