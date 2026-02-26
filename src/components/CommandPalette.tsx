import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Home, CheckSquare, Calendar, FileText, Timer, Globe, Github, Hammer, Link2, BarChart3, Settings, Upload, Plus } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

const sections = [
  { id: "dashboard", label: "Dashboard", icon: Home, emoji: "🏠" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, emoji: "✅" },
  { id: "calendar", label: "Calendar", icon: Calendar, emoji: "📅" },
  { id: "notes", label: "Notes", icon: FileText, emoji: "📝" },
  { id: "focus", label: "Focus Timer", icon: Timer, emoji: "🍅" },
  { id: "websites", label: "My Websites", icon: Globe, emoji: "🌐" },
  { id: "github", label: "GitHub Projects", icon: Github, emoji: "🐙" },
  { id: "builds", label: "Build Projects", icon: Hammer, emoji: "🛠️" },
  { id: "links", label: "Links Hub", icon: Link2, emoji: "🔗" },
  { id: "projects", label: "Projects Tracker", icon: BarChart3, emoji: "📊" },
  { id: "settings", label: "Settings", icon: Settings, emoji: "⚙️" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onImport: () => void;
}

export default function CommandPalette({ open, onClose, onImport }: CommandPaletteProps) {
  const { setActiveSection, websites, tasks, repos, buildProjects, links, notes } = useDashboard();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const allItems = useMemo(() => {
    const items: { type: string; label: string; sub: string; action: () => void; emoji: string }[] = [];

    // Sections
    sections.forEach(s => {
      items.push({ type: "Navigate", label: s.label, sub: "Go to section", action: () => { setActiveSection(s.id); onClose(); }, emoji: s.emoji });
    });

    // Actions
    items.push({ type: "Action", label: "Bulk Import (CSV/JSON)", sub: "Import data from file", action: () => { onImport(); onClose(); }, emoji: "📥" });
    items.push({ type: "Action", label: "Export All Data", sub: "Download backup JSON", action: () => {
      const data = localStorage.getItem("mission-control-data");
      if (!data) return;
      const blob = new Blob([data], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mission-control-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      onClose();
    }, emoji: "📤" });
    items.push({ type: "Action", label: "Toggle Dark Mode", sub: "Switch theme", action: () => { onClose(); }, emoji: "🌙" });

    // Data items
    websites.forEach(w => items.push({ type: "Website", label: w.name, sub: w.url, action: () => { window.open(w.url, "_blank"); onClose(); }, emoji: "🌐" }));
    tasks.filter(t => t.status !== "done").forEach(t => items.push({ type: "Task", label: t.title, sub: `${t.priority} · ${t.dueDate}`, action: () => { setActiveSection("tasks"); onClose(); }, emoji: "✅" }));
    repos.forEach(r => items.push({ type: "Repo", label: r.name, sub: r.description.slice(0, 50), action: () => { window.open(r.url, "_blank"); onClose(); }, emoji: "🐙" }));
    buildProjects.forEach(b => items.push({ type: "Build", label: b.name, sub: `${b.platform} · ${b.status}`, action: () => { setActiveSection("builds"); onClose(); }, emoji: "🛠️" }));
    links.forEach(l => items.push({ type: "Link", label: l.title, sub: l.url, action: () => { window.open(l.url, "_blank"); onClose(); }, emoji: "🔗" }));
    notes.forEach(n => items.push({ type: "Note", label: n.title, sub: n.content.slice(0, 40), action: () => { setActiveSection("notes"); onClose(); }, emoji: "📝" }));

    return items;
  }, [websites, tasks, repos, buildProjects, links, notes, setActiveSection, onClose, onImport]);

  const filtered = query.trim()
    ? allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.sub.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 12)
    : allItems.slice(0, 10);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filtered[selectedIndex]) { filtered[selectedIndex].action(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -12 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={18} className="text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search everything, navigate, or take action..."
                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto py-2">
              {filtered.map((item, i) => (
                <button
                  key={`${item.type}-${item.label}-${i}`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selectedIndex === i ? "bg-primary/10" : "hover:bg-secondary/50"}`}
                >
                  <span className="text-base flex-shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-card-foreground truncate">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{item.sub}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md flex-shrink-0">{item.type}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">No results for "{query}"</div>
              )}
            </div>

            <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
