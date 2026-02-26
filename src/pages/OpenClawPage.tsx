import { motion } from "framer-motion";
import { useState } from "react";
import { Plus, Edit2, Trash2, ExternalLink, Activity } from "lucide-react";
import FormModal, { FormField, FormInput, FormSelect, FormTagsInput } from "@/components/FormModal";
import { toast } from "sonner";

interface OCProject {
  id: string;
  name: string;
  url: string;
  status: "active" | "paused" | "archived" | "building";
  description: string;
  techStack: string[];
  lastActivity: string;
}

const defaults: OCProject[] = [
  { id: "oc1", name: "OpenClaw Dashboard", url: "https://openclaw.dev/dashboard", status: "active", description: "Main OpenClaw monitoring and management dashboard", techStack: ["React", "Node.js", "PostgreSQL"], lastActivity: "2026-02-25" },
];

export default function OpenClawPage() {
  const [projects, setProjects] = useState<OCProject[]>(() => {
    try { const s = localStorage.getItem("mc-openclaw"); return s ? JSON.parse(s) : defaults; } catch { return defaults; }
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<OCProject>>({});

  const save = (p: OCProject[]) => { setProjects(p); localStorage.setItem("mc-openclaw", JSON.stringify(p)); };

  const openAdd = () => { setEditId(null); setForm({ name: "", url: "", status: "active", description: "", techStack: [], lastActivity: new Date().toISOString().split("T")[0] }); setModalOpen(true); };
  const openEdit = (p: OCProject) => { setEditId(p.id); setForm(p); setModalOpen(true); };
  const saveForm = () => {
    if (!form.name) return;
    if (editId) { save(projects.map(p => p.id === editId ? { ...p, ...form } as OCProject : p)); toast.success("Updated"); }
    else { save([{ id: Math.random().toString(36).slice(2, 10), ...form } as OCProject, ...projects]); toast.success("Project added"); }
    setModalOpen(false);
  };
  const deleteProject = (id: string) => { save(projects.filter(p => p.id !== id)); toast.success("Removed"); };

  const statusBadge: Record<string, string> = { active: "badge-success", paused: "badge-warning", archived: "badge-muted", building: "badge-info" };

  const serviceStatuses = [
    { name: "API", status: "operational", latency: "45ms" },
    { name: "Dashboard", status: "operational", latency: "120ms" },
    { name: "Build Pipeline", status: "operational", latency: "—" },
    { name: "CDN / Edge", status: "operational", latency: "12ms" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">OpenClaw Monitor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} projects tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://openclaw.dev" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-sm text-card-foreground hover:bg-secondary/80 transition-colors">
            🐙 Open OpenClaw
          </a>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
            <Plus size={16} /> Add Project
          </button>
        </div>
      </div>

      {/* Service Status */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-success" />
            <h3 className="font-semibold text-card-foreground text-sm">Platform Status</h3>
          </div>
          <span className="badge-success">🟢 Operational</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {serviceStatuses.map(s => (
            <div key={s.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                <span className="text-xs text-card-foreground">{s.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{s.latency}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, i) => (
          <motion.div key={project.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card-elevated p-5 space-y-3 group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-card-foreground">{project.name}</h3>
                <span className={statusBadge[project.status]}>{project.status}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(project)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={13} /></button>
                <button onClick={() => deleteProject(project.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{project.description}</p>
            {project.url && (
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                {project.url} <ExternalLink size={10} />
              </a>
            )}
            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.techStack.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{t}</span>)}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">Last activity: {project.lastActivity}</div>
          </motion.div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-3">🐙</div>
          <p className="font-medium">No OpenClaw projects</p>
          <button onClick={openAdd} className="mt-3 text-sm text-primary hover:underline">+ Add project</button>
        </div>
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Project" : "Add Project"} onSubmit={saveForm}>
        <FormField label="Name *"><FormInput value={form.name || ""} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Project name" /></FormField>
        <FormField label="URL"><FormInput value={form.url || ""} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." /></FormField>
        <FormField label="Description"><FormInput value={form.description || ""} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Brief description" /></FormField>
        <FormField label="Status">
          <FormSelect value={form.status || "active"} onChange={v => setForm(f => ({ ...f, status: v as any }))} options={[{value:"active",label:"Active"},{value:"paused",label:"Paused"},{value:"building",label:"Building"},{value:"archived",label:"Archived"}]} />
        </FormField>
        <FormField label="Tech Stack"><FormTagsInput value={form.techStack || []} onChange={v => setForm(f => ({ ...f, techStack: v }))} placeholder="Add technology" /></FormField>
      </FormModal>
    </div>
  );
}
