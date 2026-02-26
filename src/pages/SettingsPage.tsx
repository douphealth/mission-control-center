import { useDashboard } from "@/contexts/DashboardContext";
import { useState, useRef } from "react";
import { Moon, Sun, Download, Upload, Trash2, AlertTriangle, Database, Palette, User, Shield, Info } from "lucide-react";

export default function SettingsPage() {
  const { userName, userRole, theme, toggleTheme, updateData } = useDashboard();
  const [name, setName] = useState(userName);
  const [role, setRole] = useState(userRole);
  const [activeTab, setActiveTab] = useState("profile");
  const [confirmDelete, setConfirmDelete] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  const saveName = () => updateData({ userName: name, userRole: role });

  const handleExport = () => {
    const data = localStorage.getItem("mission-control-data");
    const kanban = localStorage.getItem("mc-kanban");
    const exported = { data: data ? JSON.parse(data) : {}, kanban: kanban ? JSON.parse(kanban) : [] };
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mission-control-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.data) {
          localStorage.setItem("mission-control-data", JSON.stringify(parsed.data));
        }
        if (parsed.kanban) {
          localStorage.setItem("mc-kanban", JSON.stringify(parsed.kanban));
        }
        // If it's a flat structure (old format), treat as data
        if (!parsed.data && !parsed.kanban && parsed.websites) {
          localStorage.setItem("mission-control-data", JSON.stringify(parsed));
        }
        window.location.reload();
      } catch {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirmDelete !== "DELETE") return;
    localStorage.removeItem("mission-control-data");
    localStorage.removeItem("mc-kanban");
    localStorage.removeItem("mc-theme");
    window.location.reload();
  };

  const storageUsed = (JSON.stringify(localStorage).length / 1024).toFixed(1);
  const storagePercent = Math.min(100, (JSON.stringify(localStorage).length / (5 * 1024 * 1024)) * 100);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "data", label: "Data", icon: Database },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Settings Nav */}
        <div className="lg:w-48 flex lg:flex-col gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 max-w-2xl space-y-4">
          {activeTab === "profile" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="font-semibold text-card-foreground text-lg">Profile Settings</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                  {name.charAt(0)}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} onBlur={saveName} className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Role / Title</label>
                    <input value={role} onChange={e => setRole(e.target.value)} onBlur={saveName} className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-shadow" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="font-semibold text-card-foreground text-lg">Appearance</h2>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Theme</label>
                <div className="flex gap-2">
                  <button onClick={() => { if (theme === "dark") toggleTheme(); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${theme === "light" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    <Sun size={18} /> Light
                  </button>
                  <button onClick={() => { if (theme === "light") toggleTheme(); }} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${theme === "dark" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    <Moon size={18} /> Dark
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <div className="card-elevated p-6 space-y-4">
                <h2 className="font-semibold text-card-foreground text-lg">Data Management</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button onClick={handleExport} className="flex items-center gap-3 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-left">
                    <Download size={20} className="text-primary flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-card-foreground">Export All Data</div>
                      <div className="text-xs text-muted-foreground">Download full backup as JSON</div>
                    </div>
                  </button>
                  <button onClick={() => importRef.current?.click()} className="flex items-center gap-3 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-left">
                    <Upload size={20} className="text-primary flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-card-foreground">Import Data</div>
                      <div className="text-xs text-muted-foreground">Restore from JSON backup</div>
                    </div>
                  </button>
                  <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Storage Usage</span>
                    <span className="text-xs text-muted-foreground">{storageUsed} KB / 5 MB</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${storagePercent > 80 ? "bg-destructive" : storagePercent > 50 ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${Math.max(1, storagePercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="card-elevated p-6 space-y-4 border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-destructive" />
                  <h2 className="font-semibold text-destructive">Danger Zone</h2>
                </div>
                <p className="text-sm text-muted-foreground">This will permanently delete all your data including websites, tasks, projects, notes, links, and settings.</p>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">Type "DELETE" to confirm:</label>
                  <input
                    value={confirmDelete}
                    onChange={e => setConfirmDelete(e.target.value)}
                    placeholder='Type "DELETE"'
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary text-foreground text-sm outline-none focus:ring-2 focus:ring-destructive/30 transition-shadow"
                  />
                  <button
                    onClick={handleClearAll}
                    disabled={confirmDelete !== "DELETE"}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    <Trash2 size={14} /> Delete All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "about" && (
            <div className="card-elevated p-6 space-y-3">
              <h2 className="font-semibold text-card-foreground text-lg">About Mission Control</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-card-foreground font-medium">Version:</span> 4.0</p>
                <p><span className="text-card-foreground font-medium">Stack:</span> React + TypeScript + Tailwind CSS + Framer Motion</p>
                <p><span className="text-card-foreground font-medium">Storage:</span> localStorage (client-side)</p>
                <p><span className="text-card-foreground font-medium">Features:</span> CSV/JSON import, command palette (⌘K), drag-and-drop Kanban, full CRUD on all sections</p>
                <div className="pt-3 border-t border-border mt-3">
                  <p>Made with ❤️ for productivity</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
