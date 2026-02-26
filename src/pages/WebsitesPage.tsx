import { useDashboard } from "@/contexts/DashboardContext";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, ExternalLink, Copy, Eye, EyeOff, Globe, Edit2, Trash2,
  LayoutGrid, List, Shield, Server, Key, Lock, Unlock, ChevronDown, ChevronRight,
  Activity, AlertTriangle, CheckCircle2, Clock, ArrowUpRight,
  Filter, SortAsc, SortDesc, Layers, Tag, Puzzle, MoreVertical,
  RefreshCw, Archive, Zap, TrendingUp, BarChart3
} from "lucide-react";
import FormModal, { FormField, FormInput, FormTextarea, FormSelect, FormTagsInput } from "@/components/FormModal";
import type { Website } from "@/lib/store";
import { toast } from "sonner";

// ─── Constants ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string; border: string; glow: string }> = {
  active: { label: 'Active', color: 'text-emerald-500', icon: CheckCircle2, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
  maintenance: { label: 'Maintenance', color: 'text-amber-500', icon: RefreshCw, bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
  down: { label: 'Down', color: 'text-red-500', icon: AlertTriangle, bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-red-500/10' },
  archived: { label: 'Archived', color: 'text-zinc-400', icon: Archive, bg: 'bg-zinc-500/10', border: 'border-zinc-500/20', glow: 'shadow-zinc-500/10' },
};

const CATEGORY_CONFIG: Record<string, { gradient: string; emoji: string }> = {
  'Client Site': { gradient: 'from-blue-500 to-cyan-500', emoji: '👔' },
  'E-Commerce': { gradient: 'from-purple-500 to-pink-500', emoji: '🛒' },
  'Personal': { gradient: 'from-indigo-500 to-violet-500', emoji: '🏠' },
  'Blog': { gradient: 'from-green-500 to-emerald-500', emoji: '📝' },
  'SaaS': { gradient: 'from-orange-500 to-amber-500', emoji: '🚀' },
  'Portfolio': { gradient: 'from-rose-500 to-pink-500', emoji: '🎨' },
};

type SortField = 'name' | 'status' | 'category' | 'dateAdded' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

const emptyWebsite: Omit<Website, "id"> = {
  name: "", url: "", wpAdminUrl: "", wpUsername: "", wpPassword: "",
  hostingProvider: "", hostingLoginUrl: "", hostingUsername: "", hostingPassword: "",
  category: "Personal", status: "active", notes: "", plugins: [],
  dateAdded: new Date().toISOString().split("T")[0],
  lastUpdated: new Date().toISOString().split("T")[0],
};

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: Math.min(i * 0.04, 0.5), duration: 0.35 },
});

// ─── Component ──────────────────────────────────────────────────────────────────

