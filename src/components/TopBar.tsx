import { useDashboard } from "@/contexts/DashboardContext";
import { Search, Bell, Plus, Menu, Globe, CheckSquare, Github, Hammer, Link2, FileText, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  { id: "websites", label: "Website", icon: Globe, emoji: "🌐" },
  { id: "tasks", label: "Task", icon: CheckSquare, emoji: "✅" },
  { id: "github", label: "GitHub Repo", icon: Github, emoji: "🐙" },
  { id: "builds", label: "Build Project", icon: Hammer, emoji: "🛠️" },
  { id: "links", label: "Link", icon: Link2, emoji: "🔗" },
  { id: "notes", label: "Note", icon: FileText, emoji: "📝" },
  { id: "projects", label: "Kanban Card", icon: BarChart3, emoji: "📋" },
];

export default function TopBar() {
  const { userName, setSidebarOpen, setActiveSection } = useDashboard();
  const [time, setTime] = useState(formatTime());
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(i);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!quickAddOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setQuickAddOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [quickAddOpen]);

  const handleQuickAdd = (sectionId: string) => {
    setActiveSection(sectionId);
    setQuickAddOpen(false);
    // The section page will open with its add modal — we navigate there
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-6 h-16 flex items-center gap-4">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
        <Menu size={22} />
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold truncate text-foreground">
          {getGreeting()}, {userName} 👋
        </h2>
        <div className="text-xs text-muted-foreground hidden sm:block">{formatDate()} · {time}</div>
      </div>

      <div className="hidden md:flex items-center bg-secondary rounded-xl px-3 py-2 gap-2 w-64 lg:w-80">
        <Search size={16} className="text-muted-foreground flex-shrink-0" />
        <input type="text" placeholder="Search everything... (Ctrl+K)" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
      </div>

      <button className="relative text-muted-foreground hover:text-foreground transition-colors">
        <Bell size={20} />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">3</span>
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
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
