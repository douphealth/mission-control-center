import { motion } from "framer-motion";
import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { Search, TrendingUp, TrendingDown, ExternalLink, AlertTriangle, Plus, Edit2, Trash2, BarChart3 } from "lucide-react";
import FormModal, { FormField, FormInput, FormSelect } from "@/components/FormModal";
import { toast } from "sonner";

interface SEOSite {
  id: string;
  name: string;
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  clicksTrend: number;
  indexedPages: number;
  crawlErrors: number;
  lastUpdated: string;
}

const defaultSites: SEOSite[] = [
  { id: "s1", name: "Agency Demo", url: "https://agency-demo.com", clicks: 1240, impressions: 45200, ctr: 2.7, avgPosition: 14.2, clicksTrend: 12, indexedPages: 48, crawlErrors: 0, lastUpdated: "2026-02-25" },
  { id: "s2", name: "Fashion Store", url: "https://fashion-store.com", clicks: 3800, impressions: 89500, ctr: 4.2, avgPosition: 8.5, clicksTrend: -3, indexedPages: 520, crawlErrors: 2, lastUpdated: "2026-02-25" },
  { id: "s3", name: "Tech Blog", url: "https://techinsights-blog.com", clicks: 890, impressions: 22300, ctr: 3.9, avgPosition: 11.7, clicksTrend: 18, indexedPages: 156, crawlErrors: 0, lastUpdated: "2026-02-24" },
];

export default function SEOPage() {
  const [sites, setSites] = useState<SEOSite[]>(() => {
    try { const s = localStorage.getItem("mc-seo"); return s ? JSON.parse(s) : defaultSites; } catch { return defaultSites; }
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<SEOSite>>({});

  const save = (s: SEOSite[]) => { setSites(s); localStorage.setItem("mc-seo", JSON.stringify(s)); };

  const totalClicks = sites.reduce((s, x) => s + x.clicks, 0);
  const totalImpressions = sites.reduce((s, x) => s + x.impressions, 0);
  const totalErrors = sites.reduce((s, x) => s + x.crawlErrors, 0);

  const openAdd = () => { setEditId(null); setForm({ name: "", url: "", clicks: 0, impressions: 0, ctr: 0, avgPosition: 0, clicksTrend: 0, indexedPages: 0, crawlErrors: 0, lastUpdated: new Date().toISOString().split("T")[0] }); setModalOpen(true); };
  const openEdit = (s: SEOSite) => { setEditId(s.id); setForm(s); setModalOpen(true); };
  const saveForm = () => {
    if (!form.name) return;
    if (editId) {
      save(sites.map(s => s.id === editId ? { ...s, ...form } as SEOSite : s));
      toast.success("SEO data updated");
    } else {
      save([{ id: Math.random().toString(36).slice(2, 10), ...form } as SEOSite, ...sites]);
      toast.success("Site added to SEO tracking");
    }
    setModalOpen(false);
  };
  const deleteSite = (id: string) => { save(sites.filter(s => s.id !== id)); toast.success("Removed"); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SEO Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Google Search Console & SEO monitoring</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
          <Plus size={16} /> Add Site
        </button>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">Total Clicks (28d)</div>
          <div className="text-2xl font-bold text-card-foreground">{totalClicks.toLocaleString()}</div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-xs text-muted-foreground">Total Impressions</div>
          <div className="text-2xl font-bold text-card-foreground">{totalImpressions.toLocaleString()}</div>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Crawl Errors</div>
            {totalErrors > 0 && <AlertTriangle size={12} className="text-destructive" />}
          </div>
          <div className={`text-2xl font-bold ${totalErrors > 0 ? "text-destructive" : "text-success"}`}>{totalErrors}</div>
        </div>
      </div>

      {/* Site Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sites.map((site, i) => (
          <motion.div key={site.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card-elevated p-5 space-y-4 group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-card-foreground">{site.name}</h3>
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">{site.url} <ExternalLink size={10} /></a>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(site)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={13} /></button>
                <button onClick={() => deleteSite(site.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Clicks", value: site.clicks.toLocaleString(), trend: site.clicksTrend },
                { label: "Impressions", value: site.impressions.toLocaleString(), trend: null },
                { label: "CTR", value: `${site.ctr}%`, trend: null },
                { label: "Avg Position", value: site.avgPosition.toFixed(1), trend: null },
              ].map(m => (
                <div key={m.label} className="text-center p-2 rounded-xl bg-secondary/50">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-sm font-bold text-card-foreground">{m.value}</div>
                  {m.trend !== null && (
                    <div className={`text-[10px] flex items-center justify-center gap-0.5 ${m.trend >= 0 ? "text-success" : "text-destructive"}`}>
                      {m.trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(m.trend)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{site.indexedPages} indexed pages</span>
              {site.crawlErrors > 0 ? (
                <span className="text-destructive flex items-center gap-1"><AlertTriangle size={10} /> {site.crawlErrors} crawl errors</span>
              ) : (
                <span className="text-success">✅ No errors</span>
              )}
              <span>Updated {site.lastUpdated}</span>
            </div>
            <a href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(site.url)}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1">📊 Open in Google Search Console <ExternalLink size={10} /></a>
          </motion.div>
        ))}
      </div>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit SEO Data" : "Add Site"} onSubmit={saveForm}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Site Name *"><FormInput value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="My Site" /></FormField>
          <FormField label="URL"><FormInput value={form.url || ""} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." /></FormField>
          <FormField label="Clicks"><FormInput value={String(form.clicks || 0)} onChange={v => setForm(f => ({ ...f, clicks: parseInt(v) || 0 }))} type="number" /></FormField>
          <FormField label="Impressions"><FormInput value={String(form.impressions || 0)} onChange={v => setForm(f => ({ ...f, impressions: parseInt(v) || 0 }))} type="number" /></FormField>
          <FormField label="CTR %"><FormInput value={String(form.ctr || 0)} onChange={v => setForm(f => ({ ...f, ctr: parseFloat(v) || 0 }))} type="number" /></FormField>
          <FormField label="Avg Position"><FormInput value={String(form.avgPosition || 0)} onChange={v => setForm(f => ({ ...f, avgPosition: parseFloat(v) || 0 }))} type="number" /></FormField>
          <FormField label="Indexed Pages"><FormInput value={String(form.indexedPages || 0)} onChange={v => setForm(f => ({ ...f, indexedPages: parseInt(v) || 0 }))} type="number" /></FormField>
          <FormField label="Crawl Errors"><FormInput value={String(form.crawlErrors || 0)} onChange={v => setForm(f => ({ ...f, crawlErrors: parseInt(v) || 0 }))} type="number" /></FormField>
        </div>
      </FormModal>
    </div>
  );
}
