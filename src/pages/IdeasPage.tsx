import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit2, Trash2, ThumbsUp, Lightbulb, Rocket, FlaskConical, ParkingCircle, Sparkles } from "lucide-react";
import FormModal, { FormField, FormInput, FormTextarea, FormSelect, FormTagsInput } from "@/components/FormModal";
import type { Idea } from "@/lib/store";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: any; class: string; bg: string }> = {
  spark: { label: "Spark", icon: Sparkles, class: "badge-warning", bg: "from-warning/20 to-warning/5" },
  exploring: { label: "Exploring", icon: FlaskConical, class: "badge-info", bg: "from-info/20 to-info/5" },
  validated: { label: "Validated", icon: ThumbsUp, class: "badge-success", bg: "from-success/20 to-success/5" },
  building: { label: "Building", icon: Rocket, class: "badge-primary", bg: "from-primary/20 to-primary/5" },
  parked: { label: "Parked", icon: ParkingCircle, class: "badge-muted", bg: "from-muted/40 to-muted/10" },
};

const priorityDot: Record<string, string> = { high: "bg-destructive", medium: "bg-warning", low: "bg-success" };

const emptyIdea: Omit<Idea, "id"> = { title: "", description: "", category: "General", priority: "medium", status: "spark", tags: [], linkedProject: "", votes: 0, createdAt: new Date().toISOString().split("T")[0], updatedAt: new Date().toISOString().split("T")[0] };

export default function IdeasPage() {
  const { ideas, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyIdea);

  const filtered = ideas
    .filter(i => filterStatus === "all" || i.status === filterStatus)
    .filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.votes - a.votes);

  const openAdd = () => { setEditId(null); setForm(emptyIdea); setModalOpen(true); };
  const openEdit = (idea: Idea) => { setEditId(idea.id); const { id, ...rest } = idea; setForm(rest); setModalOpen(true); };
  const saveForm = () => {
    if (!form.title.trim()) return;
    const now = new Date().toISOString().split("T")[0];
    if (editId) {
      updateData({ ideas: ideas.map(i => i.id === editId ? { ...i, ...form, updatedAt: now } : i) });
      toast.success("Idea updated");
    } else {
      updateData({ ideas: [{ id: Math.random().toString(36).slice(2, 10), ...form, createdAt: now, updatedAt: now }, ...ideas] });
      toast.success("Idea added");
    }
    setModalOpen(false);
  };
  const deleteIdea = (id: string) => {
    if (!confirm("Delete this idea?")) return;
    updateData({ ideas: ideas.filter(i => i.id !== id) });
    toast.success("Idea deleted");
  };
  const upvote = (id: string) => {
    updateData({ ideas: ideas.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i) });
  };
  const uf = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ideas Board</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{ideas.length} ideas · {ideas.filter(i => i.status === "exploring" || i.status === "validated").length} active</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
          <Lightbulb size={16} /> New Idea
        </button>
      </div>

      {/* Status pipeline overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const count = ideas.filter(i => i.status === key).length;
          return (
            <button key={key} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              className={`card-elevated p-3 text-center transition-all ${filterStatus === key ? "ring-2 ring-primary/30 scale-[1.02]" : "hover:scale-[1.01]"}`}>
              <cfg.icon size={18} className="mx-auto text-muted-foreground mb-1" />
              <div className="text-lg font-bold text-card-foreground">{count}</div>
              <div className="text-[10px] text-muted-foreground">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center bg-secondary rounded-xl px-3 py-2 gap-2 max-w-sm">
        <Search size={14} className="text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((idea, i) => {
          const cfg = statusConfig[idea.status] || statusConfig.spark;
          return (
            <motion.div key={idea.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="card-elevated overflow-hidden group">
              <div className={`h-1.5 bg-gradient-to-r ${cfg.bg}`} />
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityDot[idea.priority]}`} />
                    <h3 className="font-semibold text-card-foreground text-sm truncate">{idea.title}</h3>
                  </div>
                  <span className={cfg.class}>{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{idea.description}</p>
                {idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">{t}</span>)}
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button onClick={() => upvote(idea.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
                      <ThumbsUp size={12} /> {idea.votes}
                    </button>
                    <span className="badge-muted text-[10px]">{idea.category}</span>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(idea)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={12} /></button>
                    <button onClick={() => deleteIdea(idea.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-3">💡</div>
          <p className="font-medium">No ideas yet</p>
          <button onClick={openAdd} className="mt-3 text-sm text-primary hover:underline">+ Capture your first idea</button>
        </div>
      )}

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Idea" : "New Idea"} onSubmit={saveForm}>
        <FormField label="Title *"><FormInput value={form.title} onChange={v => uf("title", v)} placeholder="Your brilliant idea" /></FormField>
        <FormField label="Description"><FormTextarea value={form.description} onChange={v => uf("description", v)} placeholder="Describe the idea in detail..." rows={3} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Priority">
            <FormSelect value={form.priority} onChange={v => uf("priority", v)} options={[{value:"high",label:"🔴 High"},{value:"medium",label:"🟡 Medium"},{value:"low",label:"🟢 Low"}]} />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={v => uf("status", v)} options={Object.entries(statusConfig).map(([k, v]) => ({value:k, label:v.label}))} />
          </FormField>
          <FormField label="Category"><FormInput value={form.category} onChange={v => uf("category", v)} placeholder="SaaS, Tool, etc." /></FormField>
          <FormField label="Linked Project"><FormInput value={form.linkedProject} onChange={v => uf("linkedProject", v)} placeholder="Project name" /></FormField>
        </div>
        <FormField label="Tags"><FormTagsInput value={form.tags} onChange={v => uf("tags", v)} placeholder="Add tag and press Enter" /></FormField>
      </FormModal>
    </div>
  );
}
