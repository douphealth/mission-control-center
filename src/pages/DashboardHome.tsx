import { useDashboard } from "@/contexts/DashboardContext";
import { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Globe, Github, Hammer, CheckSquare, TrendingUp, TrendingDown, ExternalLink,
  Clock, ArrowRight, Zap, Calendar, FileText, Target, Sparkles, Settings2,
  DollarSign, Lightbulb, Eye, EyeOff, GripVertical, ArrowUpRight, ArrowDownRight,
  Pin
} from "lucide-react";
import { loadWidgetConfig, saveWidgetConfig, toggleWidget, type WidgetConfig } from "@/lib/widgetRegistry";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.04 },
});

export default function DashboardHome() {
  const {
    websites, repos, buildProjects, tasks, links, notes, payments, ideas,
    setActiveSection
  } = useDashboard();

  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadWidgetConfig());
  const [configOpen, setConfigOpen] = useState(false);

  const updateWidgets = useCallback((next: WidgetConfig[]) => {
    setWidgets(next);
    saveWidgetConfig(next);
  }, []);

  const handleToggle = (id: string) => updateWidgets(toggleWidget(widgets, id));
  const handleReorder = (reordered: WidgetConfig[]) => {
    const updated = reordered.map((w, i) => ({ ...w, order: i }));
    updateWidgets(updated);
  };

  const today = new Date().toISOString().split("T")[0];
  const activeSites = websites.filter(w => w.status === "active").length;
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const dueToday = tasks.filter(t => t.dueDate === today && t.status !== "done").length;
  const activeBuilds = buildProjects.filter(b => b.status !== "deployed").length;
  const overdueTasks = tasks.filter(t => t.status !== "done" && t.dueDate < today).length;
  const completedToday = tasks.filter(t => t.completedAt === today).length;
  const totalIncome = payments.filter(p => p.type === "income" && p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalExpenses = payments.filter(p => (p.type === "expense" || p.type === "subscription") && p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + p.amount, 0);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const stats = [
    { label: "Websites", value: websites.length, sub: `${activeSites} active`, icon: Globe, trend: `+${activeSites}`, up: true, gradient: "from-info/15 to-info/5", iconColor: "text-info", section: "websites" },
    { label: "GitHub Repos", value: repos.length, sub: `${repos.filter(r => r.status === "active").length} active`, icon: Github, trend: "+5", up: true, gradient: "from-purple-500/15 to-purple-500/5", iconColor: "text-purple-500", section: "github" },
    { label: "Build Projects", value: buildProjects.length, sub: `${activeBuilds} in progress`, icon: Hammer, trend: `+${activeBuilds}`, up: true, gradient: "from-warning/15 to-warning/5", iconColor: "text-warning", section: "builds" },
    { label: "Open Tasks", value: openTasks, sub: dueToday > 0 ? `${dueToday} due today` : overdueTasks > 0 ? `${overdueTasks} overdue!` : "All on track ✨", icon: CheckSquare, trend: dueToday > 0 ? String(dueToday) : "0", up: overdueTasks === 0, gradient: overdueTasks > 0 ? "from-destructive/15 to-destructive/5" : "from-success/15 to-success/5", iconColor: overdueTasks > 0 ? "text-destructive" : "text-success", section: "tasks" },
  ];

  const todayTasks = tasks.filter(t => t.status !== "done").sort((a, b) => {
    const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] || 3) - (p[b.priority] || 3);
  }).slice(0, 6);

  const upcomingDeadlines = tasks.filter(t => t.status !== "done" && t.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  const pinnedNotes = notes.filter(n => n.pinned).slice(0, 3);
  const topIdeas = ideas.filter(i => i.status !== "parked").sort((a, b) => b.votes - a.votes).slice(0, 4);
  const quickLinks = links.filter(l => l.pinned).slice(0, 6);
  const priorityColor: Record<string, string> = { critical: "bg-destructive", high: "bg-warning", medium: "bg-primary", low: "bg-success" };
  const priorityBg: Record<string, string> = { critical: "bg-destructive/10 text-destructive", high: "bg-warning/10 text-warning", medium: "bg-primary/10 text-primary", low: "bg-success/10 text-success" };

  const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Ship fast, iterate faster.", author: "Reid Hoffman" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  ];
  const quote = quotes[new Date().getDate() % quotes.length];

  const visibleWidgets = widgets.filter(w => w.visible);

  const renderWidget = (widget: WidgetConfig, i: number) => {
    switch (widget.type) {
      case "stats":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 col-span-full">
            {stats.map((s, si) => (
              <motion.div key={s.label} {...fadeUp(si)} className="card-elevated p-5 hover:scale-[1.02] transition-transform cursor-pointer group" onClick={() => setActiveSection(s.section)}>
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                    <s.icon size={20} className={s.iconColor} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${s.up ? "text-success" : "text-destructive"}`}>
                    {s.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {s.trend}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold text-card-foreground tracking-tight">{s.value}</div>
                  <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">{s.sub}</div>
                </div>
                <svg className="mt-3 w-full h-8 opacity-60 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <defs><linearGradient id={`grad-${si}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" /></linearGradient></defs>
                  <path d="M0,25 L15,20 L30,22 L45,15 L60,18 L75,10 L90,12 L100,5 L100,30 L0,30 Z" fill={`url(#grad-${si})`} />
                  <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points="0,25 15,20 30,22 45,15 60,18 75,10 90,12 100,5" />
                </svg>
              </motion.div>
            ))}
          </div>
        );

      case "tasks-focus":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-warning" />
                <h3 className="font-semibold text-card-foreground">Today's Focus</h3>
                {dueToday > 0 && <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">{dueToday} due</span>}
              </div>
              <button onClick={() => setActiveSection("tasks")} className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-1">
              {todayTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColor[task.priority]}`} />
                  <span className="text-sm text-card-foreground flex-1 truncate">{task.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${priorityBg[task.priority]}`}>{task.priority}</span>
                  <span className={`text-xs flex-shrink-0 ${task.dueDate < today ? "text-destructive font-medium" : "text-muted-foreground"}`}>{task.dueDate}</span>
                </div>
              ))}
              {todayTasks.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">🎉 All caught up!</div>}
            </div>
          </motion.div>
        );

      case "deadlines":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Calendar size={16} className="text-info" /><h3 className="font-semibold text-card-foreground">Upcoming Deadlines</h3></div>
              <button onClick={() => setActiveSection("calendar")} className="text-xs text-primary hover:underline flex items-center gap-1">Calendar <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-1">
              {upcomingDeadlines.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityColor[task.priority]}`} />
                  <span className="text-sm text-card-foreground flex-1 truncate">{task.title}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{task.dueDate}</span>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No upcoming deadlines 🌟</div>}
            </div>
          </motion.div>
        );

      case "finance":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><DollarSign size={16} className="text-success" /><h3 className="font-semibold text-card-foreground">Finance Summary</h3></div>
              <button onClick={() => setActiveSection("payments")} className="text-xs text-primary hover:underline flex items-center gap-1">Details <ArrowRight size={12} /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-success/5">
                <ArrowUpRight size={16} className="text-success mx-auto mb-1" />
                <div className="text-lg font-bold text-success">{fmt(totalIncome)}</div>
                <div className="text-[10px] text-muted-foreground">Income</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-destructive/5">
                <ArrowDownRight size={16} className="text-destructive mx-auto mb-1" />
                <div className="text-lg font-bold text-destructive">{fmt(totalExpenses)}</div>
                <div className="text-[10px] text-muted-foreground">Expenses</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-warning/5">
                <Clock size={16} className="text-warning mx-auto mb-1" />
                <div className="text-lg font-bold text-warning">{fmt(pendingAmount)}</div>
                <div className="text-[10px] text-muted-foreground">Pending</div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-primary/5 text-center">
              <div className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totalIncome - totalExpenses)}</div>
              <div className="text-[10px] text-muted-foreground">Net Profit</div>
            </div>
          </motion.div>
        );

      case "activity":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-center gap-2 mb-4"><Clock size={16} className="text-muted-foreground" /><h3 className="font-semibold text-card-foreground">Recent Activity</h3></div>
            <div className="space-y-0.5">
              {[
                { text: "Deployed SaaS Landing Page to Vercel", time: "2h ago", icon: "🚀" },
                { text: "Completed SSL certificate renewal", time: "5h ago", icon: "✅" },
                { text: "Pushed 3 commits to ai-mission-control", time: "8h ago", icon: "🐙" },
                { text: "Added new blog post draft", time: "1d ago", icon: "📝" },
                { text: "Updated WooCommerce to v9.2", time: "1d ago", icon: "🔌" },
                { text: "Fixed responsive layout on agency site", time: "2d ago", icon: "🔧" },
              ].map((a, ai) => (
                <div key={ai} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                  <span className="text-base flex-shrink-0">{a.icon}</span>
                  <span className="text-sm text-card-foreground flex-1 truncate">{a.text}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case "quick-links":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-card-foreground">Quick Access</h3>
              <button onClick={() => setActiveSection("links")} className="text-xs text-primary hover:underline flex items-center gap-1">All Links <ArrowRight size={12} /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {quickLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/80 transition-all group hover:scale-[1.02]">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 group-hover:bg-primary/20 transition-colors">{link.title.charAt(0)}</div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-card-foreground truncate block">{link.title}</span>
                    <span className="text-[10px] text-muted-foreground truncate block">{link.category}</span>
                  </div>
                </a>
              ))}
              {quickLinks.length === 0 && (
                <div className="col-span-3 text-center py-6 text-muted-foreground text-sm">
                  <button onClick={() => setActiveSection("links")} className="text-primary hover:underline">Pin some links to see them here</button>
                </div>
              )}
            </div>
          </motion.div>
        );

      case "platforms":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <h3 className="font-semibold text-card-foreground mb-4">Platform Status</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: "Cloudflare", section: "cloudflare", status: "Operational", ok: true, icon: "☁️" },
                { name: "Vercel", section: "vercel", status: "Operational", ok: true, icon: "🚀" },
                { name: "Google SC", section: "seo", status: "2 warnings", ok: false, icon: "🔍" },
                { name: "OpenClaw", section: "openclaw", status: "Operational", ok: true, icon: "🐙" },
              ].map(p => (
                <button key={p.name} onClick={() => setActiveSection(p.section)} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/80 transition-all hover:scale-[1.02]">
                  <span className="text-xl">{p.icon}</span>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-medium text-card-foreground">{p.name}</div>
                    <div className={`text-[11px] ${p.ok ? "text-success" : "text-warning"}`}>{p.ok ? "🟢" : "🟡"} {p.status}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );

      case "ideas":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Lightbulb size={16} className="text-warning" /><h3 className="font-semibold text-card-foreground">Top Ideas</h3></div>
              <button onClick={() => setActiveSection("ideas")} className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-2">
              {topIdeas.map(idea => (
                <div key={idea.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{idea.votes}↑</span>
                  <span className="text-sm text-card-foreground flex-1 truncate">{idea.title}</span>
                  <span className="badge-muted text-[10px]">{idea.status}</span>
                </div>
              ))}
              {topIdeas.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No active ideas</div>}
            </div>
          </motion.div>
        );

      case "notes-preview":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Pin size={16} className="text-warning" /><h3 className="font-semibold text-card-foreground">Pinned Notes</h3></div>
              <button onClick={() => setActiveSection("notes")} className="text-xs text-primary hover:underline flex items-center gap-1">All Notes <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-2">
              {pinnedNotes.map(note => (
                <button key={note.id} onClick={() => setActiveSection("notes")} className="w-full text-left p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="text-sm font-medium text-card-foreground truncate">{note.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{note.content.slice(0, 60)}...</div>
                </button>
              ))}
              {pinnedNotes.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No pinned notes</div>}
            </div>
          </motion.div>
        );

      case "quote":
        return (
          <motion.div {...fadeUp(i)} className="card-elevated p-6 flex flex-col justify-center bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="text-lg font-medium text-card-foreground italic leading-relaxed text-center">"{quote.text}"</div>
            <div className="text-sm text-muted-foreground mt-2 text-center">— {quote.author}</div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Determine grid sizing
  const getGridClass = (size: string) => {
    switch (size) {
      case "full": return "col-span-full";
      case "lg": return "lg:col-span-2";
      case "sm": return "";
      default: return "";
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <motion.div {...fadeUp(0)} className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 text-success text-xs font-medium">
            <Target size={12} /> {completedToday} done today
          </div>
          {overdueTasks > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium animate-pulse">
              ⚠️ {overdueTasks} overdue
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-info/10 text-info text-xs font-medium">
            <FileText size={12} /> {notes.length} notes
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium">
            <Sparkles size={12} /> {links.length} links saved
          </div>
        </div>
        <button onClick={() => setConfigOpen(!configOpen)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl hover:bg-secondary">
          <Settings2 size={14} /> Customize
        </button>
      </motion.div>

      {/* Widget configurator */}
      <AnimatePresence>
        {configOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="card-elevated p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-card-foreground">Dashboard Widgets</h3>
                <span className="text-[10px] text-muted-foreground">{visibleWidgets.length}/{widgets.length} visible</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {widgets.map(w => (
                  <button key={w.id} onClick={() => handleToggle(w.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all ${w.visible ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "bg-secondary/50 text-muted-foreground"}`}>
                    {w.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{w.icon}</span>
                    <span className="truncate">{w.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visibleWidgets.map((widget, i) => (
          <div key={widget.id} className={getGridClass(widget.size)}>
            {renderWidget(widget, i)}
          </div>
        ))}
      </div>
    </div>
  );
}
