import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";

const columns = [
  { id: "ideas", label: "💡 Ideas", color: "bg-purple-500/10" },
  { id: "backlog", label: "📋 Backlog", color: "bg-muted" },
  { id: "in-progress", label: "🔨 In Progress", color: "bg-primary/10" },
  { id: "review", label: "👀 Review", color: "bg-warning/10" },
  { id: "completed", label: "✅ Completed", color: "bg-success/10" },
];

interface KanbanCard {
  id: string;
  title: string;
  priority: "P0" | "P1" | "P2" | "P3";
  column: string;
  progress: number;
  deadline: string;
  tags: string[];
}

const defaultCards: KanbanCard[] = [
  { id: "k1", title: "AI SEO Audit Tool", priority: "P2", column: "ideas", progress: 0, deadline: "2026-04-01", tags: ["AI", "SEO"] },
  { id: "k2", title: "Newsletter System", priority: "P3", column: "ideas", progress: 0, deadline: "", tags: ["automation"] },
  { id: "k3", title: "Client Reporting Dashboard", priority: "P1", column: "backlog", progress: 10, deadline: "2026-03-15", tags: ["client", "dashboard"] },
  { id: "k4", title: "Agency Site Redesign v2", priority: "P0", column: "in-progress", progress: 65, deadline: "2026-03-01", tags: ["client", "design"] },
  { id: "k5", title: "Invoice Generator Polish", priority: "P2", column: "review", progress: 90, deadline: "2026-02-28", tags: ["tool"] },
  { id: "k6", title: "WP Starter Theme v3", priority: "P3", column: "completed", progress: 100, deadline: "2026-02-15", tags: ["wordpress"] },
];

const priorityStyle: Record<string, string> = {
  P0: "badge-destructive",
  P1: "badge-warning",
  P2: "badge-info",
  P3: "badge-success",
};

export default function ProjectsPage() {
  const [cards, setCards] = useState<KanbanCard[]>(() => {
    try {
      const saved = localStorage.getItem("mc-kanban");
      return saved ? JSON.parse(saved) : defaultCards;
    } catch { return defaultCards; }
  });
  const [dragId, setDragId] = useState<string | null>(null);

  const save = (c: KanbanCard[]) => { setCards(c); localStorage.setItem("mc-kanban", JSON.stringify(c)); };

  const onDragStart = (id: string) => setDragId(id);
  const onDrop = (col: string) => {
    if (!dragId) return;
    save(cards.map(c => c.id === dragId ? { ...c, column: col } : c));
    setDragId(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Projects Tracker</h1>
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
        {columns.map(col => {
          const colCards = cards.filter(c => c.column === col.id);
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-64 rounded-2xl bg-secondary/30 p-3"
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(col.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-card-foreground">{col.label}</span>
                <span className="text-xs text-muted-foreground bg-muted rounded-full w-5 h-5 flex items-center justify-center">{colCards.length}</span>
              </div>
              <div className="space-y-2">
                {colCards.map(card => (
                  <motion.div
                    key={card.id}
                    draggable
                    onDragStart={() => onDragStart(card.id)}
                    layout
                    className="card-elevated p-3 cursor-grab active:cursor-grabbing space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-medium text-card-foreground">{card.title}</span>
                      <span className={`${priorityStyle[card.priority]} text-[10px] flex-shrink-0`}>{card.priority}</span>
                    </div>
                    {card.progress > 0 && (
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${card.progress}%` }} />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map(t => <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-secondary text-secondary-foreground">{t}</span>)}
                    </div>
                    {card.deadline && <span className="text-[10px] text-muted-foreground">{card.deadline}</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
