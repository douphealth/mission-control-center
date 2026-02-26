import { useDashboard } from "@/contexts/DashboardContext";
import { Search, Bell, Plus, Menu, Globe, CheckSquare, Github, Hammer, Link2, FileText, BarChart3, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CommandPalette from "./CommandPalette";
import BulkImportModal from "./BulkImportModal";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}

function formatTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const quickAddItems = [
  { id: "websites", label: "Website", emoji: "🌐" },
  { id: "tasks", label: "Task", emoji: "✅" },
  { id: "github", label: "GitHub Repo", emoji: "🐙" },
  { id: "builds", label: "Build Project", emoji: "🛠️" },
  { id: "links", label: "Link", emoji: "🔗" },
  { id: "notes", label: "Note", emoji: "📝" },
  { id: "projects", label: "Kanban Card", emoji: "📋" },
];

export default function TopBar() {
  const { userName, setSidebarOpen, setActiveSection, tasks } = useDashboard();
  const [time, setTime] = useState(formatTime());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const overdueCount = tasks.filter(t => t.status !== "done" && t.dueDate < new Date().toISOString().split("T")[0]).length;
  const dueTodayCount = tasks.filter(t => t.status !== "done" && t.dueDate === new Date().toISOString().split("T")[0]).length;
  const notifCount = overdueCount + dueTodayCount;

  useEffect(() => {
    const i = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(i);
  }, []);

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); setQuickAddOpen(true); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!quickAddOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setQuickAddOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [quickAddOpen]);

  const handleQuickAdd = (sectionId: string) => {
    setActiveSection(sectionId);
    setQuickAddOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 h-16 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
          <Menu size={22} />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold truncate text-foreground">
            {getGreeting()}, {userName} 👋
          </h2>
          <div className="text-xs text-muted-foreground hidden sm:block">{formatDate()} · {time}</div>
        </div>

        {/* Search trigger */}
        <button
          onClick={() => setCmdOpen(true)}
          className="hidden md:flex items-center bg-secondary rounded-xl px-3 py-2 gap-2 w-64 lg:w-80 cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground flex-1 text-left">Search everything...</span>
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>

        {/* Import button */}
        <button
          onClick={() => setImportOpen(true)}
          className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2.5 py-2 rounded-xl hover:bg-secondary"
          title="Bulk Import CSV/JSON"
        >
          <Upload size={18} />
        </button>

        {/* Notifications */}
        <button className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-secondary">
          <Bell size={20} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
              {notifCount}
            </span>
          )}
        </button>

        {/* Quick Add */}
        <div className="relative">
          <button
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} className={`transition-transform duration-200 ${quickAddOpen ? "rotate-45" : ""}`} />
          </button>

          <AnimatePresence>
            {quickAddOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setQuickAddOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-56 bg-card rounded-2xl shadow-2xl border border-border p-2"
                >
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Add</div>
                  {quickAddItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleQuickAdd(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-card-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="text-base">{item.emoji}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={() => { setQuickAddOpen(false); setImportOpen(true); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-card-foreground hover:bg-secondary transition-colors"
                    >
                      <span className="text-base">📥</span>
                      <span className="font-medium">Bulk Import</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onImport={() => setImportOpen(true)} />
      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
