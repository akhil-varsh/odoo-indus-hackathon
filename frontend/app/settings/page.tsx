export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500">
          Manage profile, company details, and integrations.
        </p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Organization Settings</h2>
        <div className="text-sm text-gray-700">
          Settings UI placeholders for timezone, currency, and notification
          preferences.
        </div>
      </div>
    </div>
  );
}
