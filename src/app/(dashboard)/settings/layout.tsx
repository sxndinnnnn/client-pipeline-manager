import { SettingsTabs } from "./settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SettingsTabs />
      <div className="pt-6">{children}</div>
    </div>
  );
}
