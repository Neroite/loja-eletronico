import SettingsContent from "./_components/settings-content";
import { getStoreSettings } from "./_data-access/get-store-settings";

export default async function SettingsPage() {
  const { storeName, storeSegment } = await getStoreSettings();
  return <SettingsContent storeName={storeName} storeSegment={storeSegment} />;
}
