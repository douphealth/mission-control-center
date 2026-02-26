import { useDashboard } from "@/contexts/DashboardContext";
import { motion } from "framer-motion";
import { Globe, Github, Hammer, CheckSquare, TrendingUp, TrendingDown, ExternalLink, Clock, ArrowRight, Zap } from "lucide-react";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.06 },
});

export default function DashboardHome() {
  const { websites, repos, buildProjects, tasks, links, notes, setActiveSection } = useDashboard();

  const activeSites = websites.filter(w => w.status === "active").length;
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const dueToday = tasks.filter(t => t.dueDate === new Date().toISOString().split("T")[0] && t.status !== "done").length;
  const activeBuilds = buildProjects.filter(b => b.status !== "deployed").length;
  const overdueTasks = tasks.filter(t => t.status !== "done" && t.dueDate < new Date().toISOString().split("T")[0]).length;

  const stats = [
    { label: "Websites", value: websites.length, sub: `${activeSites} active`, icon: Globe, trend: "+2", up: true, color: "from-blue-500/20 to-blue-500/5" },
    { label: "GitHub Repos", value: repos.length, sub: "12 commits this week", icon: Github, trend: "+5", up: true, color: "from-purple-500/20 to-purple-500/5" },
    { label: "Build Projects", value: buildProjects.length, sub: `${activeBuilds} in progress`, icon: Hammer, trend: "+1", up: true, color: "from-amber-500/20 to-amber-500/5" },
    { label: "Open Tasks", value: openTasks, sub: dueToday > 0 ? `${dueToday} due today` : overdueTasks > 0 ? `${overdueTasks} overdue` : "All on track", icon: CheckSquare, trend: dueToday > 0 ? `${dueToday}` : "0", up: dueToday === 0, color: "from-emerald-500/20 to-emerald-500/5" },
  ];

  const todayTasks = tasks.filter(t => t.status !== "done").sort((a, b) => {
    const p: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return (p[a.priority] || 3) - (p[b.priority] || 3);
  }).slice(0, 5);

  const recentActivity = [
    { text: "Deployed SaaS Landing Page to Vercel", time: "2h ago", icon: "🚀" },
    { text: "Completed SSL certificate renewal", time: "5h ago", icon: "✅" },
    { text: "Pushed 3 commits to ai-mission-control", time: "8h ago", icon: "🐙" },
    { text: "Added new blog post draft", time: "1d ago", icon: "📝" },
    { text: "Updated WooCommerce to v9.2", time: "1d ago", icon: "🔌" },
    { text: "Fixed responsive layout on agency site", time: "2d ago", icon: "🔧" },
  ];

  const quickLinks = links.filter(l => l.pinned).slice(0, 6);
  const priorityColor: Record<string, string> = { critical: "bg-destructive", high: "bg-warning", medium: "bg-primary", low: "bg-success" };

  const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Ship fast, iterate faster.", author: "Reid Hoffman" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  ];
  const quote = quotes[new Date().getDate() % quotes.length];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(i)} className="card-elevated p-5 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setActiveSection(s.label === "Websites" ? "websites" : s.label === "GitHub Repos" ? "github" : s.label === "Build Projects" ? "builds" : "tasks")}>
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon size={20} className="text-primary" />
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
            {/* Sparkline */}
            <svg className="mt-3 w-full h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,25 L15,20 L30,22 L45,15 L60,18 L75,10 L90,12 L100,5 L100,30 L0,30 Z" fill={`url(#grad-${i})`} />
              <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points="0,25 15,20 30,22 45,15 60,18 75,10 90,12 100,5" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Today's Focus & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp(4)} className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-warning" />
              <h3 className="font-semibold text-card-foreground">Today's Focus</h3>
            </div>
            <button onClick={() => setActiveSection("tasks")} className="text-xs text-primary hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></button>
          </div>
          <div className="space-y-1.5">
            {todayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColor[task.priority]}`} />
                <span className="text-sm text-card-foreground flex-1 truncate">{task.title}</span>
                <span className={`text-xs flex-shrink-0 ${task.dueDate < new Date().toISOString().split("T")[0] ? "text-destructive font-medium" : "text-muted-foreground"}`}>{task.dueDate}</span>
              </div>
            ))}
            {todayTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">🎉 All caught up!</div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeUp(5)} className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-info" />
              <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-1.5">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors">
                <span className="text-base flex-shrink-0">{a.icon}</span>
                <span className="text-sm text-card-foreground flex-1 truncate">{a.text}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Access & Platform Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp(6)} className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground">Quick Access</h3>
            <button onClick={() => setActiveSection("links")} className="text-xs text-primary hover:underline flex items-center gap-1">All Links <ArrowRight size={12} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {quickLinks.map(link => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/80 transition-all group hover:scale-[1.02]">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  {link.title.charAt(0)}
                </div>
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

        <motion.div {...fadeUp(7)} className="card-elevated p-5">
          <h3 className="font-semibold text-card-foreground mb-4">Platform Status</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { name: "Cloudflare", section: "cloudflare", status: "Operational", ok: true, icon: "☁️" },
              { name: "Vercel", section: "vercel", status: "Operational", ok: true, icon: "🚀" },
              { name: "Google SC", section: "seo", status: "2 warnings", ok: false, icon: "🔍" },
              { name: "OpenClaw", section: "openclaw", status: "Operational", ok: true, icon: "🐙" },
            ].map(p => (
              <button key={p.name} onClick={() => setActiveSection(p.section)}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/80 transition-all hover:scale-[1.02]">
                <span className="text-xl">{p.icon}</span>
                <div className="text-left min-w-0">
                  <div className="text-xs font-medium text-card-foreground">{p.name}</div>
                  <div className={`text-[11px] ${p.ok ? "text-success" : "text-warning"}`}>
                    {p.ok ? "🟢" : "🟡"} {p.status}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quote */}
      <motion.div {...fadeUp(8)} className="card-elevated p-6 text-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-lg font-medium text-card-foreground italic leading-relaxed">
          "{quote.text}"
        </div>
        <div className="text-sm text-muted-foreground mt-2">— {quote.author}</div>
      </motion.div>
    </div>
  );
}
