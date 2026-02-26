import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Copy, ExternalLink, Shield, Lock } from "lucide-react";
import FormModal, { FormField, FormInput, FormTextarea, FormSelect } from "@/components/FormModal";
import type { CredentialVault } from "@/lib/store";
import { toast } from "sonner";

const emptyCredential: Omit<CredentialVault, "id"> = { label: "", service: "", url: "", username: "", password: "", apiKey: "", notes: "", category: "General", createdAt: new Date().toISOString().split("T")[0] };

export default function CredentialsPage() {
  const { credentials, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCredential);
  const [masterLocked, setMasterLocked] = useState(true);

  const filtered = credentials.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.service.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleReveal = (id: string) => {
    if (masterLocked) { toast.error("Unlock the vault first"); return; }
    setRevealed(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else {
        n.add(id);
        setTimeout(() => setRevealed(p => { const x = new Set(p); x.delete(id); return x; }), 15000);
      }
      return n;
    });
  };

  const copyText = (text: string, label: string) => {
    if (masterLocked) { toast.error("Unlock the vault first"); return; }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const openAdd = () => { setEditId(null); setForm(emptyCredential); setModalOpen(true); };
  const openEdit = (c: CredentialVault) => { setEditId(c.id); const { id, ...rest } = c; setForm(rest); setModalOpen(true); };
  const saveForm = () => {
    if (!form.label.trim()) return;
    if (editId) {
      updateData({ credentials: credentials.map(c => c.id === editId ? { ...c, ...form } : c) });
      toast.success("Credential updated");
    } else {
      updateData({ credentials: [{ id: Math.random().toString(36).slice(2, 10), ...form, createdAt: new Date().toISOString().split("T")[0] }, ...credentials] });
      toast.success("Credential added");
    }
    setModalOpen(false);
  };
  const deleteCredential = (id: string) => {
    if (!confirm("Delete this credential?")) return;
    updateData({ credentials: credentials.filter(c => c.id !== id) });
    toast.success("Credential deleted");
  };
  const uf = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  const categories = [...new Set(credentials.map(c => c.category))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credential Vault</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{credentials.length} credentials stored securely</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMasterLocked(!masterLocked)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${masterLocked ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-success/10 text-success hover:bg-success/20"}`}>
            {masterLocked ? <Lock size={16} /> : <Shield size={16} />}
            {masterLocked ? "🔒 Locked" : "🔓 Unlocked"}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
            <Plus size={16} /> Add Credential
          </button>
        </div>
      </div>

      {masterLocked && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-elevated p-4 bg-warning/5 border-warning/20 flex items-center gap-3">
          <Shield size={20} className="text-warning flex-shrink-0" />
          <p className="text-sm text-card-foreground">Vault is locked. Click <strong>Unlock</strong> to reveal credentials. They auto-hide after 15 seconds.</p>
        </motion.div>
      )}

      <div className="flex items-center bg-secondary rounded-xl px-3 py-2 gap-2 max-w-sm">
        <Search size={14} className="text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search credentials..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cred, i) => {
          const isRevealed = revealed.has(cred.id) && !masterLocked;
          return (
            <motion.div key={cred.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card-elevated p-4 space-y-3 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground text-sm">{cred.label}</h3>
                  <span className="badge-muted text-[10px]">{cred.category}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cred)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={12} /></button>
                  <button onClick={() => deleteCredential(cred.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={12} /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs bg-secondary/50 rounded-xl p-3">
                {cred.url && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">URL:</span>
                    <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate ml-3">{cred.url} <ExternalLink size={10} /></a>
                  </div>
                )}
                {cred.username && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-card-foreground">{masterLocked ? "••••••" : cred.username}</span>
                      <button onClick={() => copyText(cred.username, "Username")} className="text-muted-foreground hover:text-foreground"><Copy size={10} /></button>
                    </div>
                  </div>
                )}
                {cred.password && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pass:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-card-foreground">{isRevealed ? cred.password : "••••••••"}</span>
                      <button onClick={() => toggleReveal(cred.id)} className="text-muted-foreground hover:text-foreground">
                        {isRevealed ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                      <button onClick={() => copyText(cred.password, "Password")} className="text-muted-foreground hover:text-foreground"><Copy size={10} /></button>
                    </div>
                  </div>
                )}
                {cred.apiKey && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">API Key:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-card-foreground">{isRevealed ? cred.apiKey : "••••••••••"}</span>
                      <button onClick={() => toggleReveal(cred.id)} className="text-muted-foreground hover:text-foreground">
                        {isRevealed ? <EyeOff size={10} /> : <Eye size={10} />}
                      </button>
                      <button onClick={() => copyText(cred.apiKey, "API Key")} className="text-muted-foreground hover:text-foreground"><Copy size={10} /></button>
                    </div>
                  </div>
                )}
              </div>
              {cred.notes && <p className="text-[11px] text-muted-foreground">{cred.notes}</p>}
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-3">🔐</div>
          <p className="font-medium">No credentials stored</p>
          <button onClick={openAdd} className="mt-3 text-sm text-primary hover:underline">+ Add your first credential</button>
        </div>
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Credential" : "Add Credential"} onSubmit={saveForm}>
        <FormField label="Label *"><FormInput value={form.label} onChange={v => uf("label", v)} placeholder="My Service Account" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Service"><FormInput value={form.service} onChange={v => uf("service", v)} placeholder="Cloudflare, GitHub, etc." /></FormField>
          <FormField label="Category">
            <FormSelect value={form.category} onChange={v => uf("category", v)} options={["General","Infrastructure","Hosting","Development","Payments","Social","Other"].map(c => ({value:c,label:c}))} />
          </FormField>
        </div>
        <FormField label="URL"><FormInput value={form.url} onChange={v => uf("url", v)} placeholder="https://login.service.com" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Username"><FormInput value={form.username} onChange={v => uf("username", v)} placeholder="admin" /></FormField>
          <FormField label="Password"><FormInput value={form.password} onChange={v => uf("password", v)} type="password" placeholder="••••••" /></FormField>
        </div>
        <FormField label="API Key / Token"><FormInput value={form.apiKey} onChange={v => uf("apiKey", v)} type="password" placeholder="sk_live_..." /></FormField>
        <FormField label="Notes"><FormTextarea value={form.notes} onChange={v => uf("notes", v)} placeholder="Additional notes" rows={2} /></FormField>
      </FormModal>
    </div>
  );
}
