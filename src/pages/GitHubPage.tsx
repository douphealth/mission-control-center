import { useDashboard } from "@/contexts/DashboardContext";
import { motion } from "framer-motion";
import { ExternalLink, Star, GitFork, Trash2 } from "lucide-react";

const langColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-blue-400",
  PHP: "bg-purple-500",
  HTML: "bg-orange-500",
};

export default function GitHubPage() {
  const { repos, updateData } = useDashboard();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">GitHub Projects</h1>
        <span className="text-sm text-muted-foreground">{repos.length} repos</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {repos.map((repo, i) => (
          <motion.div key={repo.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-elevated p-5 space-y-3">
            <div className="flex items-start justify-between">
              <a href={repo.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-card-foreground hover:text-primary transition-colors">{repo.name}</a>
              <span className={`badge-${repo.status === "active" ? "success" : repo.status === "stable" ? "info" : "muted"}`}>{repo.status}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-full ${langColors[repo.language] || "bg-muted-foreground"}`} />{repo.language}</span>
              <span className="flex items-center gap-1"><Star size={12} />{repo.stars}</span>
              <span className="flex items-center gap-1"><GitFork size={12} />{repo.forks}</span>
            </div>
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progress</span><span>{repo.progress}%</span></div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${repo.progress}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {repo.topics.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{t}</span>)}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a href={repo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink size={12} /> Repo</a>
              {repo.demoUrl && <a href={repo.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">🌐 Demo</a>}
              <button onClick={() => updateData({ repos: repos.filter(r => r.id !== repo.id) })} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
