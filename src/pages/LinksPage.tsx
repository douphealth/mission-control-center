import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy, Pin, Trash2, Search } from "lucide-react";

export default function LinksPage() {
  const { links, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const categories = ["all", ...Array.from(new Set(links.map(l => l.category)))];
  const filtered = links
    .filter(l => filterCat === "all" || l.category === filterCat)
    .filter(l => l.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Links Hub</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-secondary rounded-xl px-3 py-1.5 gap-2">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search links..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-40" />
        </div>
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterCat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((link, i) => (
          <motion.div key={link.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-elevated p-4 flex items-start gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {link.title.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {link.pinned && <Pin size={10} className="text-warning" />}
                <span className="text-sm font-medium text-card-foreground truncate">{link.title}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{link.description}</p>
              <span className="badge-muted text-[10px] mt-1">{link.category}</span>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink size={12} /></a>
              <button onClick={() => navigator.clipboard.writeText(link.url)} className="text-muted-foreground hover:text-foreground"><Copy size={12} /></button>
              <button onClick={() => updateData({ links: links.filter(l => l.id !== link.id) })} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
