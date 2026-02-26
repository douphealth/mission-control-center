import { useDashboard } from "@/contexts/DashboardContext";
import { motion } from "framer-motion";
import { Globe, Github, Hammer, CheckSquare, TrendingUp, TrendingDown, ExternalLink, Clock } from "lucide-react";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.05 },
});

export default function DashboardHome() {
  const { websites, repos, buildProjects, tasks, links, setActiveSection } = useDashboard();

  const activeSites = websites.filter(w => w.status === "active").length;
  const openTasks = tasks.filter(t => t.status !== "done").length;
  const dueToday = tasks.filter(t => t.dueDate === new Date().toISOString().split("T")[0] && t.status !== "done").length;
  const activeBuilds = buildProjects.filter(b => b.status !== "deployed").length;

  const stats = [
    { label: "Total Websites", value: websites.length, sub: `${activeSites} active`, icon: Globe, trend: "+2", up: true },
    { label: "GitHub Repos", value: repos.length, sub: "12 commits this week", icon: Github, trend: "+5", up: true },
    { label: "Build Projects", value: buildProjects.length, sub: `${activeBuilds} in progress`, icon: Hammer, trend: "+1", up: true },
    { label: "Open Tasks", value: openTasks, sub: dueToday > 0 ? `${dueToday} due today` : "None due today", icon: CheckSquare, trend: dueToday > 0 ? `${dueToday}` : "0", up: false },
  ];

  const todayTasks = tasks.filter(t => t.status !== "done").slice(0, 5);
  const recentActivity = [
    { text: "Deployed SaaS Landing Page to Vercel", time: "2h ago", icon: "🚀" },
    { text: "Completed SSL certificate renewal", time: "5h ago", icon: "✅" },
    { text: "Pushed 3 commits to ai-mission-control", time: "8h ago", icon: "🐙" },
    { text: "Added new blog post draft", time: "1d ago", icon: "📝" },
    { text: "Updated WooCommerce to v9.2", time: "1d ago", icon: "🔌" },
    { text: "Fixed responsive layout on agency site", time: "2d ago", icon: "🔧" },
  ];

  const quickLinks = links.filter(l => l.pinned).slice(0, 6);

  const priorityColor: Record<string, string> = {
    critical: "bg-destructive",
    high: "bg-warning",
    medium: "bg-primary",
    low: "bg-success",
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(i)} className="card-elevated p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon size={20} className="text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${s.up ? "text-success" : "text-destructive"}`}>
                {s.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {s.trend}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-card-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground/70 mt-0.5">{s.sub}</div>
            </div>
            {/* Mini sparkline */}
            <svg className="mt-3 w-full h-8" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="hsl(var(--primary) / 0.3)"
                strokeWidth="2"
                points="0,25 15,20 30,22 45,15 60,18 75,10 90,12 100,5"
              />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Today's Focus & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div {...fadeUp(4)} className="card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-card-foreground">Today's Focus</h3>
            <button onClick={() => setActiveSection("tasks")} className="text-xs text-primary hover:underline">View All →</button>
          </div>
          <div className="space-y-2.5">
            {todayTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityColor[task.priority]}`} />
                <span className="text-sm text-card-foreground flex-1 truncate">{task.title}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">{task.dueDate}</span>
              </div>
            ))}
            {todayTasks.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                🎉 All caught up! No pending tasks.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeUp(5)} className="card-elevated p-5">
          <h3 className="font-semibold text-card-foreground mb-4">Recent Activity</h3>
          <div className="space-y-2.5">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                <span className="text-lg">{a.icon}</span>
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
          <h3 className="font-semibold text-card-foreground mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                  {link.title.charAt(0)}
                </div>
                <span className="text-xs font-medium text-card-foreground truncate">{link.title}</span>
                <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeUp(7)} className="card-elevated p-5">
          <h3 className="font-semibold text-card-foreground mb-4">Platform Status</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Cloudflare", status: "Operational", ok: true, icon: "☁️" },
              { name: "Vercel", status: "Operational", ok: true, icon: "🚀" },
              { name: "Google SC", status: "2 warnings", ok: false, icon: "🔍" },
              { name: "OpenClaw", status: "Operational", ok: true, icon: "🐙" },
            ].map(p => (
              <button
                key={p.name}
                onClick={() => setActiveSection(p.name.toLowerCase().replace(" ", ""))}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <span className="text-lg">{p.icon}</span>
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

      {/* Motivational Quote */}
      <motion.div {...fadeUp(8)} className="card-elevated p-6 text-center">
        <div className="text-lg font-medium text-card-foreground italic">
          "The only way to do great work is to love what you do."
        </div>
        <div className="text-sm text-muted-foreground mt-2">— Steve Jobs</div>
      </motion.div>
    </div>
  );
}
