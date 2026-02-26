import { useDashboard } from "@/contexts/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, CheckSquare, Calendar, FileText, Timer,
  Globe, Github, Hammer, Link2, BarChart3,
  Search as SearchIcon, Cloud, Rocket, Bug,
  Settings, Sun, Moon, ChevronLeft, Menu, X
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
      { id: "projects", label: "Projects Tracker", icon: BarChart3 },
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
  const { activeSection, setActiveSection, sidebarOpen, setSidebarOpen, theme, toggleTheme, userName, userRole } = useDashboard();

  return (
    <>
      {/* Mobile overlay */}
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
        {/* Close on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <X size={20} />
        </button>

        {/* Profile */}
        <div className="p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-card-foreground truncate">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">{userRole}</div>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-success flex-shrink-0" />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
          {navGroups.map(group => (
            <div key={group.label}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                        ${active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`}
                    >
                      <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