export default function WebsitesPage() {
  const { websites, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortField, setSortField] = useState<SortField>("lastUpdated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyWebsite);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ─── Derived data ──────────────────────────────────────────────

  const categories = useMemo(() => {
    const cats = new Set(websites.map(w => w.category));
    return Array.from(cats).sort();
  }, [websites]);

  const hostingProviders = useMemo(() => {
    const providers = new Set(websites.map(w => w.hostingProvider).filter(Boolean));
    return Array.from(providers).sort();
  }, [websites]);

  const filtered = useMemo(() => {
    return websites
      .filter(w => filterStatus === "all" || w.status === filterStatus)
      .filter(w => filterCategory === "all" || w.category === filterCategory)
      .filter(w => {
        const q = search.toLowerCase();
        return w.name.toLowerCase().includes(q) ||
          w.url.toLowerCase().includes(q) ||
          w.hostingProvider.toLowerCase().includes(q) ||
          w.category.toLowerCase().includes(q) ||
          (w.notes && w.notes.toLowerCase().includes(q));
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case 'name': cmp = a.name.localeCompare(b.name); break;
          case 'status': cmp = a.status.localeCompare(b.status); break;
          case 'category': cmp = a.category.localeCompare(b.category); break;
          case 'dateAdded': cmp = a.dateAdded.localeCompare(b.dateAdded); break;
          case 'lastUpdated': cmp = a.lastUpdated.localeCompare(b.lastUpdated); break;
        }
        return sortDirection === 'desc' ? -cmp : cmp;
      });
  }, [websites, filterStatus, filterCategory, search, sortField, sortDirection]);

  // Stats
  const stats = useMemo(() => ({
    total: websites.length,
    active: websites.filter(w => w.status === 'active').length,
    maintenance: websites.filter(w => w.status === 'maintenance').length,
    down: websites.filter(w => w.status === 'down').length,
    archived: websites.filter(w => w.status === 'archived').length,
    withWP: websites.filter(w => w.wpAdminUrl).length,
    providers: new Set(websites.map(w => w.hostingProvider).filter(Boolean)).size,
    totalPlugins: websites.reduce((sum, w) => sum + w.plugins.length, 0),
  }), [websites]);

  // ─── Actions ───────────────────────────────────────────────────

  const toggleReveal = useCallback((key: string) => {
    setRevealedPasswords(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else {
        n.add(key);
        setTimeout(() => setRevealedPasswords(p => { const x = new Set(p); x.delete(key); return x; }), 10000);
      }
      return n;
    });
  }, []);

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  }, []);

  const openAdd = () => { setEditId(null); setForm(emptyWebsite); setModalOpen(true); };
  const openEdit = (site: Website) => { setEditId(site.id); const { id, ...rest } = site; setForm(rest); setModalOpen(true); };

  const saveForm = () => {
    if (!form.name.trim()) { toast.error("Website name is required."); return; }
    const now = new Date().toISOString().split("T")[0];
    if (editId) {
      updateData({ websites: websites.map(w => w.id === editId ? { ...w, ...form, lastUpdated: now } : w) });
      toast.success("Website updated successfully");
    } else {
      updateData({ websites: [{ id: Math.random().toString(36).slice(2, 10), ...form, dateAdded: now, lastUpdated: now }, ...websites] });
      toast.success("Website added successfully");
    }
    setModalOpen(false);
  };

  const deleteWebsite = (id: string) => {
    if (!confirm("Are you sure you want to delete this website? This action cannot be undone.")) return;
    updateData({ websites: websites.filter(w => w.id !== id) });
    toast.success("Website deleted");
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const uf = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  const ensureUrl = (url: string) => url.match(/^https?:\/\//) ? url : `https://${url}`;

  // ─── Render helpers ────────────────────────────────────────────

  const renderStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
        <Icon size={11} /> {cfg.label}
      </span>
    );
  };

  const renderCredentialField = (label: string, value: string, siteId: string, isPassword?: boolean) => {
    if (!value) return null;
    const revealKey = `${siteId}-${label}`;
    const isRevealed = revealedPasswords.has(revealKey);

    return (
      <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all group/cred">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider w-14 flex-shrink-0">{label}</span>
          <span className="text-xs text-card-foreground font-mono truncate">
            {isPassword && !isRevealed ? '••••••••••' : value}
          </span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover/cred:opacity-100 transition-opacity">
          {isPassword && (
            <button onClick={() => toggleReveal(revealKey)} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          )}
          <button onClick={() => copyText(value)} className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors">
            <Copy size={11} />
          </button>
        </div>
      </div>
    );
  };

  // ─── Grid card ─────────────────────────────────────────────────

  const renderGridCard = (site: Website, i: number) => {
    const catConfig = CATEGORY_CONFIG[site.category] || { gradient: 'from-zinc-500 to-zinc-600', emoji: '🌐' };
    const statusCfg = STATUS_CONFIG[site.status] || STATUS_CONFIG.active;
    const isExpanded = expandedSite === site.id;
    const hasCredentials = site.wpUsername || site.hostingUsername;

    return (
      <motion.div key={site.id} {...fadeUp(i)}
        className="group relative bg-card rounded-2xl border border-border/30 hover:border-border/60 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-primary/5">

        {/* Top accent bar */}
        <div className={`h-1 bg-gradient-to-r ${catConfig.gradient}`} />

        {/* Header with favicon-like avatar */}
        <div className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${catConfig.gradient} flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md shadow-primary/10`}>
                {site.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-card-foreground text-[15px] truncate leading-tight">{site.name}</h3>
                <a href={ensureUrl(site.url)} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block mt-0.5 font-mono">
                  {site.url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
            {renderStatusBadge(site.status)}
          </div>

          {/* Quick info badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gradient-to-r ${catConfig.gradient} text-white`}>
              {catConfig.emoji} {site.category}
            </span>
            {site.hostingProvider && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-secondary/50 text-muted-foreground border border-border/20">
                <Server size={9} /> {site.hostingProvider}
              </span>
            )}
            {site.wpAdminUrl && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/15">
                <Globe size={9} /> WordPress
              </span>
            )}
            {site.plugins.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-500 border border-violet-500/15">
                <Puzzle size={9} /> {site.plugins.length} plugins
              </span>
            )}
          </div>

          {/* Quick links row */}
          <div className="flex items-center gap-2 border-t border-border/15 pt-3 mb-2">
            <a href={ensureUrl(site.url)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-primary/8 text-primary hover:bg-primary/15 transition-all border border-primary/10">
              <ExternalLink size={11} /> Visit Site
            </a>
            {site.wpAdminUrl && (
              <a href={ensureUrl(site.wpAdminUrl)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-secondary/50 text-muted-foreground hover:text-foreground transition-all border border-border/20">
                <Lock size={11} /> WP Admin
              </a>
            )}
            {site.hostingLoginUrl && (
              <a href={ensureUrl(site.hostingLoginUrl)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-secondary/50 text-muted-foreground hover:text-foreground transition-all border border-border/20">
                <Server size={11} /> Hosting
              </a>
            )}
          </div>

          {/* Expandable credentials section */}
          {hasCredentials && (
            <div className="mt-2">
              <button onClick={() => setExpandedSite(isExpanded ? null : site.id)}
                className="flex items-center gap-1.5 w-full px-2.5 py-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-all border border-border/15 text-xs font-semibold text-muted-foreground">
                <Shield size={12} className="text-amber-500" />
                <span>Credentials & Access</span>
                <span className="ml-auto">
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1 p-2.5 rounded-xl bg-secondary/15 border border-border/15">
                      {site.wpUsername && <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 pb-1">WordPress</div>}
                      {renderCredentialField('User', site.wpUsername, site.id)}
                      {renderCredentialField('Pass', site.wpPassword, site.id, true)}
                      {site.hostingUsername && <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 pb-1 pt-2">Hosting</div>}
                      {renderCredentialField('User', site.hostingUsername, `${site.id}-host`)}
                      {renderCredentialField('Pass', site.hostingPassword, `${site.id}-host`, true)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Plugins */}
          {site.plugins.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {site.plugins.map(p => (
                <span key={p} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/40 text-muted-foreground border border-border/10 font-medium">{p}</span>
              ))}
            </div>
          )}

          {/* Notes */}
          {site.notes && (
            <p className="mt-2.5 text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2 italic">{site.notes}</p>
          )}
        </div>

        {/* Footer with meta & actions */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-secondary/8 border-t border-border/15">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 font-medium">
            <span className="flex items-center gap-1"><Clock size={9} /> Added {site.dateAdded}</span>
            <span className="flex items-center gap-1"><RefreshCw size={9} /> Updated {site.lastUpdated}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEdit(site)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
              <Edit2 size={13} />
            </button>
            <button onClick={() => deleteWebsite(site.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── List row ──────────────────────────────────────────────────

  const renderListRow = (site: Website, i: number) => {
    const catConfig = CATEGORY_CONFIG[site.category] || { gradient: 'from-zinc-500 to-zinc-600', emoji: '🌐' };
    const hasCredentials = site.wpUsername || site.hostingUsername;
    const isExpanded = expandedSite === site.id;

    return (
      <motion.div key={site.id} {...fadeUp(i)}
        className="group bg-card rounded-xl border border-border/20 hover:border-border/50 transition-all overflow-hidden hover:shadow-md">
        <div className="flex items-center gap-4 px-5 py-3.5">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${catConfig.gradient} flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-sm`}>
            {site.name.charAt(0).toUpperCase()}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-card-foreground text-sm truncate">{site.name}</h3>
              {renderStatusBadge(site.status)}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <a href={ensureUrl(site.url)} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-mono truncate max-w-xs">
                {site.url.replace(/^https?:\/\//, '')}
              </a>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1">{catConfig.emoji} {site.category}</span>
              {site.hostingProvider && <><span className="text-border">·</span><span className="flex items-center gap-1"><Server size={10} /> {site.hostingProvider}</span></>}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a href={ensureUrl(site.url)} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
              <ExternalLink size={14} />
            </a>
            {site.wpAdminUrl && (
              <a href={ensureUrl(site.wpAdminUrl)} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-all">
                <Lock size={14} />
              </a>
            )}
            {hasCredentials && (
              <button onClick={() => setExpandedSite(isExpanded ? null : site.id)}
                className={`p-2 rounded-lg transition-all ${isExpanded ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10'}`}>
                <Shield size={14} />
              </button>
            )}
            <button onClick={() => openEdit(site)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all opacity-0 group-hover:opacity-100">
              <Edit2 size={14} />
            </button>
            <button onClick={() => deleteWebsite(site.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Expandable details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 pt-1 border-t border-border/15">
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {(site.wpUsername || site.wpPassword) && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">WordPress Credentials</div>
                      {renderCredentialField('User', site.wpUsername, site.id)}
                      {renderCredentialField('Pass', site.wpPassword, site.id, true)}
                    </div>
                  )}
                  {(site.hostingUsername || site.hostingPassword) && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hosting Credentials</div>
                      {renderCredentialField('User', site.hostingUsername, `${site.id}-host`)}
                      {renderCredentialField('Pass', site.hostingPassword, `${site.id}-host`, true)}
                    </div>
                  )}
                </div>
                {site.plugins.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Plugins</div>
                    <div className="flex flex-wrap gap-1">
                      {site.plugins.map(p => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/50 text-muted-foreground font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {site.notes && (
                  <div className="mt-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</div>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed">{site.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ─── Main render ───────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">My Websites</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            Manage all your websites, credentials, and hosting from one place
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
          <Plus size={16} /> Add Website
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: 'Total', value: stats.total, icon: Globe, color: 'text-foreground', bg: 'bg-secondary/30' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/8' },
          { label: 'Maintenance', value: stats.maintenance, icon: RefreshCw, color: 'text-amber-500', bg: 'bg-amber-500/8' },
          { label: 'Down', value: stats.down, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/8' },
          { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-zinc-400', bg: 'bg-zinc-500/8' },
          { label: 'WordPress', value: stats.withWP, icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/8' },
          { label: 'Providers', value: stats.providers, icon: Server, color: 'text-purple-500', bg: 'bg-purple-500/8' },
          { label: 'Plugins', value: stats.totalPlugins, icon: Puzzle, color: 'text-violet-500', bg: 'bg-violet-500/8' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3 border border-border/15 text-center`}>
              <Icon size={14} className={`${stat.color} mx-auto mb-1`} />
              <div className={`text-lg font-extrabold ${stat.color} tabular-nums`}>{stat.value}</div>
              <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-secondary/50 rounded-xl px-3.5 py-2.5 gap-2 flex-1 max-w-sm border border-border/20">
          <Search size={15} className="text-muted-foreground flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sites, URLs, providers..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none w-full" />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1 bg-secondary/30 rounded-xl p-1 border border-border/15">
          {["all", "active", "maintenance", "down", "archived"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s
                ? "bg-card text-card-foreground shadow-sm border border-border/30"
                : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : STATUS_CONFIG[s]?.label || s}
              {s !== "all" && (
                <span className="ml-1 text-[10px] opacity-60">
                  {s === "active" ? stats.active : s === "maintenance" ? stats.maintenance : s === "down" ? stats.down : stats.archived}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Additional filters toggle */}
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${showFilters ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/30 text-muted-foreground border-border/15 hover:text-foreground'}`}>
          <Filter size={13} /> Filters
          {filterCategory !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </button>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <select value={sortField} onChange={e => toggleSort(e.target.value as SortField)}
            className="px-2.5 py-2 rounded-xl bg-secondary/30 text-xs font-semibold text-muted-foreground border border-border/15 outline-none cursor-pointer">
            <option value="lastUpdated">Last Updated</option>
            <option value="dateAdded">Date Added</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="category">Category</option>
          </select>
          <button onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-xl bg-secondary/30 text-muted-foreground hover:text-foreground transition-all border border-border/15">
            {sortDirection === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />}
          </button>

          {/* View mode */}
          <div className="flex items-center gap-0.5 bg-secondary/30 rounded-xl p-1 border border-border/15 ml-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Extended filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-secondary/15 border border-border/15">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Category</label>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setFilterCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${filterCategory === 'all' ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}>
                    All
                  </button>
                  {categories.map(cat => {
                    const config = CATEGORY_CONFIG[cat] || { emoji: '🌐' };
                    return (
                      <button key={cat} onClick={() => setFilterCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${filterCategory === cat ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'}`}>
                        {config.emoji} {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              {hostingProviders.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Hosting Providers</label>
                  <div className="flex flex-wrap gap-1">
                    {hostingProviders.map(p => (
                      <span key={p} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary/50 text-muted-foreground">
                        <Server size={9} className="inline mr-1" />{p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <div className="text-xs text-muted-foreground font-medium">
        Showing {filtered.length} of {websites.length} websites
        {search && <span> matching <span className="text-primary font-semibold">"{search}"</span></span>}
      </div>

      {/* Main content */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((site, i) => renderGridCard(site, i))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((site, i) => renderListRow(site, i))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary/30 flex items-center justify-center mb-4">
            <Globe size={36} className="text-muted-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-card-foreground mb-1">No websites found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || filterStatus !== 'all' || filterCategory !== 'all'
              ? "Try adjusting your search or filters"
              : "Add your first website to get started"}
          </p>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            <Plus size={16} /> Add Website
          </button>
        </div>
      )}

      {/* ─── Modal ─────────────────────────────────────────────── */}
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Website" : "Add Website"} onSubmit={saveForm} size="lg">
        <div className="space-y-5">
          {/* Section: Basic Info */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe size={13} className="text-primary" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Site Name *"><FormInput value={form.name} onChange={v => uf("name", v)} placeholder="My Awesome Site" /></FormField>
              <FormField label="URL *"><FormInput value={form.url} onChange={v => uf("url", v)} placeholder="https://example.com" /></FormField>
              <FormField label="Category">
                <FormSelect value={form.category} onChange={v => uf("category", v)} options={[
                  { value: "Personal", label: "🏠 Personal" }, { value: "Client Site", label: "👔 Client Site" },
                  { value: "E-Commerce", label: "🛒 E-Commerce" }, { value: "Blog", label: "📝 Blog" },
                  { value: "SaaS", label: "🚀 SaaS" }, { value: "Portfolio", label: "🎨 Portfolio" },
                ]} />
              </FormField>
              <FormField label="Status">
                <FormSelect value={form.status} onChange={v => uf("status", v as any)} options={[
                  { value: "active", label: "✅ Active" }, { value: "maintenance", label: "🔧 Maintenance" },
                  { value: "down", label: "🔴 Down" }, { value: "archived", label: "📦 Archived" },
                ]} />
              </FormField>
            </div>
          </div>

          {/* Section: WordPress */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lock size={13} className="text-blue-500" /> WordPress Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="WP Admin URL"><FormInput value={form.wpAdminUrl} onChange={v => uf("wpAdminUrl", v)} placeholder="https://site.com/wp-admin/" /></FormField>
              <FormField label="WP Username"><FormInput value={form.wpUsername} onChange={v => uf("wpUsername", v)} placeholder="admin" /></FormField>
              <FormField label="WP Password"><FormInput value={form.wpPassword} onChange={v => uf("wpPassword", v)} placeholder="••••••" type="password" /></FormField>
            </div>
          </div>

          {/* Section: Hosting */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Server size={13} className="text-purple-500" /> Hosting Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Hosting Provider"><FormInput value={form.hostingProvider} onChange={v => uf("hostingProvider", v)} placeholder="SiteGround, Cloudways, etc." /></FormField>
              <FormField label="Hosting Login URL"><FormInput value={form.hostingLoginUrl} onChange={v => uf("hostingLoginUrl", v)} placeholder="https://my.host.com" /></FormField>
              <FormField label="Hosting Username"><FormInput value={form.hostingUsername} onChange={v => uf("hostingUsername", v)} placeholder="Username" /></FormField>
              <FormField label="Hosting Password"><FormInput value={form.hostingPassword} onChange={v => uf("hostingPassword", v)} type="password" placeholder="••••••" /></FormField>
            </div>
          </div>

          {/* Section: Details */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers size={13} className="text-emerald-500" /> Additional Details
            </h3>
            <FormField label="Plugins"><FormTagsInput value={form.plugins} onChange={v => uf("plugins", v)} placeholder="Add plugin name and press Enter" /></FormField>
            <div className="mt-4">
              <FormField label="Notes"><FormTextarea value={form.notes} onChange={v => uf("notes", v)} placeholder="Quick notes about this site..." /></FormField>
            </div>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
