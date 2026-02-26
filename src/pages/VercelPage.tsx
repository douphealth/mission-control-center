import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Edit2, Trash2, ExternalLink, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import FormModal, { FormField, FormInput, FormSelect, FormTagsInput } from "@/components/FormModal";
import { toast } from "sonner";

interface VercelProject {
  id: string;
  name: string;
  framework: string;
  productionUrl: string;
  githubRepo: string;
  latestStatus: "ready" | "error" | "building" | "cancelled";
  latestCommit: string;
  buildDuration: string;
  deployedAt: string;
  domains: string[];
}

const defaults: VercelProject[] = [
  { id: "v1", name: "SaaS Landing Page", framework: "Next.js", productionUrl: "https://saas-product.io", githubRepo: "alexdev/saas-landing", latestStatus: "ready", latestCommit: "feat: add pricing section", buildDuration: "42s", deployedAt: "2026-02-26", domains: ["saas-product.io", "saas-product.vercel.app"] },
  { id: "v2", name: "AI Content Generator", framework: "React", productionUrl: "https://ai-content-gen.vercel.app", githubRepo: "alexdev/ai-content-gen", latestStatus: "ready", latestCommit: "fix: template loading", buildDuration: "38s", deployedAt: "2026-02-25", domains: ["ai-content-gen.vercel.app"] },
  { id: "v3", name: "Mission Control", framework: "React + Vite", productionUrl: "https://mission-control.vercel.app", githubRepo: "alexdev/ai-mission-control", latestStatus: "ready", latestCommit: "feat: add payments module", buildDuration: "28s", deployedAt: "2026-02-26", domains: ["mission-control.vercel.app"] },
];

const statusIcons: Record<string, { icon: any; class: string; label: string }> = {
  ready: { icon: CheckCircle2, class: "text-success", label: "Ready" },
  error: { icon: XCircle, class: "text-destructive", label: "Error" },
  building: { icon: RefreshCw, class: "text-info animate-spin", label: "Building" },
  cancelled: { icon: XCircle, class: "text-muted-foreground", label: "Cancelled" },
};

const frameworkBadge: Record<string, string> = { "Next.js": "badge-primary", "React": "badge-info", "React + Vite": "badge-warning", "Nuxt": "badge-success", "Astro": "badge-muted" };

export default function VercelPage() {
  const [projects, setProjects] = useState<VercelProject[]>(() => {
    try { const s = localStorage.getItem("mc-vercel"); return s ? JSON.parse(s) : defaults; } catch { return defaults; }
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<VercelProject>>({});

  const save = (p: VercelProject[]) => { setProjects(p); localStorage.setItem("mc-vercel", JSON.stringify(p)); };

  const openAdd = () => { setEditId(null); setForm({ name: "", framework: "React", productionUrl: "", githubRepo: "", latestStatus: "ready", latestCommit: "", buildDuration: "", deployedAt: new Date().toISOString().split("T")[0], domains: [] }); setModalOpen(true); };
  const openEdit = (p: VercelProject) => { setEditId(p.id); setForm(p); setModalOpen(true); };
  const saveForm = () => {
    if (!form.name) return;
    if (editId) { save(projects.map(p => p.id === editId ? { ...p, ...form } as VercelProject : p)); toast.success("Project updated"); }
    else { save([{ id: Math.random().toString(36).slice(2, 10), ...form } as VercelProject, ...projects]); toast.success("Project added"); }
    setModalOpen(false);
  };
  const deleteProject = (id: string) => { save(projects.filter(p => p.id !== id)); toast.success("Removed"); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vercel Deployments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} projects · {projects.filter(p => p.latestStatus === "ready").length} deployed</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-sm text-card-foreground hover:bg-secondary/80 transition-colors">
            🚀 Open Vercel
          </a>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
            <Plus size={16} /> Add Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((project, i) => {
          const si = statusIcons[project.latestStatus] || statusIcons.ready;
          return (
            <motion.div key={project.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card-elevated p-5 space-y-3 group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground">{project.name}</h3>
                  <span className={frameworkBadge[project.framework] || "badge-muted"}>{project.framework}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs ${si.class}`}>
                    <si.icon size={14} /> {si.label}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(project)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={13} /></button>
                    <button onClick={() => deleteProject(project.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
              {project.productionUrl && (
                <a href={project.productionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  {project.productionUrl} <ExternalLink size={10} />
                </a>
              )}
              <div className="bg-secondary/50 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Latest deploy:</span><span className="text-card-foreground font-medium">{project.latestCommit}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Build time:</span><span className="text-card-foreground">{project.buildDuration}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Deployed:</span><span className="text-card-foreground">{project.deployedAt}</span></div>
              </div>
              {project.domains.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.domains.map(d => <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{d}</span>)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Project" : "Add Vercel Project"} onSubmit={saveForm}>
        <FormField label="Project Name *"><FormInput value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="My App" /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Framework">
            <FormSelect value={form.framework || "React"} onChange={v => setForm(f => ({ ...f, framework: v }))} options={["Next.js","React","React + Vite","Nuxt","Astro","SvelteKit"].map(l => ({value:l,label:l}))} />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.latestStatus || "ready"} onChange={v => setForm(f => ({ ...f, latestStatus: v as any }))} options={[{value:"ready",label:"✅ Ready"},{value:"error",label:"❌ Error"},{value:"building",label:"🔄 Building"}]} />
          </FormField>
        </div>
        <FormField label="Production URL"><FormInput value={form.productionUrl || ""} onChange={v => setForm(f => ({ ...f, productionUrl: v }))} placeholder="https://..." /></FormField>
        <FormField label="GitHub Repo"><FormInput value={form.githubRepo || ""} onChange={v => setForm(f => ({ ...f, githubRepo: v }))} placeholder="user/repo" /></FormField>
        <FormField label="Latest Commit"><FormInput value={form.latestCommit || ""} onChange={v => setForm(f => ({ ...f, latestCommit: v }))} placeholder="feat: new feature" /></FormField>
        <FormField label="Domains"><FormTagsInput value={form.domains || []} onChange={v => setForm(f => ({ ...f, domains: v }))} placeholder="Add domain" /></FormField>
      </FormModal>
    </div>
  );
}
