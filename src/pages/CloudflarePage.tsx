import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Edit2, Trash2, ExternalLink, Shield, Globe, RefreshCw } from "lucide-react";
import FormModal, { FormField, FormInput, FormSelect } from "@/components/FormModal";
import { toast } from "sonner";

interface CFZone {
  id: string;
  domain: string;
  status: "active" | "pending" | "moved";
  securityLevel: string;
  sslMode: string;
  requests24h: number;
  cachedPercent: number;
  threatsBlocked: number;
  alwaysHttps: boolean;
}

const defaults: CFZone[] = [
  { id: "cf1", domain: "agency-demo.com", status: "active", securityLevel: "Medium", sslMode: "Full (Strict)", requests24h: 12500, cachedPercent: 78, threatsBlocked: 3, alwaysHttps: true },
  { id: "cf2", domain: "fashion-store.com", status: "active", securityLevel: "High", sslMode: "Full (Strict)", requests24h: 45200, cachedPercent: 85, threatsBlocked: 12, alwaysHttps: true },
  { id: "cf3", domain: "techinsights-blog.com", status: "active", securityLevel: "Medium", sslMode: "Full", requests24h: 8700, cachedPercent: 72, threatsBlocked: 0, alwaysHttps: true },
];

export default function CloudflarePage() {
  const [zones, setZones] = useState<CFZone[]>(() => {
    try { const s = localStorage.getItem("mc-cf"); return s ? JSON.parse(s) : defaults; } catch { return defaults; }
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<CFZone>>({});

  const save = (z: CFZone[]) => { setZones(z); localStorage.setItem("mc-cf", JSON.stringify(z)); };

  const openAdd = () => { setEditId(null); setForm({ domain: "", status: "active", securityLevel: "Medium", sslMode: "Full (Strict)", requests24h: 0, cachedPercent: 0, threatsBlocked: 0, alwaysHttps: true }); setModalOpen(true); };
  const openEdit = (z: CFZone) => { setEditId(z.id); setForm(z); setModalOpen(true); };
  const saveForm = () => {
    if (!form.domain) return;
    if (editId) { save(zones.map(z => z.id === editId ? { ...z, ...form } as CFZone : z)); toast.success("Zone updated"); }
    else { save([{ id: Math.random().toString(36).slice(2, 10), ...form } as CFZone, ...zones]); toast.success("Zone added"); }
    setModalOpen(false);
  };
  const deleteZone = (id: string) => { save(zones.filter(z => z.id !== id)); toast.success("Zone removed"); };

  const systemServices = [
    { name: "CDN / Cache", status: "operational" },
    { name: "DNS Resolution", status: "operational" },
    { name: "SSL Provisioning", status: "operational" },
    { name: "Cloudflare Pages", status: "operational" },
    { name: "Workers", status: "operational" },
    { name: "DDoS Protection", status: "operational" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cloudflare Command Center</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{zones.length} zones managed</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-sm text-card-foreground hover:bg-secondary/80 transition-colors">
            ☁️ Open Cloudflare
          </a>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
            <Plus size={16} /> Add Zone
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-card-foreground text-sm">System Status</h3>
          <span className="badge-success">🟢 All Systems Operational</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {systemServices.map(s => (
            <div key={s.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
              <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
              <span className="text-xs text-card-foreground truncate">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {zones.map((zone, i) => (
          <motion.div key={zone.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card-elevated p-5 space-y-4 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-info" />
                <h3 className="font-semibold text-card-foreground">{zone.domain}</h3>
                <span className="badge-success text-[10px]">{zone.status}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(zone)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={13} /></button>
                <button onClick={() => deleteZone(zone.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-xl bg-secondary/50">
                <div className="text-xs text-muted-foreground">Requests 24h</div>
                <div className="text-sm font-bold text-card-foreground">{zone.requests24h.toLocaleString()}</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-secondary/50">
                <div className="text-xs text-muted-foreground">Cached</div>
                <div className="text-sm font-bold text-success">{zone.cachedPercent}%</div>
              </div>
              <div className="text-center p-2 rounded-xl bg-secondary/50">
                <div className="text-xs text-muted-foreground">Threats</div>
                <div className={`text-sm font-bold ${zone.threatsBlocked > 0 ? "text-destructive" : "text-success"}`}>{zone.threatsBlocked}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 badge-muted"><Shield size={10} /> {zone.securityLevel}</span>
              <span className="badge-muted">🔒 SSL: {zone.sslMode}</span>
              {zone.alwaysHttps && <span className="badge-success">HTTPS ✓</span>}
            </div>
            <a href={`https://dash.cloudflare.com/?to=/:account/${zone.domain}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1">☁️ Open in Cloudflare <ExternalLink size={10} /></a>
          </motion.div>
        ))}
      </div>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Zone" : "Add Zone"} onSubmit={saveForm}>
        <FormField label="Domain *"><FormInput value={form.domain || ""} onChange={v => setForm(f => ({ ...f, domain: v }))} placeholder="example.com" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Security Level">
            <FormSelect value={form.securityLevel || "Medium"} onChange={v => setForm(f => ({ ...f, securityLevel: v }))} options={["Off","Low","Medium","High","Under Attack"].map(l => ({value:l,label:l}))} />
          </FormField>
          <FormField label="SSL Mode">
            <FormSelect value={form.sslMode || "Full (Strict)"} onChange={v => setForm(f => ({ ...f, sslMode: v }))} options={["Off","Flexible","Full","Full (Strict)"].map(l => ({value:l,label:l}))} />
          </FormField>
          <FormField label="Requests 24h"><FormInput value={String(form.requests24h || 0)} onChange={v => setForm(f => ({ ...f, requests24h: parseInt(v) || 0 }))} type="number" /></FormField>
          <FormField label="Cached %"><FormInput value={String(form.cachedPercent || 0)} onChange={v => setForm(f => ({ ...f, cachedPercent: parseInt(v) || 0 }))} type="number" /></FormField>
        </div>
      </FormModal>
    </div>
  );
}
