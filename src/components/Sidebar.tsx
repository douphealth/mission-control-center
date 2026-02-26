import { useDashboard } from "@/contexts/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, CheckSquare, Calendar, FileText, Timer,
  Globe, Github, Hammer, Link2, BarChart3,
  Search as SearchIcon, Cloud, Rocket, Bug,
  Settings, Sun, Moon, X, Sparkles,
  DollarSign, Lightbulb, KeyRound
} from "lucide-react";

const navGroups = [
  {
    label: "MAIN",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "tasks", label: "Tasks", icon: CheckSquare },
      { id: "calendar", label: "Calendar", icon: Calendar },
      { id: "notes", label: "Notes", icon: FileText },
      { id: "focus", label: "Focus Timer", icon: Timer },
    ],
  },
  {
    label: "MY WORK",
    items: [
      { id: "websites", label: "My Websites", icon: Globe },
      { id: "github", label: "GitHub Projects", icon: Github },
      { id: "builds", label: "Build Projects", icon: Hammer },
      { id: "links", label: "Links Hub", icon: Link2 },
      { id: "projects", label: "Kanban Board", icon: BarChart3 },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { id: "payments", label: "Payments", icon: DollarSign },
      { id: "ideas", label: "Ideas Board", icon: Lightbulb },
      { id: "credentials", label: "Credential Vault", icon: KeyRound },
    ],
  },
  {
    label: "PLATFORMS",
    items: [
      { id: "seo", label: "SEO Center", icon: SearchIcon },
      { id: "cloudflare", label: "Cloudflare", icon: Cloud },
      { id: "vercel", label: "Vercel", icon: Rocket },
      { id: "openclaw", label: "OpenClaw", icon: Bug },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, sidebarOpen, setSidebarOpen, theme, toggleTheme, userName, userRole, tasks, payments, ideas } = useDashboard();

  const openTaskCount = tasks.filter(t => t.status !== "done").length;
  const overduePayments = payments.filter(p => p.status === "overdue").length;
  const activeIdeas = ideas.filter(i => i.status === "exploring" || i.status === "validated").length;

  const getBadge = (id: string): number | null => {
    if (id === "tasks") return openTaskCount || null;
    if (id === "payments" && overduePayments > 0) return overduePayments;
    if (id === "ideas" && activeIdeas > 0) return activeIdeas;
    return null;
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col bg-sidebar border-r border-sidebar-border
          lg:relative lg:translate-x-0 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: 260 }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <X size={20} />
        </button>

        {/* Profile */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-card-foreground truncate">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">{userRole}</div>
            </div>
            <div className="ml-auto w-2.5 h-2.5 rounded-full bg-success flex-shrink-0 animate-pulse-ring" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
          {navGroups.map(group => (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-[1.5px] text-muted-foreground/50 uppercase">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = activeSection === item.id;
                  const badge = getBadge(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group
                        ${active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                        }`}
                    >
                      <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} className={active ? "" : "group-hover:scale-110 transition-transform"} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {badge !== null && (
                        <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-muted-foreground/50">
            <Sparkles size={10} />
            <span>Mission Control v5.0</span>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent/40 transition-all duration-200"
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </motion.div>
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
