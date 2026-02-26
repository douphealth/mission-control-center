import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ExternalLink, Copy, Eye, EyeOff, Globe, Edit2, Trash2 } from "lucide-react";

const statusBadge: Record<string, string> = {
  active: "badge-success",
  maintenance: "badge-warning",
  down: "badge-destructive",
  archived: "badge-muted",
};

const categoryColors: Record<string, string> = {
  "Client Site": "badge-info",
  "E-Commerce": "badge-primary",
  "Personal": "badge-muted",
  "Blog": "badge-success",
  "SaaS": "badge-warning",
  "Portfolio": "badge-primary",
};

export default function WebsitesPage() {
  const { websites, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  const filtered = websites
    .filter(w => filterStatus === "all" || w.status === filterStatus)
    .filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.url.toLowerCase().includes(search.toLowerCase()));

  const toggleReveal = (key: string) => {
    setRevealedPasswords(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else {
        n.add(key);
        setTimeout(() => setRevealedPasswords(p => { const x = new Set(p); x.delete(key); return x; }), 10000);
      }
      return n;
    });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const deleteWebsite = (id: string) => {
    updateData({ websites: websites.filter(w => w.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Websites</h1>
        <span className="text-sm text-muted-foreground">{websites.length} sites</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-secondary rounded-xl px-3 py-1.5 gap-2">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-40" />
        </div>
        {["all", "active", "maintenance", "down", "archived"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((site, i) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-elevated overflow-hidden"
          >
            {/* Thumbnail */}
            <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary/30">{site.name.charAt(0)}</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-card-foreground">{site.name}</h3>
                <span className={statusBadge[site.status]}>{site.status}</span>
              </div>

              {/* URLs */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className="text-muted-foreground" />
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">{site.url}</a>
                  <button onClick={() => copyText(site.url)} className="text-muted-foreground hover:text-foreground"><Copy size={12} /></button>
                </div>
                {site.wpAdminUrl && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">🔧</span>
                    <a href={site.wpAdminUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">WP Admin</a>
                    <button onClick={() => copyText(site.wpAdminUrl)} className="text-muted-foreground hover:text-foreground"><Copy size={12} /></button>
                  </div>
                )}
              </div>

              {/* Credentials */}
              {site.wpUsername && (
                <div className="space-y-1 text-xs bg-secondary/50 rounded-xl p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-card-foreground font-mono">{site.wpUsername}</span>
                      <button onClick={() => copyText(site.wpUsername)} className="text-muted-foreground hover:text-foreground"><Copy size={10} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pass:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-card-foreground font-mono text-xs">
                        {revealedPasswords.has(site.id) ? site.wpPassword : "••••••"}
                      </span>
                      <button onClick={() => toggleReveal(site.id)} className="text-muted-foreground hover:text-foreground">
                        {revealedPasswords.has(site.id) ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                      <button onClick={() => copyText(site.wpPassword)} className="text-muted-foreground hover:text-foreground"><Copy size={10} /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className={categoryColors[site.category] || "badge-muted"}>{site.category}</span>
                <span className="badge-muted">{site.hostingProvider}</span>
              </div>

              {/* Plugins */}
              {site.plugins.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {site.plugins.map(p => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{p}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink size={12} /> Visit
                </a>
                {site.wpAdminUrl && (
                  <a href={site.wpAdminUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    🔧 Admin
                  </a>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={12} /></button>
                  <button onClick={() => deleteWebsite(site.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-3">🌐</div>
          <p className="font-medium">No websites found</p>
          <p className="text-sm mt-1">Add your first website to get started</p>
        </div>
      )}
    </div>
  );
}
