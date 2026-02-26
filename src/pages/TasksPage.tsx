import { useDashboard } from "@/contexts/DashboardContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

const priorityColors: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-success",
};

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const statusLabels: Record<string, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export default function TasksPage() {
  const { tasks, updateData } = useDashboard();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newTask, setNewTask] = useState("");

  const filtered = tasks
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (pOrder[a.priority] || 3) - (pOrder[b.priority] || 3);
    });

  const toggleTask = (id: string) => {
    updateData({
      tasks: tasks.map(t =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "todo" : "done", completedAt: t.status === "done" ? undefined : new Date().toISOString().split("T")[0] }
          : t
      ),
    });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    updateData({
      tasks: [
        {
          id: Math.random().toString(36).slice(2, 10),
          title: newTask.trim(),
          priority: "medium",
          status: "todo",
          dueDate: new Date().toISOString().split("T")[0],
          category: "General",
          description: "",
          linkedProject: "",
          subtasks: [],
          createdAt: new Date().toISOString().split("T")[0],
        },
        ...tasks,
      ],
    });
    setNewTask("");
  };

  const deleteTask = (id: string) => {
    updateData({ tasks: tasks.filter(t => t.id !== id) });
  };

  const isOverdue = (t: typeof tasks[0]) => t.status !== "done" && t.dueDate < new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <span className="text-sm text-muted-foreground">{tasks.filter(t => t.status !== "done").length} open</span>
      </div>

      {/* Quick Add */}
      <div className="card-elevated p-3 flex items-center gap-3">
        <Plus size={18} className="text-muted-foreground" />
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
          placeholder="Add a new task... (press Enter)"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-secondary rounded-xl px-3 py-1.5 gap-2">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-40"
          />
        </div>
        {["all", "todo", "in-progress", "blocked", "done"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filterStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {s === "all" ? "All" : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-1.5">
        {filtered.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`card-elevated p-4 flex items-center gap-3 group ${isOverdue(task) ? "ring-1 ring-destructive/30" : ""}`}
          >
            <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
              {task.status === "done" ? (
                <CheckCircle2 size={20} className="text-success" />
              ) : (
                <Circle size={20} className="text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColors[task.priority]}`} />
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                {task.title}
              </span>
              {task.subtasks.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                </span>
              )}
            </div>
            {isOverdue(task) && <AlertTriangle size={14} className="text-destructive flex-shrink-0" />}
            <span className={`badge-${task.priority === "critical" ? "destructive" : task.priority === "high" ? "warning" : "muted"} text-[10px] hidden sm:inline-flex`}>
              {priorityLabels[task.priority]}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">{task.dueDate}</span>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
            >
              ✕
            </button>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
