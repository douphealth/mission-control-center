import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export default function SettingsPage() {
  const { userName, userRole, theme, toggleTheme, updateData } = useDashboard();
  const [name, setName] = useState(userName);
  const [role, setRole] = useState(userRole);

  const saveName = () => updateData({ userName: name, userRole: role });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile */}
      <div className="card-elevated p-5 space-y-4">
        <h2 className="font-semibold text-card-foreground">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} onBlur={saveName} className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Role / Title</label>
            <input value={role} onChange={e => setRole(e.target.value)} onBlur={saveName} className="w-full mt-1 px-3 py-2 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card-elevated p-5 space-y-4">
        <h2 className="font-semibold text-card-foreground">Appearance</h2>
        <div className="flex gap-2">
          <button onClick={() => { if (theme === "dark") toggleTheme(); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme === "light" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            <Sun size={16} /> Light
          </button>
          <button onClick={() => { if (theme === "light") toggleTheme(); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            <Moon size={16} /> Dark
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="card-elevated p-5 space-y-4">
        <h2 className="font-semibold text-card-foreground">Data Management</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const data = localStorage.getItem("mission-control-data");
              if (!data) return;
              const blob = new Blob([data], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `mission-control-backup-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
            }}
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            📤 Export Data
          </button>
          <button
            onClick={() => {
              if (!confirm("Clear ALL data? This cannot be undone.")) return;
              localStorage.removeItem("mission-control-data");
              localStorage.removeItem("mc-kanban");
              window.location.reload();
            }}
            className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            🗑️ Clear All Data
          </button>
        </div>
        <div className="text-xs text-muted-foreground">
          Storage used: ~{(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB
        </div>
      </div>

      {/* About */}
      <div className="card-elevated p-5 space-y-2 text-sm text-muted-foreground">
        <h2 className="font-semibold text-card-foreground">About</h2>
        <p>Mission Control v3.0</p>
        <p>Built with React + Tailwind CSS + TypeScript</p>
        <p>Made with ❤️</p>
      </div>
    </div>
  );
}
