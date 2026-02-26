import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, CheckCircle2, Circle, AlertTriangle, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import FormModal, { FormField, FormInput, FormTextarea, FormSelect } from "@/components/FormModal";
import type { Task } from "@/lib/store";

const priorityColors: Record<string, string> = { critical: "bg-destructive", high: "bg-warning", medium: "bg-primary", low: "bg-success" };
const priorityLabels: Record<string, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const statusLabels: Record<string, string> = { todo: "To Do", "in-progress": "In Progress", blocked: "Blocked", done: "Done" };

const emptyTask: Omit<Task, "id"> = { title: "", priority: "medium", status: "todo", dueDate: new Date().toISOString().split("T")[0], category: "General", description: "", linkedProject: "", subtasks: [], createdAt: new Date().toISOString().split("T")[0] };

export default function TasksPage() {
  const { tasks, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newTask, setNewTask] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTask);

  const filtered = tasks
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (pOrder[a.priority] || 3) - (pOrder[b.priority] || 3);
    });

  const toggleTask = (id: string) => {
    updateData({ tasks: tasks.map(t => t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done", completedAt: t.status === "done" ? undefined : new Date().toISOString().split("T")[0] } : t) });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    updateData({ tasks: [{ id: Math.random().toString(36).slice(2, 10), ...emptyTask, title: newTask.trim(), createdAt: new Date().toISOString().split("T")[0] }, ...tasks] });
    setNewTask("");
  };

  const openEdit = (t: Task) => { setEditId(t.id); const { id, ...rest } = t; setForm(rest); setModalOpen(true); };
  const openAdd = () => { setEditId(null); setForm(emptyTask); setModalOpen(true); };
  const saveForm = () => {
    if (!form.title.trim()) return;
    if (editId) {
      updateData({ tasks: tasks.map(t => t.id === editId ? { ...t, ...form } : t) });
    } else {
      updateData({ tasks: [{ id: Math.random().toString(36).slice(2, 10), ...form, createdAt: new Date().toISOString().split("T")[0] }, ...tasks] });
    }
    setModalOpen(false);
  };
  const deleteTask = (id: string) => { if (confirm("Delete this task?")) updateData({ tasks: tasks.filter(t => t.id !== id) }); };
  const toggleExpand = (id: string) => setExpandedTasks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSubtask = (taskId: string, subId: string) => {
    updateData({ tasks: tasks.map(t => t.id === taskId ? { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, done: !s.done } : s) } : t) });
  };

  const isOverdue = (t: Task) => t.status !== "done" && t.dueDate < new Date().toISOString().split("T")[0];
  const uf = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  const openCount = tasks.filter(t => t.status !== "done").length;
  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {openCount} open{overdueCount > 0 && <span className="text-destructive font-medium"> · {overdueCount} overdue</span>}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-lg shadow-primary/20">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Quick Add */}
      <div className="card-elevated p-3 flex items-center gap-3">
        <Plus size={18} className="text-muted-foreground flex-shrink-0" />
        <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="Quick add task... (press Enter)" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-secondary rounded-xl px-3 py-2 gap-2 max-w-xs">
          <Search size={14} className="text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {["all", "todo", "in-progress", "blocked", "done"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? `All (${tasks.length})` : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-1.5">
        {filtered.map((task, i) => (
          <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
            <div className={`card-elevated p-4 flex items-center gap-3 group ${isOverdue(task) ? "ring-1 ring-destructive/30" : ""}`}>
              <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                {task.status === "done" ? <CheckCircle2 size={20} className="text-success" /> : <Circle size={20} className="text-muted-foreground hover:text-primary transition-colors" />}
              </button>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`} />
              {task.subtasks.length > 0 && (
                <button onClick={() => toggleExpand(task.id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
                  {expandedTasks.has(task.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>{task.title}</span>
                {task.description && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{task.description}</p>}
                {task.subtasks.length > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
                )}
              </div>
              {isOverdue(task) && <AlertTriangle size={14} className="text-destructive flex-shrink-0" />}
              {task.category && <span className="badge-muted text-[10px] hidden sm:inline-flex">{task.category}</span>}
              <span className={`badge-${task.priority === "critical" ? "destructive" : task.priority === "high" ? "warning" : "muted"} text-[10px] hidden sm:inline-flex`}>{priorityLabels[task.priority]}</span>
              <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">{task.dueDate}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(task)} className="text-muted-foreground hover:text-foreground p-1"><Edit2 size={12} /></button>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={12} /></button>
              </div>
            </div>
            {/* Subtasks */}
            {expandedTasks.has(task.id) && task.subtasks.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-12 mt-1 space-y-1">
                {task.subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30">
                    <button onClick={() => toggleSubtask(task.id, sub.id)} className="flex-shrink-0">
                      {sub.done ? <CheckCircle2 size={14} className="text-success" /> : <Circle size={14} className="text-muted-foreground" />}
                    </button>
                    <span className={`text-xs ${sub.done ? "line-through text-muted-foreground" : "text-card-foreground"}`}>{sub.title}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium">No tasks found</p>
            <button onClick={openAdd} className="mt-3 text-sm text-primary hover:underline">+ Add your first task</button>
          </div>
        )}
      </div>

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Edit Task" : "Add Task"} onSubmit={saveForm}>
        <FormField label="Title *"><FormInput value={form.title} onChange={v => uf("title", v)} placeholder="What needs to be done?" /></FormField>
        <FormField label="Description"><FormTextarea value={form.description} onChange={v => uf("description", v)} placeholder="Additional details..." rows={2} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Priority">
            <FormSelect value={form.priority} onChange={v => uf("priority", v as any)} options={[{value:"critical",label:"🔴 Critical"},{value:"high",label:"🟠 High"},{value:"medium",label:"🟡 Medium"},{value:"low",label:"🟢 Low"}]} />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={v => uf("status", v as any)} options={[{value:"todo",label:"To Do"},{value:"in-progress",label:"In Progress"},{value:"blocked",label:"Blocked"},{value:"done",label:"Done"}]} />
          </FormField>
          <FormField label="Due Date"><FormInput value={form.dueDate} onChange={v => uf("dueDate", v)} type="date" /></FormField>
          <FormField label="Category"><FormInput value={form.category} onChange={v => uf("category", v)} placeholder="General" /></FormField>
        </div>
        <FormField label="Linked Project"><FormInput value={form.linkedProject} onChange={v => uf("linkedProject", v)} placeholder="Project name" /></FormField>
      </FormModal>
    </div>
  );
}
