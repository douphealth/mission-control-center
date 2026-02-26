import { useDashboard } from "@/contexts/DashboardContext";
import { motion } from "framer-motion";
import { ExternalLink, Trash2 } from "lucide-react";

const platformStyle: Record<string, { badge: string; emoji: string }> = {
  bolt: { badge: "bg-blue-500/10 text-blue-500", emoji: "⚡" },
  lovable: { badge: "bg-purple-500/10 text-purple-500", emoji: "💜" },
  replit: { badge: "bg-green-500/10 text-green-500", emoji: "🟢" },
};

const statusOrder = { ideation: 0, building: 1, testing: 2, deployed: 3 };

export default function BuildsPage() {
  const { buildProjects, updateData } = useDashboard();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Build Projects</h1>
        <div className="flex gap-2">
          {(["bolt", "lovable", "replit"] as const).map(p => (
            <a key={p} href={p === "bolt" ? "https://bolt.new" : p === "lovable" ? "https://lovable.dev" : "https://replit.com"} target="_blank" rel="noopener noreferrer" className={`px-2.5 py-1 rounded-lg text-xs font-medium ${platformStyle[p].badge}`}>
              {platformStyle[p].emoji} {p.charAt(0).toUpperCase() + p.slice(1)}
            </a>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buildProjects.map((bp, i) => {
          const ps = platformStyle[bp.platform];
          return (
            <motion.div key={bp.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-elevated p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-card-foreground">{bp.name}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ps.badge}`}>{ps.emoji} {bp.platform}</span>
              </div>
              <p className="text-sm text-muted-foreground">{bp.description}</p>
              {/* Status steps */}
              <div className="flex items-center gap-1">
                {(["ideation", "building", "testing", "deployed"] as const).map((s, idx) => (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${statusOrder[bp.status] >= idx ? "bg-primary" : "bg-muted"}`} />
                    <span className={`text-[10px] ${statusOrder[bp.status] >= idx ? "text-card-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                    {idx < 3 && <div className={`w-4 h-0.5 ${statusOrder[bp.status] > idx ? "bg-primary" : "bg-muted"}`} />}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {bp.techStack.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{t}</span>)}
              </div>
              {bp.nextSteps && <p className="text-xs text-muted-foreground italic">Next: {bp.nextSteps}</p>}
              <div className="flex gap-2 pt-1">
                <a href={bp.projectUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink size={12} /> Open</a>
                {bp.deployedUrl && <a href={bp.deployedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">🚀 Live</a>}
                <button onClick={() => updateData({ buildProjects: buildProjects.filter(b => b.id !== bp.id) })} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
