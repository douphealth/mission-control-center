import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, ExternalLink, Copy, Eye, EyeOff, Globe, Edit2, Trash2, LayoutGrid, List } from "lucide-react";
import FormModal, { FormField, FormInput, FormTextarea, FormSelect, FormTagsInput } from "@/components/FormModal";
import type { Website } from "@/lib/store";
import { toast } from "sonner";

const statusBadge: Record<string, string> = { active: "badge-success", maintenance: "badge-warning", down: "badge-destructive", archived: "badge-muted" };
const categoryColors: Record<string, string> = { "Client Site": "badge-info", "E-Commerce": "badge-primary", Personal: "badge-muted", Blog: "badge-success", SaaS: "badge-warning", Portfolio: "badge-primary" };

const emptyWebsite: Omit<Website, "id"> = { name: "", url: "", wpAdminUrl: "", wpUsername: "", wpPassword: "", hostingProvider: "", hostingLoginUrl: "", hostingUsername: "", hostingPassword: "", category: "Personal", status: "active", notes: "", plugins: [], dateAdded: new Date().toISOString().split("T")[0], lastUpdated: new Date().toISOString().split("T")[0] };

export default function WebsitesPage() {
  const { websites, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyWebsite);

  const filtered = websites
    .filter(w => filterStatus === "all" || w.status === filterStatus)
    .filter(w => w.name.toLowerCase().includes(search.toLowerCase()) || w.url.toLowerCase().includes(search.toLowerCase()));

  const toggleReveal = (key: string) => {
    setRevealedPasswords(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else { n.add(key); setTimeout(() => setRevealedPasswords(p => { const x = new Set(p); x.delete(key); return x; }), 10000); }
      return n;
    });
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const openAdd = () => { setEditId(null); setForm(emptyWebsite); setModalOpen(true); };
  const openEdit = (site: Website) => { setEditId(site.id); const { id, ...rest } = site; setForm(rest); setModalOpen(true); };
  const saveForm = () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString().split("T")[0];
    if (editId) {
      updateData({ websites: websites.map(w => w.id === editId ? { ...w, ...form, lastUpdated: now } : w) });
      toast.success("Website updated");
    } else {
      updateData({ websites: [{ id: Math.random().toString(36).slice(2, 10), ...form, dateAdded: now, lastUpdated: now }, ...websites] });
      toast.success("Website added");
    }
    setModalOpen(false);
  };

  const deleteWebsite = (id: string) => {
    if (!confirm("Delete this website?")) return;
    updateData({ websites: websites.filter(w => w.id !== id) });
    toast.success("Website deleted");
  };

  const uf = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Websites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{websites.length} sites · {websites.filter(w => w.status === "active").length} active</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
          <Plus size={16} /> Add Website
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-secondary rounded-xl px-3 py-2 gap-2 flex-1 max-w-xs">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {["all", "active", "maintenance", "down", "archived"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 ml-auto">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-card shadow-sm" : ""}`}><LayoutGrid size={14} className={viewMode === "grid" ? "text-foreground" : "text-muted-foreground"} /></button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-card shadow-sm" : ""}`}><List size={14} className={viewMode === "list" ? "text-foreground" : "text-muted-foreground"} /></button>
        </div>
      </div>

      {/* Grid */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-2"}>
        {filtered.map((site, i) => (
          <motion.div key={site.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={viewMode === "grid" ? "card-elevated overflow-hidden group" : "card-elevated p-4 flex items-center gap-4 group"}>
            {viewMode === "grid" && (
              <div className="h-28 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center relative">
                <span className="text-5xl font-black text-primary/20">{site.name.charAt(0)}</span>
                <div className="absolute top-3 right-3"><span className={statusBadge[site.status]}>{site.status}</span></div>
              </div>
            )}
            <div className={viewMode === "grid" ? "p-4 space-y-3" : "flex-1 min-w-0"}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-card-foreground">{site.name}</h3>
                {viewMode === "list" && <span className={statusBadge[site.status]}>{site.status}</span>}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <Globe size={12} className="text-muted-foreground flex-shrink-0" />
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">{site.url}</a>
                  <button onClick={() => copyText(site.url)} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={11} /></button>
                </div>
                {site.wpAdminUrl && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-[11px]">🔧</span>
                    <a href={site.wpAdminUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">WP Admin</a>
                    <button onClick={() => copyText(site.wpAdminUrl)} className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={11} /></button>
                  </div>
                )}
              </div>
              {site.wpUsername && viewMode === "grid" && (
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
                      <span className="text-card-foreground font-mono text-xs">{revealedPasswords.has(site.id) ? site.wpPassword : "••••••"}</span>
                      <button onClick={() => toggleReveal(site.id)} className="text-muted-foreground hover:text-foreground">
                        {revealedPasswords.has(site.id) ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                      <button onClick={() => copyText(site.wpPassword)} className="text-muted-foreground hover:text-foreground"><Copy size={10} /></button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                <span className={categoryColors[site.category] || "badge-muted"}>{site.category}</span>
                {site.hostingProvider && <span className="badge-muted">{site.hostingProvider}</span>}
              </div>
              {site.plugins.length > 0 && viewMode === "grid" && (
                <div className="flex flex-wrap gap-1">
                  {site.plugins.map(p => <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{p}</span>)}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink size={12} /> Visit</a>
                {site.wpAdminUrl && <a href={site.wpAdminUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">🔧 Admin</a>}
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(site)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={13} /></button>
                  <button onClick={() => deleteWebsite(site.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
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
          <button onClick={openAdd} className="mt-3 text-sm text-primary hover:underline">+ Add your first website</button>
        </div>
      )}

      {/* Modal */}
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Website" : "Add Website"} onSubmit={saveForm} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Site Name *"><FormInput value={form.name} onChange={v => uf("name", v)} placeholder="My Awesome Site" /></FormField>
          <FormField label="URL *"><FormInput value={form.url} onChange={v => uf("url", v)} placeholder="https://example.com" /></FormField>
          <FormField label="WP Admin URL"><FormInput value={form.wpAdminUrl} onChange={v => uf("wpAdminUrl", v)} placeholder="https://example.com/wp-admin/" /></FormField>
          <FormField label="WP Username"><FormInput value={form.wpUsername} onChange={v => uf("wpUsername", v)} placeholder="admin" /></FormField>
          <FormField label="WP Password"><FormInput value={form.wpPassword} onChange={v => uf("wpPassword", v)} placeholder="••••••" type="password" /></FormField>
          <FormField label="Hosting Provider"><FormInput value={form.hostingProvider} onChange={v => uf("hostingProvider", v)} placeholder="SiteGround" /></FormField>
          <FormField label="Hosting Login URL"><FormInput value={form.hostingLoginUrl} onChange={v => uf("hostingLoginUrl", v)} placeholder="https://my.host.com" /></FormField>
          <FormField label="Hosting Username"><FormInput value={form.hostingUsername} onChange={v => uf("hostingUsername", v)} /></FormField>
          <FormField label="Hosting Password"><FormInput value={form.hostingPassword} onChange={v => uf("hostingPassword", v)} type="password" /></FormField>
          <FormField label="Category">
            <FormSelect value={form.category} onChange={v => uf("category", v)} options={[
              { value: "Personal", label: "Personal" }, { value: "Client Site", label: "Client Site" }, { value: "E-Commerce", label: "E-Commerce" },
              { value: "Blog", label: "Blog" }, { value: "SaaS", label: "SaaS" }, { value: "Portfolio", label: "Portfolio" },
            ]} />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={v => uf("status", v as any)} options={[
              { value: "active", label: "Active" }, { value: "maintenance", label: "Maintenance" }, { value: "down", label: "Down" }, { value: "archived", label: "Archived" },
            ]} />
          </FormField>
        </div>
        <FormField label="Plugins"><FormTagsInput value={form.plugins} onChange={v => uf("plugins", v)} placeholder="Add plugin name and press Enter" /></FormField>
        <FormField label="Notes"><FormTextarea value={form.notes} onChange={v => uf("notes", v)} placeholder="Quick notes about this site..." /></FormField>
      </FormModal>
    </div>
  );
}
